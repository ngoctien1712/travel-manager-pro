import { Worker, Job } from 'bullmq';
import { redisConnection, REDIS_KEYS } from '../config/redis.js';
import { PAYMENT_QUEUE_NAME } from '../queues/payment.queue.js';
import pool from '../config/db.js';

interface PaymentJobData {
    orderId: string;
}

export const startPaymentWorker = () => {
    console.log(`[Worker] Starting Payment Monitoring Worker (Concurrency: 5)...`);

    const worker = new Worker<PaymentJobData>(
        PAYMENT_QUEUE_NAME,
        async (job: Job<PaymentJobData>) => {
            const { orderId } = job.data;

            // 1. Fast Check via Redis (Optimization for High Throughput)
            const redisStatus = await redisConnection.get(REDIS_KEYS.ORDER_STATUS(orderId));
            if (redisStatus === 'paid') {
                console.log(`[Worker] Order ${orderId} already paid (confirmed by Redis). Skipping DB check.`);
                return;
            }

            console.log(`[Worker] Checking payment status for Order: ${orderId}...`);

            const client = await pool.connect();
            try {
                await client.query('BEGIN');

                // 1. Check if the order is still pending
                const { rows } = await client.query(
                    'SELECT status, id_voucher, order_code FROM "order" WHERE id_order = $1',
                    [orderId]
                );

                if (rows.length === 0) {
                    console.log(`[Worker] Order ${orderId} not found, ignoring.`);
                    return;
                }

                const order = rows[0];

                // Only rollback if status is still 'pending'
                // If the user already paid, status will be 'confirmed' or 'paid'
                if (order.status === 'pending') {
                    console.log(`[Worker] Order ${order.order_code} (${orderId}) still pending after timeout. Rolling back...`);

                    // 2. Rollback Voucher quantity if exists
                    if (order.id_voucher) {
                        await client.query(`
                            UPDATE voucher 
                            SET quantity = CASE WHEN quantity IS NOT NULL THEN quantity + 1 ELSE quantity END,
                                quantity_pay = COALESCE(quantity_pay, 0) - 1
                            WHERE id_voucher = $1
                        `, [order.id_voucher]);
                        console.log(`[Worker] Rolled back voucher for order ${order.order_code}`);
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

                    console.log(`[Worker] Order ${order.order_code} has been cancelled due to payment timeout.`);
                } else {
                    console.log(`[Worker] Order ${order.order_code} is already in state: ${order.status}. No rollback needed.`);
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
            connection: redisConnection as any,
            concurrency: 5, // Process 5 checks in parallel
        }
    );

    worker.on('failed', (job, err) => {
        console.error(`[Worker] Job ${job?.id} failed:`, err.message);
    });

    worker.on('completed', (job) => {
        console.log(`[Worker] Job ${job.id} completed successfully.`);
    });

    return worker;
};
