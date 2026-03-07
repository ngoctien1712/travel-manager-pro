import jwt, { type SignOptions } from 'jsonwebtoken';
import pool from '../config/db.js';
import type { UserRole } from '../types/index.js';

interface TokenPayload {
    userId: string;
    email: string;
    role: UserRole;
}

const ACCESS_TOKEN_EXPIRES_IN = '10m'; // Short lived
const REFRESH_TOKEN_EXPIRES_IN = '7d'; // Long lived

export const generateAccessToken = (payload: TokenPayload): string => {
    const secret = process.env.JWT_SECRET || 'default-secret';
    const options: SignOptions = { expiresIn: ACCESS_TOKEN_EXPIRES_IN };
    return jwt.sign(payload, secret, options);
};

export const generateRefreshToken = async (userId: string): Promise<string> => {
    const secret = process.env.JWT_REFRESH_SECRET || 'default-refresh-secret';
    const token = jwt.sign({ userId }, secret, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await pool.query(
        'INSERT INTO user_refresh_tokens (id_user, token, expires_at) VALUES ($1, $2, $3)',
        [userId, token, expiresAt]
    );

    return token;
};

export const verifyRefreshToken = (token: string) => {
    const secret = process.env.JWT_REFRESH_SECRET || 'default-refresh-secret';
    return jwt.verify(token, secret) as { userId: string };
};

export const revokeRefreshToken = async (token: string) => {
    await pool.query('DELETE FROM user_refresh_tokens WHERE token = $1', [token]);
};

export const revokeAllUserRefreshTokens = async (userId: string) => {
    await pool.query('DELETE FROM user_refresh_tokens WHERE id_user = $1', [userId]);
};
