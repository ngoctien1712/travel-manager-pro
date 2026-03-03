import { Request, Response } from 'express';
import pool from '../config/db.js';

function toCamel(o: Record<string, unknown>): Record<string, unknown> {
    const r: Record<string, unknown> = {};
    for (const k of Object.keys(o)) {
        const v = o[k];
        const key = k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
        r[key] = v;
    }
    return r;
}

/** List all vouchers for current owner's providers */
export async function getMyVouchers(req: Request, res: Response) {
    try {
        const userId = req.user!.userId;
        const { rows } = await pool.query(
            `SELECT v.*, p.name AS provider_name, bi.title AS item_title
       FROM voucher v
       JOIN provider p ON p.id_provider = v.id_provider
       LEFT JOIN bookable_items bi ON bi.id_item = v.id_item
       WHERE p.id_user = $1
       ORDER BY v.created_at DESC`,
            [userId]
        );
        res.json({
            data: rows.map((r: Record<string, unknown>) => toCamel(r as Record<string, unknown>)),
        });
    } catch (err) {
        console.error('Get my vouchers error:', err);
        res.status(500).json({ message: 'Lỗi máy chủ' });
    }
}

/** Create a new voucher */
export async function createVoucher(req: Request, res: Response) {
    try {
        const userId = req.user!.userId;
        const {
            code, name, idItem, idProvider, quantity, totalPrice,
            quantityPay, from, to, sale, discountType,
            discountValue, minOrderValue, minQuantity, maxDiscountAmount, description, voucherType
        } = req.body;

        // Security check: provider must belong to user
        const providerCheck = await pool.query(
            'SELECT id_provider FROM provider WHERE id_provider = $1 AND id_user = $2',
            [idProvider, userId]
        );

        if (providerCheck.rows.length === 0) {
            return res.status(403).json({ message: 'Bạn không có quyền tạo voucher cho nhà cung cấp này' });
        }

        const { rows } = await pool.query(
            `INSERT INTO voucher (
        code, name, id_item, id_provider, quantity, total_price, 
        quantity_pay, "from", "to", sale, discount_type, 
        discount_value, min_order_value, min_quantity, max_discount_amount, description, voucher_type, status
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 'active')
      RETURNING *`,
            [
                code, name, idItem || null, idProvider, quantity || null, totalPrice || null,
                quantityPay || 0, from || null, to || null, sale || null, discountType || 'percentage',
                discountValue || null, minOrderValue || 0, minQuantity || 0, maxDiscountAmount || null, description || null,
                voucherType || 'price'
            ]
        );

        res.status(201).json(toCamel(rows[0] as Record<string, unknown>));
    } catch (err: any) {
        console.error('Create voucher error:', err);
        if (err.code === '23505') { // Unique violation
            return res.status(400).json({ message: 'Mã voucher này đã tồn tại' });
        }
        res.status(500).json({ message: 'Lỗi máy chủ' });
    }
}

/** Update an existing voucher */
export async function updateVoucher(req: Request, res: Response) {
    try {
        const userId = req.user!.userId;
        const { idVoucher } = req.params;
        const {
            code, name, idItem, quantity, totalPrice,
            quantityPay, from, to, sale, discountType,
            discountValue, minOrderValue, minQuantity, maxDiscountAmount, description, voucherType, status
        } = req.body;

        // Security check via hierarchy
        const check = await pool.query(
            `SELECT v.id_voucher FROM voucher v
       JOIN provider p ON p.id_provider = v.id_provider
       WHERE v.id_voucher = $1 AND p.id_user = $2`,
            [idVoucher, userId]
        );

        if (check.rows.length === 0) {
            return res.status(403).json({ message: 'Bạn không có quyền chỉnh sửa voucher này' });
        }

        const { rows } = await pool.query(
            `UPDATE voucher 
       SET code = $1, name = $2, id_item = $3, quantity = $4, total_price = $5, 
           quantity_pay = $6, "from" = $7, "to" = $8, sale = $9, discount_type = $10, 
           discount_value = $11, min_order_value = $12, min_quantity = $13, max_discount_amount = $14, 
           description = $15, voucher_type = $16, status = $17, updated_at = NOW()
       WHERE id_voucher = $18
       RETURNING *`,
            [
                code, name, idItem || null, quantity || null, totalPrice || null,
                quantityPay || 0, from || null, to || null, sale || null, discountType || 'percentage',
                discountValue || null, minOrderValue || 0, minQuantity || 0, maxDiscountAmount || null,
                description || null, voucherType || 'price', status || 'active', idVoucher
            ]
        );

        res.json(toCamel(rows[0] as Record<string, unknown>));
    } catch (err: any) {
        console.error('Update voucher error:', err);
        if (err.code === '23505') {
            return res.status(400).json({ message: 'Mã voucher này đã bị trùng' });
        }
        res.status(500).json({ message: 'Lỗi máy chủ' });
    }
}

/** Delete a voucher */
export async function deleteVoucher(req: Request, res: Response) {
    try {
        const userId = req.user!.userId;
        const { idVoucher } = req.params;

        const check = await pool.query(
            `SELECT v.id_voucher FROM voucher v
       JOIN provider p ON p.id_provider = v.id_provider
       WHERE v.id_voucher = $1 AND p.id_user = $2`,
            [idVoucher, userId]
        );

        if (check.rows.length === 0) {
            return res.status(403).json({ message: 'Bạn không có quyền xóa voucher này' });
        }

        // Check if voucher has been used (in voucher_detail)
        const usageCheck = await pool.query('SELECT 1 FROM voucher_detail WHERE id_voucher = $1 LIMIT 1', [idVoucher]);
        if (usageCheck.rows.length > 0) {
            return res.status(400).json({ message: 'Không thể xóa voucher đã được sử dụng. Hãy chuyển sang trạng thái Ngừng hoạt động.' });
        }

        await pool.query('DELETE FROM voucher WHERE id_voucher = $1', [idVoucher]);
        res.json({ success: true });
    } catch (err) {
        console.error('Delete voucher error:', err);
        res.status(500).json({ message: 'Lỗi máy chủ' });
    }
}
