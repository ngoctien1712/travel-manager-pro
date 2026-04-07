import { Queue } from 'bullmq';
import { redisConnection } from '../config/redis.js';

export const EMAIL_QUEUE_NAME = 'email_queue';

export const emailQueue = new Queue(EMAIL_QUEUE_NAME, {
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

export const addEmailJob = async (type: 'verification' | 'refund', data: any) => {
    await emailQueue.add(type, data);
};
