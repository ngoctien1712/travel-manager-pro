import { Worker, Job } from 'bullmq';
import { redisConfig } from '../config/redis.js';
import { EMAIL_QUEUE_NAME } from '../queues/email.queue.js';
import { sendVerificationEmail } from '../utils/mail.js';

export const startEmailWorker = () => {
    const worker = new Worker(
        EMAIL_QUEUE_NAME,
        async (job: Job) => {
            if (job.name === 'verification') {
                const { email, otp } = job.data;
                await sendVerificationEmail(email, otp);
            } else if (job.name === 'refund') {
                const { email, customerName, orderCode, amount } = job.data;
                const { sendRefundEmail } = await import('../utils/mail.js');
                await sendRefundEmail(email, customerName, orderCode, amount);
            }
        },
        {
            connection: redisConfig,
            concurrency: 5,
        }
    );

    worker.on('completed', (job) => {
        // Email job completed
    });

    worker.on('failed', (job, err) => {
        console.error(`Email job ${job?.id} failed:`, err);
    });

    console.log('Email worker started');
    return worker;
};

