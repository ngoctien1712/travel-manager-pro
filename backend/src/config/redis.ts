import { Redis } from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,
};

// Redis keys prefix
export const REDIS_KEYS = {
    ORDER_STATUS: (orderId: string) => `order_status:${orderId}`,
};

export const redisConnection = new Redis(redisConfig);

redisConnection.on('connect', () => {
    // Connected to Redis
});

redisConnection.on('error', (err) => {
    console.error('Redis connection error:', err);
});

export default redisConnection;
