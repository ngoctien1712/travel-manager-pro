import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/db.js';
import { ROLE_CODE_TO_FRONTEND, FRONTEND_TO_ROLE_CODE } from '../utils/roleMapper.js';
import type { UserRole } from '../types/index.js';
import { NotificationService } from '../services/notification.service.js';
import { addEmailJob } from '../queues/email.queue.js';

const SALT_ROUNDS = 10;

async function getUserRole(userId: string): Promise<UserRole> {
  const { rows } = await pool.query(
    `SELECT r.code FROM roles r
     JOIN role_detail rd ON r.id_role = rd.id_role
     WHERE rd.id_user = $1
     ORDER BY CASE r.code WHEN 'ADMIN' THEN 1 WHEN 'AREA_OWNER' THEN 2 ELSE 3 END
     LIMIT 1`,
    [userId]
  );
  const code = rows[0]?.code ?? 'CUSTOMER';
  return (ROLE_CODE_TO_FRONTEND[code] ?? 'customer') as UserRole;
}

export async function listUsers(req: Request, res: Response) {
  try {
    const { page = 1, pageSize = 10, search, role, status } = req.query;
    const offset = (Number(page) - 1) * Number(pageSize);
    const limit = Math.min(Number(pageSize) || 10, 50);

    const params: unknown[] = [];
    let paramIndex = 1;
    const conditions: string[] = ['1=1'];

    if (search) {
      conditions.push(`(u.email ILIKE $${paramIndex} OR u.full_name ILIKE $${paramIndex} OR u.phone ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }
    if (status) {
      conditions.push(`u.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    const roleCode = role ? (FRONTEND_TO_ROLE_CODE[role as string] || role) : null;
    const whereClause = conditions.join(' AND ');

    let roleFilter = '';
    if (roleCode) {
      roleFilter = `AND EXISTS (
        SELECT 1 FROM role_detail rd2
        JOIN roles r2 ON rd2.id_role = r2.id_role
        WHERE rd2.id_user = u.id_user AND r2.code = $${paramIndex}
      )`;
      params.push(roleCode);
      paramIndex++;
    }

    const countParams = [...params];
    const countResult = await pool.query(
      `SELECT COUNT(*)::int as total
       FROM users u
       WHERE ${whereClause} ${roleFilter}`,
      countParams
    );
    const total = countResult.rows[0]?.total ?? 0;

    params.push(limit, offset);
    const limitParam = paramIndex;
    const offsetParam = paramIndex + 1;
    const { rows } = await pool.query(
      `SELECT u.id_user, u.email, u.phone, u.full_name, u.status, u.email_verified_at, u.created_at,
              (SELECT r2.code FROM role_detail rd2 JOIN roles r2 ON rd2.id_role = r2.id_role
               WHERE rd2.id_user = u.id_user
               ORDER BY CASE r2.code WHEN 'ADMIN' THEN 1 WHEN 'AREA_OWNER' THEN 2 ELSE 3 END
               LIMIT 1) as role_code
       FROM users u
       WHERE ${whereClause} ${roleFilter}
       ORDER BY u.created_at DESC
       LIMIT $${limitParam} OFFSET $${offsetParam}`,
      params
    );

    const data = rows.map((row) => ({
      id: row.id_user,
      email: row.email,
      phone: row.phone,
      fullName: row.full_name,
      status: row.status,
      role: ROLE_CODE_TO_FRONTEND[row.role_code] ?? 'customer',
      emailVerified: !!row.email_verified_at,
      createdAt: row.created_at,
    }));

    res.json({
      data,
      total,
      page: Number(page),
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error('List users error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

export async function getUserById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      `SELECT u.id_user, u.email, u.phone, u.full_name, u.status, u.email_verified_at, u.created_at
       FROM users u WHERE u.id_user = $1`,
      [id]
    );
    const user = rows[0];
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

    const role = await getUserRole(id);

    let profile: Record<string, unknown> = {};
    if (role === 'customer') {
      const { rows: p } = await pool.query(
        'SELECT date, travel_style FROM customer_profiles WHERE id_user = $1',
        [id]
      );
      profile = p[0] || {};
    } else if (role === 'owner') {
      const { rows: p } = await pool.query(
        'SELECT business_name FROM area_owner_profile WHERE id_user = $1',
        [id]
      );
      profile = p[0] || {};
    } else if (role === 'admin') {
      const { rows: p } = await pool.query(
        'SELECT department FROM admin_profile WHERE id_user = $1',
        [id]
      );
      profile = p[0] || {};
    }

    res.json({
      id: user.id_user,
      email: user.email,
      phone: user.phone,
      fullName: user.full_name,
      status: user.status,
      role,
      emailVerified: !!user.email_verified_at,
      profile,
      createdAt: user.created_at,
    });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

export async function updateUser(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { fullName, phone, status, role: newRole, profile: profileData } = req.body;

    await pool.query(
      'UPDATE users SET full_name = COALESCE($1, full_name), phone = COALESCE($2, phone), status = COALESCE($3, status), updated_at = NOW() WHERE id_user = $4',
      [fullName, phone, status, id]
    );

    if (newRole) {
      const roleCode = FRONTEND_TO_ROLE_CODE[newRole] || newRole;
      const { rows: roleRows } = await pool.query('SELECT id_role FROM roles WHERE code = $1', [roleCode]);
      if (roleRows.length > 0) {
        await pool.query('DELETE FROM role_detail WHERE id_user = $1', [id]);
        await pool.query(
          'INSERT INTO role_detail (id_role, id_user) VALUES ($1, $2)',
          [roleRows[0].id_role, id]
        );
      }
    }

    const role = await getUserRole(id);
    if (profileData) {
      if (role === 'customer') {
        await pool.query(
          `INSERT INTO customer_profiles (id_user, date, travel_style)
           VALUES ($1, $2, $3)
           ON CONFLICT (id_user) DO UPDATE SET date = COALESCE(EXCLUDED.date, customer_profiles.date), travel_style = COALESCE(EXCLUDED.travel_style, customer_profiles.travel_style)`,
          [id, profileData.date || null, profileData.travel_style || null]
        );
      } else if (role === 'owner') {
        await pool.query(
          `INSERT INTO area_owner_profile (id_user, business_name)
           VALUES ($1, $2)
           ON CONFLICT (id_user) DO UPDATE SET business_name = COALESCE(EXCLUDED.business_name, area_owner_profile.business_name)`,
          [id, profileData.business_name || '']
        );
      } else if (role === 'admin') {
        await pool.query(
          `INSERT INTO admin_profile (id_user, department)
           VALUES ($1, $2)
           ON CONFLICT (id_user) DO UPDATE SET department = COALESCE(EXCLUDED.department, admin_profile.department)`,
          [id, profileData.department || '']
        );
      }
    }

    const { rows } = await pool.query(
      'SELECT id_user, email, phone, full_name, status FROM users WHERE id_user = $1',
      [id]
    );
    res.json({
      id: rows[0].id_user,
      email: rows[0].email,
      phone: rows[0].phone,
      fullName: rows[0].full_name,
      status: rows[0].status,
      role: await getUserRole(id),
      profile: profileData || {},
    });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

export async function createUser(req: Request, res: Response) {
  try {
    const { email, password, fullName, phone, role, status } = req.body;

    const existing = await pool.query('SELECT id_user FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Email đã tồn tại' });
    }

    const hash = await bcrypt.hash(password || 'Password123!', SALT_ROUNDS);
    const roleCode = FRONTEND_TO_ROLE_CODE[role] || 'CUSTOMER';

    const { rows: userRows } = await pool.query(
      `INSERT INTO users (email, phone, full_name, password_hash, status, email_verified_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING id_user, email, phone, full_name, status`,
      [email, phone || null, fullName || null, hash, status || 'active']
    );
    const user = userRows[0];

    const { rows: roleRows } = await pool.query('SELECT id_role FROM roles WHERE code = $1', [roleCode]);
    if (roleRows.length > 0) {
      await pool.query(
        'INSERT INTO role_detail (id_role, id_user) VALUES ($1, $2)',
        [roleRows[0].id_role, user.id_user]
      );
    }

    if (role === 'customer') {
      await pool.query('INSERT INTO customer_profiles (id_user) VALUES ($1)', [user.id_user]);
    } else if (role === 'owner') {
      await pool.query('INSERT INTO area_owner_profile (id_user, business_name) VALUES ($1, $2)', [user.id_user, '']);
    } else if (role === 'admin') {
      await pool.query('INSERT INTO admin_profile (id_user, department) VALUES ($1, $2)', [user.id_user, '']);
    }

    res.status(201).json({
      id: user.id_user,
      email: user.email,
      phone: user.phone,
      fullName: user.full_name,
      status: user.status,
      role,
    });
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

export async function deleteUser(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (req.user!.userId === id) {
      return res.status(400).json({ message: 'Không thể xóa chính mình' });
    }
    const { rowCount } = await pool.query('DELETE FROM users WHERE id_user = $1', [id]);
    if (rowCount === 0) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    res.json({ message: 'Đã xóa người dùng' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

// ---------- Provider approval (admin) ----------
export async function listProviders(req: Request, res: Response) {
  try {
    const { status, page = 1, pageSize = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(pageSize);
    const limit = Math.min(Number(pageSize) || 20, 100);

    let where = '1=1';
    const whereParams: unknown[] = [];
    if (status) {
      where += ' AND p.status = $1';
      whereParams.push(status);
    }
    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total FROM provider p WHERE ${where}`,
      whereParams
    );
    const total = countResult.rows[0]?.total ?? 0;

    const params = [...whereParams, limit, offset];
    const limitParam = whereParams.length + 1;
    const offsetParam = whereParams.length + 2;

    const { rows } = await pool.query(
      `SELECT p.id_provider, p.name, p.phone, p.legal_documents, p.status,
              u.email, u.full_name,
              a.name AS area_name, c.name AS city_name, co.name AS country_name
       FROM provider p
       JOIN users u ON u.id_user = p.id_user
       LEFT JOIN area a ON a.id_area = p.id_area
       LEFT JOIN cities c ON c.id_city = a.id_city
       LEFT JOIN countries co ON co.id_country = c.id_country
       WHERE ${where}
       ORDER BY p.id_provider DESC
       LIMIT $${limitParam} OFFSET $${offsetParam}`,
      params
    );

    res.json({
      data: rows.map((r: Record<string, unknown>) => ({
        id: r.id_provider,
        name: r.name,
        phone: r.phone,
        legalDocuments: r.legal_documents,
        status: r.status,
        ownerEmail: r.email,
        ownerName: r.full_name,
        areaName: r.area_name,
        cityName: r.city_name,
        countryName: r.country_name,
      })),
      total,
      page: Number(page),
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error('List providers error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

export async function updateProviderStatus(req: Request, res: Response) {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['pending', 'active', 'inactive'].includes(status)) {
      return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
    }

    await client.query('BEGIN');

    const { rows: providerRows } = await client.query(
      'UPDATE provider SET status = $1 WHERE id_provider = $2 RETURNING id_provider, name, status, id_user',
      [status, id]
    );

    if (providerRows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Không tìm thấy nhà cung cấp' });
    }

    const provider = providerRows[0];

    if (status === 'active') {
      const userId = provider.id_user;

      // Ensure user has owner role
      const { rows: roleRows } = await client.query(
        "SELECT id_role FROM roles WHERE code = 'AREA_OWNER'"
      );
      if (roleRows.length > 0) {
        // Check if already has role
        const { rows: hasRole } = await client.query(
          "SELECT 1 FROM role_detail WHERE id_user = $1 AND id_role = $2",
          [userId, roleRows[0].id_role]
        );
        if (hasRole.length === 0) {
          await client.query(
            'INSERT INTO role_detail (id_role, id_user) VALUES ($1, $2)',
            [roleRows[0].id_role, userId]
          );
        }
      }

      // Ensure area_owner_profile exists
      await client.query(
        `INSERT INTO area_owner_profile (id_user, business_name)
         VALUES ($1, $2)
         ON CONFLICT (id_user) DO NOTHING`,
        [userId, provider.name]
      );
    }

    await client.query('COMMIT');

    res.json({
      id: provider.id_provider,
      name: provider.name,
      status: provider.status,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Update provider status error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  } finally {
    client.release();
  }
}

export async function listPendingBusinessRegistrations(req: Request, res: Response) {
  try {
    const { rows } = await pool.query(
      `SELECT u.id_user, u.email, u.full_name, u.phone, u.status AS user_status, u.created_at,
              p.id_provider, p.name AS business_name, p.service_type, p.legal_documents, p.status AS provider_status,
              p.bank_name, p.bank_account_number, p.bank_account_name,
              a.name AS area_name, c.name AS city_name
       FROM users u
       JOIN provider p ON u.id_user = p.id_user
       LEFT JOIN area a ON p.id_area = a.id_area
       LEFT JOIN cities c ON a.id_city = c.id_city
       WHERE u.status = 'pending'
       ORDER BY u.created_at DESC`
    );
    res.json({ data: rows });
  } catch (err) {
    console.error('List pending business error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

export async function approveBusinessAccount(req: Request, res: Response) {
  const client = await pool.connect();
  try {
    const { userId } = req.params;

    await client.query('BEGIN');

    // 1. Update user status
    const { rows: userRows } = await client.query(
      "UPDATE users SET status = 'active', updated_at = NOW() WHERE id_user = $1 AND status = 'pending' RETURNING id_user, email",
      [userId]
    );

    if (userRows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Không tìm thấy tài khoản chờ duyệt hoặc tài khoản đã được duyệt' });
    }

    // 2. Upgrade role to AREA_OWNER
    const { rows: roleRows } = await client.query("SELECT id_role FROM roles WHERE code = 'AREA_OWNER'");
    if (roleRows.length > 0) {
      await client.query(
        "INSERT INTO role_detail (id_role, id_user) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [roleRows[0].id_role, userId]
      );
    }

    // 3. Ensure area_owner_profile exists
    const { rows: providerRows } = await client.query(
      "SELECT name FROM provider WHERE id_user = $1 LIMIT 1",
      [userId]
    );
    const businessName = providerRows[0]?.name || 'Doanh nghiệp mới';

    await client.query(
      `INSERT INTO area_owner_profile (id_user, business_name)
       VALUES ($1, $2)
       ON CONFLICT (id_user) DO UPDATE SET business_name = EXCLUDED.business_name`,
      [userId, businessName]
    );

    await client.query('COMMIT');
    res.json({ message: 'Đã duyệt tài khoản đối tác thành công. Người dùng hiện có thể đăng nhập.' });

  } catch (err) {
    if (client) await client.query('ROLLBACK');
    console.error('Approve business account error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  } finally {
    if (client) client.release();
  }
}

// ---------- Dashboard Statistics (No more mock data) ----------
export async function getAdminDashboardStats(req: Request, res: Response) {
  try {
    const totalUsers = await pool.query("SELECT COUNT(*)::int as total FROM users");
    const totalOrders = await pool.query("SELECT COUNT(*)::int as total FROM \"order\" WHERE status IN ('confirmed', 'processing', 'completed')");
    const revenueStats = await pool.query(`
      SELECT 
        SUM(total_amount) as total_revenue,
        SUM(commission_amount) as total_commission,
        SUM(owner_amount) as total_owner_share
      FROM "order" 
      WHERE status IN ('confirmed', 'processing', 'completed')
    `);

    const recentBookings = await pool.query(`
      SELECT o.id_order, o.order_code, o.total_amount, o.create_at, o.status, u.full_name as user_name, p.name as provider_name
      FROM "order" o
      JOIN users u ON o.id_user = u.id_user
      LEFT JOIN provider p ON o.id_provider = p.id_provider
      ORDER BY o.create_at DESC
      LIMIT 10
    `);

    // Chart data: Last 30 days revenue
    const chartData = await pool.query(`
      WITH date_series AS (
        SELECT generate_series(
          CURRENT_DATE - INTERVAL '29 days',
          CURRENT_DATE,
          '1 day'::interval
        )::date as day
      )
      SELECT 
        ds.day,
        COALESCE(SUM(o.total_amount), 0) as revenue,
        COALESCE(SUM(o.commission_amount), 0) as commission
      FROM date_series ds
      LEFT JOIN "order" o ON ds.day = o.create_at::date AND o.status IN ('confirmed', 'processing', 'completed')
      GROUP BY ds.day
      ORDER BY ds.day ASC
    `);

    res.json({
      summary: {
        totalUsers: totalUsers.rows[0].total,
        totalOrders: totalOrders.rows[0].total,
        totalRevenue: Number(revenueStats.rows[0].total_revenue || 0),
        totalCommission: Number(revenueStats.rows[0].total_commission || 0),
        totalOwnerShare: Number(revenueStats.rows[0].total_owner_share || 0)
      },
      chartData: chartData.rows.map(r => ({
        date: r.day.toISOString().split('T')[0],
        revenue: Number(r.revenue),
        commission: Number(r.commission)
      })),
      recentBookings: recentBookings.rows
    });
  } catch (err) {
    console.error('Get dashboard stats error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

// ---------- Payroll Management ----------
export async function getPayrollStats(req: Request, res: Response) {
  try {
    const { rows } = await pool.query(`
      SELECT 
        p.id_provider, p.name, p.bank_name, p.bank_account_number, p.bank_account_name,
        COUNT(o.id_order) as pending_orders,
        SUM(o.owner_amount) as total_pending_amount
      FROM provider p
      JOIN "order" o ON p.id_provider = o.id_provider
      WHERE o.status IN ('confirmed', 'processing', 'completed') AND o.payroll_status = 'pending'
      GROUP BY p.id_provider, p.name
      ORDER BY total_pending_amount DESC
    `);
    res.json({ data: rows });
  } catch (err) {
    console.error('Get payroll stats error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

export async function getProviderOrdersForPayroll(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(`
      SELECT 
        o.id_order, o.order_code, o.total_amount, o.commission_amount, o.owner_amount, o.create_at, o.order_type,
        COALESCE(tour.title, hotel.title, bus.title, 'Dịch vụ') as service_name
      FROM "order" o
      LEFT JOIN order_tour_detail otd ON o.id_order = otd.id_order
      LEFT JOIN bookable_items tour ON otd.id_item = tour.id_item
      LEFT JOIN order_accommodations_detail oad ON o.id_order = oad.id_order
      LEFT JOIN accommodations_rooms ar ON oad.id_room = ar.id_room
      LEFT JOIN bookable_items hotel ON ar.id_item = hotel.id_item
      LEFT JOIN order_pos_vehicle_detail ovd ON o.id_order = ovd.id_order
      LEFT JOIN positions p ON ovd.id_position = p.id_position
      LEFT JOIN vehicle v ON p.id_vehicle = v.id_vehicle
      LEFT JOIN bookable_items bus ON v.id_item = bus.id_item
      WHERE o.id_provider = $1 AND o.status IN ('confirmed', 'processing', 'completed') AND o.payroll_status = 'pending'
      ORDER BY o.create_at ASC`,
      [id]
    );
    res.json({ data: rows });
  } catch (err) {
    console.error('Get provider orders for payroll error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

export async function processPayroll(req: Request, res: Response) {
  const client = await pool.connect();
  try {
    const { providerId, orderIds, totalAmount, commissionTotal, transactionProof } = req.body;

    if (!orderIds || orderIds.length === 0) {
      return res.status(400).json({ message: 'Không có hóa đơn nào để thanh toán' });
    }

    await client.query('BEGIN');

    // 1. Get Provider info for notification and bank snapshot
    const { rows: providerRows } = await client.query(
      'SELECT id_provider, id_user, name, bank_name, bank_account_number, bank_account_name FROM provider WHERE id_provider = $1',
      [providerId]
    );
    const provider = providerRows[0];

    // 2. Create Transaction record
    const { rows: transRows } = await client.query(`
      INSERT INTO payroll_transactions (id_provider, amount, commission_total, transaction_proof, bank_info, status)
      VALUES ($1, $2, $3, $4, $5, 'completed')
      RETURNING id_payroll`,
      [providerId, totalAmount, commissionTotal, transactionProof || null, JSON.stringify({
        bankName: provider.bank_name,
        accountNumber: provider.bank_account_number,
        accountName: provider.bank_account_name
      })]
    );
    const idPayroll = transRows[0].id_payroll;

    // 3. Update Orders
    await client.query(`
      UPDATE "order" 
      SET payroll_status = 'completed', id_payroll = $1 
      WHERE id_order = ANY($2::uuid[])`,
      [idPayroll, orderIds]
    );

    // 4. Send Notifications
    await NotificationService.create({
      userId: provider.id_user,
      title: 'Nhận thanh toán doanh thu',
      message: `Bạn đã được thanh toán ${totalAmount.toLocaleString('vi-VN')} VND cho ${orderIds.length} đơn hàng qua ${provider.bank_name}.`,
      type: 'success'
    });

    // Notify all admins
    const admins = await client.query("SELECT u.id_user FROM users u JOIN role_detail rd ON u.id_user = rd.id_user JOIN roles r ON rd.id_role = r.id_role WHERE r.code = 'ADMIN'");
    for (const admin of admins.rows) {
      await NotificationService.create({
        userId: admin.id_user,
        title: 'Thanh toán đối tác thành công',
        message: `Đã hoàn tất thanh toán ${totalAmount.toLocaleString('vi-VN')} VND cho đối tác ${provider.name}.`,
        type: 'success'
      });
    }

    await client.query('COMMIT');
    res.json({ success: true, idPayroll });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Process payroll error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  } finally {
    client.release();
  }
}

export async function getPayrollHistory(req: Request, res: Response) {
  try {
    const { rows } = await pool.query(`
      SELECT 
        pt.*, 
        p.name as provider_name,
        (SELECT COUNT(*) FROM "order" o WHERE o.id_payroll = pt.id_payroll) as order_count
      FROM payroll_transactions pt
      JOIN provider p ON pt.id_provider = p.id_provider
      ORDER BY pt.created_at DESC
    `);
    res.json({ data: rows });
  } catch (err) {
    console.error('Get payroll history error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

export async function getPaidOrdersHistory(req: Request, res: Response) {
  try {
    const { rows } = await pool.query(`
      SELECT 
        o.id_order, o.order_code, o.total_amount, o.commission_amount, o.owner_amount, o.create_at,
        p.name as provider_name,
        pt.created_at as paid_at,
        COALESCE(tour.title, hotel.title, bus.title, 'Dịch vụ') as service_name
      FROM "order" o
      JOIN provider p ON o.id_provider = p.id_provider
      JOIN payroll_transactions pt ON o.id_payroll = pt.id_payroll
      LEFT JOIN order_tour_detail otd ON o.id_order = otd.id_order
      LEFT JOIN bookable_items tour ON otd.id_item = tour.id_item
      LEFT JOIN order_accommodations_detail oad ON o.id_order = oad.id_order
      LEFT JOIN accommodations_rooms ar ON oad.id_room = ar.id_room
      LEFT JOIN bookable_items hotel ON ar.id_item = hotel.id_item
      LEFT JOIN order_pos_vehicle_detail ovd ON o.id_order = ovd.id_order
      LEFT JOIN positions pos ON ovd.id_position = pos.id_position
      LEFT JOIN vehicle v ON pos.id_vehicle = v.id_vehicle
      LEFT JOIN bookable_items bus ON v.id_item = bus.id_item
      WHERE o.payroll_status = 'completed'
      ORDER BY pt.created_at DESC
    `);
    res.json({ data: rows });
  } catch (err) {
    console.error('Get paid orders history error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

// ---------- Owner Activity Monitoring ----------
export async function listActivityProviders(req: Request, res: Response) {
  try {
    const { search, startDate, endDate } = req.query;

    let queryParams: any[] = [];
    let whereConditions: string[] = [];

    if (search) {
      queryParams.push(`%${search}%`);
      whereConditions.push(`(p.name ILIKE $${queryParams.length})`);
    }

    const start = startDate ? String(startDate) : '1970-01-01';
    const end = endDate ? String(endDate) : '2099-12-31';
    queryParams.push(start, end);
    const dateRangeIdx = [queryParams.length - 1, queryParams.length];

    const { rows } = await pool.query(`
      SELECT p.id_provider, p.name, p.service_type, u.full_name as owner_name,
             (SELECT COUNT(*) FROM bookable_items bi WHERE bi.id_provider = p.id_provider AND bi.created_at >= $${dateRangeIdx[0]} AND bi.created_at <= $${dateRangeIdx[1]}) as service_count,
             (SELECT COUNT(*) FROM voucher v WHERE v.id_provider = p.id_provider AND v.created_at >= $${dateRangeIdx[0]} AND v.created_at <= $${dateRangeIdx[1]}) as voucher_count
      FROM provider p
      JOIN users u ON p.id_user = u.id_user
      ${whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : ''}
      ORDER BY p.name ASC
    `, queryParams);

    res.json({ data: rows });
  } catch (err) {
    console.error('List activity providers error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

export async function getProviderActivityItems(req: Request, res: Response) {
  try {
    const { id_provider } = req.params;
    const { startDate, endDate } = req.query;

    const start = startDate ? String(startDate) : '1970-01-01';
    const end = endDate ? String(endDate) : '2099-12-31';

    const services = await pool.query(`
      SELECT * FROM bookable_items 
      WHERE id_provider = $1 AND created_at >= $2 AND created_at <= $3 
      ORDER BY created_at DESC`,
      [id_provider, start, end]
    );

    const vouchers = await pool.query(`
      SELECT v.*, bi.title as item_title 
      FROM voucher v
      LEFT JOIN bookable_items bi ON v.id_item = bi.id_item
      WHERE v.id_provider = $1 AND v.created_at >= $2 AND v.created_at <= $3 
      ORDER BY v.created_at DESC`,
      [id_provider, start, end]
    );

    res.json({ services: services.rows, vouchers: vouchers.rows });
  } catch (err) {
    console.error('Get provider activity items error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

export async function updateActivityItemStatus(req: Request, res: Response) {
  try {
    const { type, id } = req.params; // type = 'service' | 'voucher'
    const { status } = req.body;

    if (type === 'service') {
      await pool.query('UPDATE bookable_items SET status = $1, last_updated = NOW() WHERE id_item = $2', [status, id]);
    } else if (type === 'voucher') {
      await pool.query('UPDATE voucher SET status = $1, updated_at = NOW() WHERE id_voucher = $2', [status, id]);
    } else {
      return res.status(400).json({ message: 'Loại item không hợp lệ' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Update activity item status error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

export async function updateActivityItemDetails(req: Request, res: Response) {
  try {
    const { type, id } = req.params;
    const body = req.body;

    if (type === 'service') {
      await pool.query(
        'UPDATE bookable_items SET title = $1, price = $2, last_updated = NOW() WHERE id_item = $3',
        [body.title, body.price, id]
      );
    } else if (type === 'voucher') {
      await pool.query(
        'UPDATE voucher SET name = $1, discount_value = $2, updated_at = NOW() WHERE id_voucher = $3',
        [body.name, body.discount_value, id]
      );
    } else {
      return res.status(400).json({ message: 'Loại item không hợp lệ' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Update activity item details error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}
// ---------- Refund Management ----------
export async function listRefundRequests(req: Request, res: Response) {
  try {
    const { status = 'pending' } = req.query;
    const { rows } = await pool.query(
      `SELECT rr.*, o.order_code, u.full_name as customer_name, u.email as customer_email
       FROM refund_requests rr
       JOIN "order" o ON rr.id_order = o.id_order
       JOIN users u ON rr.id_user = u.id_user
       WHERE rr.status = $1
       ORDER BY rr.created_at DESC`,
      [status]
    );
    res.json({ data: rows });
  } catch (err) {
    console.error('List refund requests error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

export async function approveRefund(req: Request, res: Response) {
  const client = await pool.connect();
  try {
    const { id } = req.params; // id_refund_request
    const { adminNote } = req.body;
    const adminId = req.user!.userId;

    await client.query('BEGIN');

    // 1. Get refund request details
    const { rows: rrRows } = await client.query(
      `SELECT rr.*, o.order_code, o.id_order, o.total_amount, u.full_name as customer_name, u.email as customer_email, o.id_voucher
       FROM refund_requests rr
       JOIN "order" o ON rr.id_order = o.id_order
       JOIN users u ON rr.id_user = u.id_user
       WHERE rr.id_refund_request = $1 AND rr.status = 'pending'`,
      [id]
    );

    if (rrRows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Không tìm thấy yêu cầu hoàn tiền hoặc yêu cầu đã được xử lý' });
    }

    const rr = rrRows[0];

    // 2. Perform automated refund (Simulated API call)
    // In a real system, this is where you'd call Momo/ZaloPay/Stripe Refund API
    console.log(`[REFUND] Calling payment gateway to refund ${rr.amount} VND for order ${rr.order_code}`);
    
    // 3. Update refund request status
    await client.query(
      `UPDATE refund_requests SET status = 'approved', admin_note = $1, id_admin = $2, updated_at = NOW()
       WHERE id_refund_request = $3`,
      [adminNote || 'Đã phê duyệt hoàn tiền', adminId, id]
    );

    // 4. Update order and payment status
    await client.query(
      `UPDATE "order" SET status = 'refunded' WHERE id_order = $1`,
      [rr.id_order]
    );
    
    // Check if there's a payment record to update
    const { rows: payRows } = await client.query(
        'SELECT id_pay FROM payments WHERE id_order = $1 ORDER BY paid_at DESC LIMIT 1',
        [rr.id_order]
    );
    const idPay = payRows[0]?.id_pay;

    if (idPay) {
        await client.query(
            "UPDATE payments SET status = 'refunded' WHERE id_pay = $1",
            [idPay]
        );
        
        // Record in refunds table as per schema
        await client.query(
            `INSERT INTO refunds (amount, status, reason_code, id_pay, id_refund_request)
             VALUES ($1, $2, $3, $4, $5)`,
            [rr.amount, 'completed', rr.reason || 'Requested by customer', idPay, rr.id_refund_request]
        );
    }

    // 5. Release Inventory (Implicit via status='refunded' in booking queries)
    // However, if we used vouchers, we should return them
    if (rr.id_voucher) {
        await client.query(
            `UPDATE voucher SET 
                quantity = CASE WHEN quantity IS NOT NULL THEN quantity + 1 ELSE quantity END,
                quantity_pay = GREATEST(0, COALESCE(quantity_pay, 0) - 1)
             WHERE id_voucher = $1`,
            [rr.id_voucher]
        );
    }

    // 6. Send Notifications
    await NotificationService.create({
      userId: rr.id_user,
      title: 'Yêu cầu hoàn tiền đã được xử lý',
      message: `Đơn hàng ${rr.order_code} của bạn đã được hoàn tiền ${rr.amount.toLocaleString('vi-VN')} VND.`,
      type: 'success'
    });

    // Send Email via Queue
    await addEmailJob('refund', {
      email: rr.customer_email,
      customerName: rr.customer_name,
      orderCode: rr.order_code,
      amount: parseFloat(rr.amount)
    });

    await client.query('COMMIT');
    res.json({ success: true, message: 'Đã hoàn tiền thành công' });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Approve refund error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi xử lý hoàn tiền' });
  } finally {
    client.release();
  }
}
