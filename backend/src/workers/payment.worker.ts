import { Worker, Job } from 'bullmq';
import { redisConfig, REDIS_KEYS } from '../config/redis.js';
import { PAYMENT_QUEUE_NAME } from '../queues/payment.queue.js';
import pool from '../config/db.js';

interface PaymentJobData {
    orderId: string;
}

export const startPaymentWorker = () => {

    const worker = new Worker<PaymentJobData>(
        PAYMENT_QUEUE_NAME,
        async (job: Job<PaymentJobData>) => {
            const { orderId } = job.data;

            const client = await pool.connect();
            try {
                await client.query('BEGIN');

                // 1. Check if the order is still pending and if it has expired
                const { rows } = await client.query(
                    'SELECT status, id_voucher, order_code, payment_expires_at FROM "order" WHERE id_order = $1',
                    [orderId]
                );

                if (rows.length === 0) {
                    return;
                }

                const order = rows[0];

                // Only fail if status is still 'pending' and current time is past expiration
                if (order.status === 'pending') {
                    const now = new Date();
                    const expiresAt = new Date(order.payment_expires_at);

                    if (now >= expiresAt) {
                        // 2. Rollback Voucher quantity if exists
                        if (order.id_voucher) {
                            await client.query(`
                                UPDATE voucher 
                                SET quantity = CASE WHEN quantity IS NOT NULL THEN quantity + 1 ELSE quantity END,
                                    quantity_pay = COALESCE(quantity_pay, 0) - 1
                                WHERE id_voucher = $1
                            `, [order.id_voucher]);
                        }

                        // 3. Mark the order as 'failed' (timeout)
                        await client.query(
                            'UPDATE "order" SET status = $1 WHERE id_order = $2',
                            ['failed', orderId]
                        );

                        // 4. Mark associated payments as 'failed'
                        await client.query(
                            'UPDATE payments SET status = $1 WHERE id_order = $2 AND status = $3',
                            ['failed', orderId, 'pending']
                        );
                        console.log(`[Worker] Order ${orderId} marked as failed due to payment timeout.`);
                    } else {
                        // This job might have been triggered too early or manually.
                        // We could re-queue if needed, but since we add with delay, 
                        // this only happens if system clock is inconsistent or manual job added.
                        console.log(`[Worker] Order ${orderId} check skipped - not yet expired.`);
                    }
                }
                await client.query('COMMIT');
            } catch (error) {
                await client.query('ROLLBACK');
                console.error(`[Worker] Error processing Order ${orderId}:`, error);
                throw error; // Let BullMQ retry based on our queue policy
            } finally {
                client.release();
            }
        },
        {
            connection: redisConfig,
            concurrency: 5, // Process 5 checks in parallel
        }
    );

    worker.on('failed', (job, err) => {
        console.error(`[Worker] Job ${job?.id} failed:`, err.message);
    });

    worker.on('completed', (job) => {
    });

    return worker;
};
