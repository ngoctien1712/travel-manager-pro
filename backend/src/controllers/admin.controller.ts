import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/db.js';
import { ROLE_CODE_TO_FRONTEND, FRONTEND_TO_ROLE_CODE } from '../utils/roleMapper.js';
import type { UserRole } from '../types/index.js';

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

// ---------- Area ownerships (admin approval) ----------
export async function listAreaOwnerships(req: Request, res: Response) {
  try {
    const { status, page = 1, pageSize = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(pageSize);
    const limit = Math.min(Number(pageSize) || 20, 100);

    let where = '1=1';
    const whereParams: unknown[] = [];
    if (status) {
      where += ' AND ao.status = $1';
      whereParams.push(status);
    }
    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total FROM area_owners ao WHERE ${where}`,
      whereParams
    );
    const total = countResult.rows[0]?.total ?? 0;

    const params = [...whereParams, limit, offset];
    const limitParam = whereParams.length + 1;
    const offsetParam = whereParams.length + 2;

    const { rows } = await pool.query(
      `SELECT ao.id_area_owner, ao.id_area, ao.id_user, ao.status,
              u.email, u.full_name, u.phone,
              a.name AS area_name, c.name AS city_name, co.name AS country_name
       FROM area_owners ao
       JOIN users u ON u.id_user = ao.id_user
       JOIN area a ON a.id_area = ao.id_area
       JOIN cities c ON c.id_city = a.id_city
       JOIN countries co ON co.id_country = c.id_country
       WHERE ${where}
       ORDER BY ao.id_area_owner DESC
       LIMIT $${limitParam} OFFSET $${offsetParam}`,
      params
    );

    res.json({
      data: rows.map((r: Record<string, unknown>) => ({
        id: r.id_area_owner,
        areaId: r.id_area,
        userId: r.id_user,
        status: r.status,
        email: r.email,
        fullName: r.full_name,
        phone: r.phone,
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
    console.error('List area ownerships error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

export async function updateAreaOwnershipStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['pending', 'active', 'inactive'].includes(status)) {
      return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
    }
    const { rows } = await pool.query(
      'UPDATE area_owners SET status = $1 WHERE id_area_owner = $2 RETURNING id_area_owner, id_area, id_user, status',
      [status, id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy đăng ký khu vực' });
    res.json({
      id: rows[0].id_area_owner,
      areaId: rows[0].id_area,
      userId: rows[0].id_user,
      status: rows[0].status,
    });
  } catch (err) {
    console.error('Update area ownership status error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}
