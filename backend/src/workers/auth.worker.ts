import { Worker, Job } from 'bullmq';
import { redisConfig } from '../config/redis.js';
import { AUTH_QUEUE_NAME } from '../queues/auth.queue.js';
import pool from '../config/db.js';

interface AuthJobData {
    email: string;
}

export const startAuthWorker = () => {

    const worker = new Worker<AuthJobData>(
        AUTH_QUEUE_NAME,
        async (job: Job<AuthJobData>) => {
            const { email } = job.data;
            const client = await pool.connect();
            try {
                // 1. Check if the user is still 'pending'
                const { rows } = await client.query(
                    'SELECT status, otp_expires_at FROM users WHERE email = $1',
                    [email]
                );

                if (rows.length === 0) {
                    return;
                }

                const user = rows[0];

                if (user.status === 'pending') {
                    // Check if the OTP has actually expired
                    if (new Date() >= new Date(user.otp_expires_at)) {
                        await client.query(
                            'UPDATE users SET status = $1, otp_code = NULL, otp_expires_at = NULL WHERE email = $2',
                            ['failed', email]
                        );
                        console.log(`[Worker] OTP expired for ${email}. Status set to failed.`);
                    } else {
                        // Re-queue or just ignore (this shouldn't normally happen if job delay is synced)
                    }
                }
            } catch (error) {
                console.error(`[Worker] Error processing OTP for ${email}:`, error);
                throw error;
            } finally {
                client.release();
            }
        },
        {
            connection: redisConfig,
            concurrency: 5,
        }
    );

    worker.on('failed', (job, err) => {
        console.error(`[Worker] Auth Job ${job?.id} failed:`, err.message);
    });

    return worker;
};
