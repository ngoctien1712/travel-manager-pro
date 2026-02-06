/**
 * Seed admin user - Run with: npx tsx scripts/seed-admin.ts
 * Creates admin@travel.vn / Admin123!
 */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import pool from '../src/config/db.js';

async function seedAdmin() {
  const email = 'admin@travel.vn';
  const password = 'Admin123!';
  const fullName = 'Quản trị viên';
  const phone = '0900000000';

  try {
    const { rows: existing } = await pool.query('SELECT id_user FROM users WHERE email = $1', [email]);
    if (existing.length > 0) {
      console.log('Admin user already exists:', email);
      process.exit(0);
      return;
    }

    const hash = await bcrypt.hash(password, 10);
    const { rows: userRows } = await pool.query(
      `INSERT INTO users (email, phone, full_name, password_hash, status, email_verified_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'active', NOW(), NOW(), NOW())
       RETURNING id_user`,
      [email, phone, fullName, hash]
    );
    const userId = userRows[0].id_user;

    const { rows: roleRows } = await pool.query("SELECT id_role FROM roles WHERE code = 'ADMIN' LIMIT 1");
    if (roleRows.length === 0) {
      throw new Error('Role ADMIN not found. Run schema.sql first.');
    }
    await pool.query('INSERT INTO role_detail (id_role, id_user) VALUES ($1, $2)', [
      roleRows[0].id_role,
      userId,
    ]);
    await pool.query(
      "INSERT INTO admin_profile (id_user, department) VALUES ($1, 'Quản trị hệ thống')",
      [userId]
    );

    console.log('Admin user created successfully!');
    console.log('Email:', email);
    console.log('Password:', password);
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

seedAdmin();
