import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/db.js';
import { ROLE_CODE_TO_FRONTEND } from '../utils/roleMapper.js';
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

export async function getProfile(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;
    const { rows } = await pool.query(
      `SELECT u.id_user, u.email, u.phone, u.full_name, u.status, u.email_verified_at, u.created_at
       FROM users u WHERE u.id_user = $1`,
      [userId]
    );
    const user = rows[0];
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

    const role = await getUserRole(userId);

    let profile: Record<string, unknown> = {};
    if (role === 'customer') {
      const { rows: p } = await pool.query(
        'SELECT date, travel_style FROM customer_profiles WHERE id_user = $1',
        [userId]
      );
      profile = p[0] || {};
    } else if (role === 'owner') {
      const { rows: p } = await pool.query(
        'SELECT business_name FROM area_owner_profile WHERE id_user = $1',
        [userId]
      );
      profile = p[0] || {};
    } else if (role === 'admin') {
      const { rows: p } = await pool.query(
        'SELECT department FROM admin_profile WHERE id_user = $1',
        [userId]
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
    console.error('Get profile error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

export async function updateProfile(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;
    const { fullName, phone, ...profileData } = req.body;

    await pool.query(
      'UPDATE users SET full_name = COALESCE($1, full_name), phone = COALESCE($2, phone), updated_at = NOW() WHERE id_user = $3',
      [fullName, phone, userId]
    );

    const role = await getUserRole(userId);
    if (role === 'customer' && (profileData.travel_style !== undefined || profileData.date)) {
      await pool.query(
        `INSERT INTO customer_profiles (id_user, date, travel_style)
         VALUES ($1, $2, $3)
         ON CONFLICT (id_user) DO UPDATE SET date = COALESCE(EXCLUDED.date, customer_profiles.date), travel_style = COALESCE(EXCLUDED.travel_style, customer_profiles.travel_style)`,
        [userId, profileData.date || null, profileData.travel_style || null]
      );
    } else if (role === 'owner' && profileData.business_name !== undefined) {
      await pool.query(
        `INSERT INTO area_owner_profile (id_user, business_name)
         VALUES ($1, $2)
         ON CONFLICT (id_user) DO UPDATE SET business_name = COALESCE(EXCLUDED.business_name, area_owner_profile.business_name)`,
        [userId, profileData.business_name || '']
      );
    } else if (role === 'admin' && profileData.department !== undefined) {
      await pool.query(
        `INSERT INTO admin_profile (id_user, department)
         VALUES ($1, $2)
         ON CONFLICT (id_user) DO UPDATE SET department = COALESCE(EXCLUDED.department, admin_profile.department)`,
        [userId, profileData.department || '']
      );
    }

    const { rows } = await pool.query(
      'SELECT id_user, email, phone, full_name, status FROM users WHERE id_user = $1',
      [userId]
    );
    res.json({
      id: rows[0].id_user,
      email: rows[0].email,
      phone: rows[0].phone,
      fullName: rows[0].full_name,
      status: rows[0].status,
      role,
      profile: profileData,
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

export async function changePassword(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;
    const { currentPassword, newPassword } = req.body;

    const { rows } = await pool.query(
      'SELECT password_hash FROM users WHERE id_user = $1',
      [userId]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    const valid = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!valid) return res.status(400).json({ message: 'Mật khẩu hiện tại không đúng' });

    const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id_user = $2',
      [hash, userId]
    );

    res.json({ message: 'Đổi mật khẩu thành công' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}
