import crypto from 'crypto';
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import pool from '../config/db.js';
import { ROLE_CODE_TO_FRONTEND } from '../utils/roleMapper.js';
import type { UserRole } from '../types/index.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken
} from '../utils/token.js';
import { OAuth2Client } from 'google-auth-library';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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
      `INSERT INTO users (email, phone, full_name, password_hash, status, verification_token, auth_provider)
       VALUES ($1, $2, $3, $4, 'pending', $5, 'local')
       RETURNING id_user, email, phone, full_name, status, created_at`,
      [email, phone || null, fullName || null, hash, verificationToken]
    );
    const user = userRows[0];

    // Force CUSTOMER role
    const roleCode = 'CUSTOMER';

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

    await pool.query(
      'INSERT INTO customer_profiles (id_user) VALUES ($1)',
      [user.id_user]
    );

    const userRole = await getUserRole(user.id_user);
    const accessToken = generateAccessToken({
      userId: user.id_user,
      email: user.email,
      role: userRole
    });
    const refreshToken = await generateRefreshToken(user.id_user);

    res.status(201).json({
      user: {
        id: user.id_user,
        email: user.email,
        fullName: user.full_name,
        phone: user.phone,
        role: userRole,
        status: user.status,
      },
      accessToken,
      refreshToken,
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
    if (!user || !user.password_hash || !(await bcrypt.compare(password, user.password_hash))) {
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
    const accessToken = generateAccessToken({
      userId: user.id_user,
      email: user.email,
      role
    });
    const refreshToken = await generateRefreshToken(user.id_user);

    res.json({
      user: {
        id: user.id_user,
        email: user.email,
        fullName: user.full_name,
        phone: user.phone,
        role,
        status: user.status,
      },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

export async function logout(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }
    res.json({ message: 'Đăng xuất thành công' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

export async function googleLogin(req: Request, res: Response) {
  try {
    const { idToken, accessToken: googleAccessToken } = req.body;
    let email: string | undefined;
    let googleId: string | undefined;
    let name: string | undefined;
    let picture: string | undefined;

    if (idToken) {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      if (payload) {
        email = payload.email;
        googleId = payload.sub;
        name = payload.name;
        picture = payload.picture;
      }
    } else if (googleAccessToken) {
      // Fetch user info using access token
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${googleAccessToken}` },
      });
      if (response.ok) {
        const payload = await response.json();
        email = payload.email;
        googleId = payload.sub;
        name = payload.name;
        picture = payload.picture;
      }
    }

    if (!email) {
      return res.status(400).json({ message: 'Xác thực Google thất bại' });
    }

    // Check if user exists
    let { rows } = await pool.query(
      'SELECT id_user, email, full_name, status, auth_provider FROM users WHERE email = $1',
      [email]
    );

    let user = rows[0];

    if (!user) {
      // Create new user with a random/default password hash to satisfy NOT NULL
      // They authenticate via Google, so this password won't be used for local login
      const randomPassword = crypto.randomBytes(16).toString('hex');
      const hash = await bcrypt.hash(randomPassword, SALT_ROUNDS);

      const { rows: newUserRows } = await pool.query(
        `INSERT INTO users (email, full_name, status, auth_provider, google_id, email_verified_at, password_hash)
         VALUES ($1, $2, 'active', 'google', $3, NOW(), $4)
         RETURNING id_user, email, full_name, status`,
        [email, name, googleId, hash]
      );
      user = newUserRows[0];

      // Assign CUSTOMER role
      const { rows: roleRows } = await pool.query(
        "SELECT id_role FROM roles WHERE code = 'CUSTOMER'"
      );
      if (roleRows.length > 0) {
        await pool.query(
          'INSERT INTO role_detail (id_role, id_user) VALUES ($1, $2)',
          [roleRows[0].id_role, user.id_user]
        );
      }

      // Create profile
      await pool.query('INSERT INTO customer_profiles (id_user) VALUES ($1)', [user.id_user]);
    } else {
      // Update google_id if not set
      if (!user.google_id) {
        await pool.query(
          'UPDATE users SET google_id = $1, auth_provider = $2 WHERE id_user = $3',
          [googleId, user.auth_provider === 'local' ? 'local' : 'google', user.id_user]
        );
      }
    }

    if (user.status === 'banned') {
      return res.status(403).json({ message: 'Tài khoản đã bị khóa' });
    }

    const role = await getUserRole(user.id_user);
    const accessToken = generateAccessToken({
      userId: user.id_user,
      email: user.email,
      role
    });
    const refreshToken = await generateRefreshToken(user.id_user);

    res.json({
      user: {
        id: user.id_user,
        email: user.email,
        fullName: user.full_name,
        role,
        status: user.status,
        picture
      },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error('Google login error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

export async function refreshToken(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: 'Thiếu refresh token' });
    }

    // Verify token exists in DB
    const { rows } = await pool.query(
      'SELECT id_user FROM user_refresh_tokens WHERE token = $1 AND expires_at > NOW()',
      [refreshToken]
    );
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Refresh token không hợp lệ hoặc đã hết hạn' });
    }

    const { userId } = verifyRefreshToken(refreshToken);

    const { rows: userRows } = await pool.query(
      'SELECT id_user, email FROM users WHERE id_user = $1',
      [userId]
    );
    if (userRows.length === 0) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }

    const user = userRows[0];
    const role = await getUserRole(user.id_user);

    const newAccessToken = generateAccessToken({
      userId: user.id_user,
      email: user.email,
      role
    });

    // Rotate refresh token (optional but recommended)
    await revokeRefreshToken(refreshToken);
    const newRefreshToken = await generateRefreshToken(user.id_user);

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (err) {
    console.error('Refresh token error:', err);
    res.status(401).json({ message: 'Refresh token không hợp lệ' });
  }
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

export async function registerBusiness(req: Request, res: Response) {
  const client = await pool.connect();
  try {
    const {
      email, password, fullName, phone,
      businessName, areaId, businessPhone, contactEmail, fanpage, serviceType,
      bankName, bankAccountNumber, bankAccountName
    } = req.body;

    // Handle multiple files for legal documents
    const files = req.files as Express.Multer.File[];
    const legalDocuments = files ? files.map(f => `/uploads/${f.filename}`) : [];

    // 1. Check if email exists
    const { rows: existing } = await client.query('SELECT id_user FROM users WHERE email = $1', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email đã tồn tại' });
    }

    await client.query('BEGIN');

    // 2. Create User (pending status)
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const { rows: userRows } = await client.query(
      `INSERT INTO users (email, phone, full_name, password_hash, status, auth_provider)
       VALUES ($1, $2, $3, $4, 'pending', 'local')
       RETURNING id_user, email, full_name, status`,
      [email, phone || null, fullName || null, hash]
    );
    const user = userRows[0];

    // 3. Assign Customer Role (base role)
    const { rows: roleRows } = await client.query("SELECT id_role FROM roles WHERE code = 'CUSTOMER'");
    if (roleRows.length > 0) {
      await client.query(
        'INSERT INTO role_detail (id_role, id_user) VALUES ($1, $2)',
        [roleRows[0].id_role, user.id_user]
      );
    }

    // 4. Create Provider (also pending)
    const { rows: providerRows } = await client.query(
      `INSERT INTO provider (
        name, id_area, id_user, phone, email, fanpage, service_type, 
        legal_documents, status, bank_name, bank_account_number, bank_account_name
      ) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9, $10, $11)
       RETURNING id_provider, name, status`,
      [
        businessName, areaId, user.id_user, businessPhone || phone, contactEmail || email,
        fanpage, serviceType || 'tour', legalDocuments, bankName, bankAccountNumber, bankAccountName
      ]
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Gửi yêu cầu đăng ký thành công. Tài khoản và thông tin doanh nghiệp sẽ được Admin xét duyệt.',
      data: {
        userId: user.id_user,
        providerId: providerRows[0].id_provider
      }
    });

  } catch (err) {
    if (client) await client.query('ROLLBACK');
    console.error('Register business error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi đăng ký doanh nghiệp' });
  } finally {
    if (client) client.release();
  }
}
