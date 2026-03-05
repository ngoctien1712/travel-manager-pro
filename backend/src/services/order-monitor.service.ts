import pool from '../config/db.js';

/**
 * Service to periodically check for 'pending' orders that have passed the payment deadline (e.g., 15 minutes).
 * This replaces the Redis-based BullMQ implementation to avoid external dependencies.
 */
export function startOrderMonitor() {
    console.log('Order Monitor Service started (Polling every 1 minute)...');

    // Run immediately on start, then every 1 minute
    checkExpiredOrders();

    setInterval(() => {
        checkExpiredOrders();
    }, 60 * 1000);
}

async function checkExpiredOrders() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Find and update 'pending' orders older than 15 minutes to 'failed'
        // Also return id_voucher so we can rollback their quantities
        const { rows: expiredOrders } = await client.query(`
      UPDATE "order" 
      SET status = 'failed' 
      WHERE status = 'pending' 
      AND create_at < NOW() - INTERVAL '5 minutes'
      RETURNING id_order, id_voucher, order_code
    `);

        if (expiredOrders.length > 0) {
            console.log(`[Order Monitor] Found ${expiredOrders.length} expired orders.`);

            for (const order of expiredOrders) {
                console.log(`[Order Monitor] Order ${order.order_code} (${order.id_order}) timed out. Rolling back...`);

                // 2. Rollback Voucher if exists
                if (order.id_voucher) {
                    await client.query(`
            UPDATE voucher 
            SET quantity = CASE WHEN quantity IS NOT NULL THEN quantity + 1 ELSE quantity END,
                quantity_pay = COALESCE(quantity_pay, 0) - 1
            WHERE id_voucher = $1
          `, [order.id_voucher]);
                    console.log(`[Order Monitor] Rolled back voucher for order ${order.order_code}`);
                }

                // 3. Mark pending payments for this order as 'failed'
                await client.query(`
          UPDATE payments 
          SET status = 'failed' 
          WHERE id_order = $1 AND status = 'pending'
        `, [order.id_order]);
            }
        }

        await client.query('COMMIT');
    } catch (err) {
        if (client) await client.query('ROLLBACK');
        console.error('[Order Monitor] Unexpected error during cleanup:', err);
    } finally {
        if (client) client.release();
    }
}
