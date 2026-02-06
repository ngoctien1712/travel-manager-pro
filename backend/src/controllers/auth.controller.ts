import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { validationResult } from 'express-validator';
import pool from '../config/db.js';
import { ROLE_CODE_TO_FRONTEND } from '../utils/roleMapper.js';
import type { UserRole } from '../types/index.js';

const SALT_ROUNDS = 10;

// Helper: get user primary role
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

export async function register(req: Request, res: Response) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { email, password, fullName, phone, role } = req.body;

    const existing = await pool.query('SELECT id_user FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Email đã tồn tại' });
    }

    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const { rows: userRows } = await pool.query(
      `INSERT INTO users (email, phone, full_name, password_hash, status, verification_token)
       VALUES ($1, $2, $3, $4, 'pending', $5)
       RETURNING id_user, email, phone, full_name, status, created_at`,
      [email, phone || null, fullName || null, hash, verificationToken]
    );
    const user = userRows[0];

    const roleMap: Record<string, string> = {
      admin: 'ADMIN',
      customer: 'CUSTOMER',
      owner: 'AREA_OWNER',
    };
    const roleCode = roleMap[role] || 'CUSTOMER';

    const { rows: roleRows } = await pool.query(
      'SELECT id_role FROM roles WHERE code = $1',
      [roleCode]
    );
    if (roleRows.length > 0) {
      await pool.query(
        'INSERT INTO role_detail (id_role, id_user) VALUES ($1, $2)',
        [roleRows[0].id_role, user.id_user]
      );
    }

    if (role === 'customer') {
      await pool.query(
        'INSERT INTO customer_profiles (id_user) VALUES ($1)',
        [user.id_user]
      );
    } else if (role === 'owner') {
      await pool.query(
        'INSERT INTO area_owner_profile (id_user, business_name) VALUES ($1, $2)',
        [user.id_user, '']
      );
    } else if (role === 'admin') {
      await pool.query(
        'INSERT INTO admin_profile (id_user, department) VALUES ($1, $2)',
        [user.id_user, '']
      );
    }

    const userRole = await getUserRole(user.id_user);
    const secret = process.env.JWT_SECRET || 'default-secret';
    const signOptions: SignOptions = { expiresIn: 604800 }; // 7 days in seconds
    const token = jwt.sign(
      { userId: user.id_user, email: user.email, role: userRole },
      secret,
      signOptions
    );

    res.status(201).json({
      user: {
        id: user.id_user,
        email: user.email,
        fullName: user.full_name,
        phone: user.phone,
        role: userRole,
        status: user.status,
      },
      token,
      message: 'Đăng ký thành công. Vui lòng xác thực email.',
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body;

    const { rows } = await pool.query(
      'SELECT id_user, email, full_name, phone, password_hash, status, email_verified_at FROM users WHERE email = $1',
      [email]
    );
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
    }
    if (user.status === 'banned') {
      return res.status(403).json({ message: 'Tài khoản đã bị khóa' });
    }
    if (user.status === 'pending') {
      return res.status(403).json({
        message: 'Vui lòng xác thực email trước khi đăng nhập. Kiểm tra hộp thư hoặc spam.',
      });
    }

    const role = await getUserRole(user.id_user);
    const secret = process.env.JWT_SECRET || 'default-secret';
    const signOptions: SignOptions = { expiresIn: 604800 }; // 7 days in seconds
    const token = jwt.sign(
      { userId: user.id_user, email: user.email, role },
      secret,
      signOptions
    );

    res.json({
      user: {
        id: user.id_user,
        email: user.email,
        fullName: user.full_name,
        phone: user.phone,
        role,
        status: user.status,
      },
      token,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

export async function logout(_req: Request, res: Response) {
  res.json({ message: 'Đăng xuất thành công' });
}

export async function forgotPassword(req: Request, res: Response) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { email } = req.body;

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    const { rowCount } = await pool.query(
      `UPDATE users SET reset_password_token = $1, reset_password_expires = $2
       WHERE email = $3`,
      [resetToken, resetExpires, email]
    );

    if (rowCount === 0) {
      return res.status(404).json({ message: 'Email không tồn tại' });
    }

    // TODO: Send email with reset link. For now return token (dev only)
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    res.json({
      message: 'Hướng dẫn đặt lại mật khẩu đã được gửi đến email',
      resetLink: process.env.NODE_ENV === 'development' ? resetLink : undefined,
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

export async function resetPassword(req: Request, res: Response) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { token, password } = req.body;

    const { rows } = await pool.query(
      `SELECT id_user FROM users
       WHERE reset_password_token = $1 AND reset_password_expires > NOW()`,
      [token]
    );
    if (rows.length === 0) {
      return res.status(400).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
    }

    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    await pool.query(
      `UPDATE users SET password_hash = $1, reset_password_token = NULL, reset_password_expires = NULL, updated_at = NOW()
       WHERE id_user = $2`,
      [hash, rows[0].id_user]
    );

    res.json({ message: 'Đặt lại mật khẩu thành công' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

export async function verifyAccount(req: Request, res: Response) {
  try {
    const { token } = req.body;

    const { rows } = await pool.query(
      'SELECT id_user FROM users WHERE verification_token = $1',
      [token]
    );
    if (rows.length === 0) {
      return res.status(400).json({ message: 'Token xác thực không hợp lệ' });
    }

    await pool.query(
      `UPDATE users SET email_verified_at = NOW(), verification_token = NULL, status = 'active', updated_at = NOW()
       WHERE id_user = $1`,
      [rows[0].id_user]
    );

    res.json({ message: 'Xác thực tài khoản thành công' });
  } catch (err) {
    console.error('Verify error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}
