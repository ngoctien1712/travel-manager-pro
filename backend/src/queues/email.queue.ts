import { Queue } from 'bullmq';
import { redisConfig } from '../config/redis.js';

export const EMAIL_QUEUE_NAME = 'email_queue';

export const emailQueue = new Queue(EMAIL_QUEUE_NAME, {
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

export const addEmailJob = async (type: 'verification' | 'refund', data: any) => {
    await emailQueue.add(type, data);
};
