import { Queue } from 'bullmq';
import { redisConnection } from '../config/redis.js';

export const PAYMENT_QUEUE_NAME = 'payment_monitoring';

export const paymentQueue = new Queue(PAYMENT_QUEUE_NAME, {
    connection: redisConnection as any,
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

export const addPaymentCheckJob = async (orderId: string, delayMs: number = 3 * 60 * 1000) => {
    try {
        await paymentQueue.add(
            `check_payment_${orderId}`,
            { orderId },
            {
                delay: delayMs,
                jobId: orderId // Direct mapping for easy removal
            }
        );
    } catch (error) {
        console.error(`[Queue] Failed to add payment monitoring for Order: ${orderId}`, error);
    }
};

export const removePaymentJob = async (orderId: string) => {
    try {
        const job = await paymentQueue.getJob(orderId);
        if (job) {
            await job.remove();
        }
    } catch (error) {
        console.error(`[Queue] Error removing job for Order: ${orderId}`, error);
    }
};
