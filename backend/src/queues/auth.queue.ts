import { Queue } from 'bullmq';
import { redisConfig } from '../config/redis.js';

export const AUTH_QUEUE_NAME = 'auth_monitoring';

export const authQueue = new Queue(AUTH_QUEUE_NAME, {
    connection: redisConfig,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: 1000,
    },
});

export const addOTPCheckJob = async (email: string, delayMs: number = 5 * 60 * 1000) => {
    try {
        await authQueue.add(
            `check_otp_${email}`,
            { email },
            {
                delay: delayMs,
                jobId: email // Direct mapping for easy removal/update
            }
        );
    } catch (error) {
        console.error(`[Queue] Failed to add OTP monitoring for Email: ${email}`, error);
    }
};

export const removeOTPJob = async (email: string) => {
    try {
        const job = await authQueue.getJob(email);
        if (job) {
            await job.remove();
        }
    } catch (error) {
        console.error(`[Queue] Error removing job for Email: ${email}`, error);
    }
};
