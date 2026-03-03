import admin from 'firebase-admin';
import { query } from '../config/db.js';
import { Request, Response } from 'express';

const getDb = () => {
    if (!admin.apps.length) {
        try {
            const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
                ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
                : undefined;

            if (serviceAccount) {
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                    databaseURL: process.env.FIREBASE_DATABASE_URL
                });
            } else {
                return null;
            }
        } catch (error) {
            return null;
        }
    }
    return admin.database();
};

export const initializeChat = async (req: Request, res: Response) => {
    const { customer_id, provider_id, item_id, item_name, customer_name } = req.body;
    const db = getDb();
    if (!db) return res.status(500).json({ message: "Firebase error" });

    try {
        const conversationId = `${customer_id}_${provider_id}`.replace(/\./g, '_');
        const conversationRef = db.ref(`chats/${conversationId}`);
        const messagesRef = conversationRef.child('messages');

        const { rows: pRows } = await query(`SELECT name FROM provider WHERE id_provider = $1`, [provider_id]);
        const providerName = pRows[0]?.name || "Nhà cung cấp";

        const snap = await messagesRef.once('value');
        const hasAnyMessage = snap.exists();

        if (!hasAnyMessage) {
            const welcomeMsg = `👋 Xin chào! ${providerName} rất vui được đón tiếp quý khách.\n\nCảm ơn bạn đã quan tâm đến dịch vụ của chúng tôi. Chúng tôi có thể hỗ trợ gì cho hành trình sắp tới của bạn không?`;
            const nowMs = admin.database.ServerValue.TIMESTAMP;

            await messagesRef.push({
                sender_id: provider_id,
                sender_name: providerName,
                content: welcomeMsg,
                timestamp: nowMs,
                is_auto_reply: true
            });

            await conversationRef.update({
                last_message: welcomeMsg,
                updated_at: nowMs,
                item_name: item_name,
                customer_name: customer_name,
                last_sender_id: provider_id
            });
        }

        return res.json({ conversation_id: conversationId, is_new: !hasAnyMessage });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error" });
    }
};

export const trackChatActivity = async (req: Request, res: Response) => {
    const { conversation_id, customer_id, provider_id, customer_name, item_name, last_message, sender_id } = req.body;
    const db = getDb();
    if (!db) return res.status(500).json({ message: "Firebase error" });

    try {
        const now = new Date();
        await query(
            `INSERT INTO chat_rooms (id_room, id_customer, id_provider, item_name, customer_name, last_message, last_sender_id, updated_at, is_active_for_customer, is_active_for_provider)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, true)
             ON CONFLICT (id_room) DO UPDATE 
             SET updated_at = EXCLUDED.updated_at, 
                 last_message = EXCLUDED.last_message, 
                 last_sender_id = EXCLUDED.last_sender_id,
                 item_name = EXCLUDED.item_name,
                 is_active_for_customer = true,
                 is_active_for_provider = true`,
            [conversation_id, customer_id, provider_id, item_name, customer_name, last_message, sender_id, now]
        );

        const recipientId = (sender_id === customer_id) ? provider_id : customer_id;
        const unreadRef = db.ref(`chats/${conversation_id}/unread/${recipientId}`);
        await unreadRef.transaction((currentCount) => (currentCount || 0) + 1);

        await db.ref(`chats/${conversation_id}`).update({
            last_message,
            updated_at: admin.database.ServerValue.TIMESTAMP,
            last_sender_id: sender_id,
            item_name,
            customer_name
        });

        await db.ref(`user_chats/${customer_id}/${conversation_id}`).set(true);
        await db.ref(`user_chats/${provider_id}/${conversation_id}`).set(true);

        return res.json({ success: true });
    } catch (error) {
        return res.status(500).json({ message: "Error" });
    }
};

export const markAsRead = async (req: Request, res: Response) => {
    const { conversation_id, user_id } = req.body;
    const db = getDb();
    if (!db) return res.status(500).json({ message: "Firebase error" });

    try {
        await db.ref(`chats/${conversation_id}/unread/${user_id}`).set(0);
        return res.json({ success: true });
    } catch (error) {
        return res.status(500).json({ message: "Error" });
    }
};

export const deleteChat = async (req: Request, res: Response) => {
    const { conversation_id } = req.params;
    const userId = req.user?.userId;
    const role = req.user?.role;
    const db = getDb();
    if (!db) return res.status(500).json({ message: "Firebase error" });

    try {
        if (role === 'customer') {
            await query(`UPDATE chat_rooms SET is_active_for_customer = false WHERE id_room = $1`, [conversation_id]);
            await db.ref(`user_chats/${userId}/${conversation_id}`).remove();
        } else {
            const { rows: pRows } = await query(`SELECT id_provider FROM provider WHERE id_user = $1`, [userId]);
            const providerId = pRows[0]?.id_provider;
            await query(`UPDATE chat_rooms SET is_active_for_provider = false WHERE id_room = $1`, [conversation_id]);
            if (providerId) {
                await db.ref(`user_chats/${providerId}/${conversation_id}`).remove();
            }
        }

        const targetId = (role === 'customer') ? userId : (await query(`SELECT id_provider FROM provider WHERE id_user = $1`, [userId])).rows[0]?.id_provider;
        if (targetId) {
            await db.ref(`chats/${conversation_id}/unread/${targetId}`).remove();
        }

        return res.json({ success: true });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error deleting chat" });
    }
};

export const listMyChats = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const role = req.user?.role;
        const { rows: pRows } = await query(`SELECT id_provider FROM provider WHERE id_user = $1`, [userId]);
        const providerId = pRows[0]?.id_provider;

        let sql = role === 'customer'
            ? `SELECT * FROM chat_rooms WHERE id_customer = $1 AND is_active_for_customer = true ORDER BY updated_at DESC`
            : `SELECT * FROM chat_rooms WHERE id_provider = $1 AND is_active_for_provider = true ORDER BY updated_at DESC`;

        const { rows } = await query(sql, [role === 'customer' ? userId : providerId]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: "Error" });
    }
};

export const getProviderId = async (req: Request, res: Response) => {
    try {
        const { rows } = await query(`SELECT id_provider FROM provider WHERE id_user = $1`, [req.user?.userId]);
        res.json({ id_provider: rows[0]?.id_provider || null });
    } catch (error) {
        res.status(500).json({ message: "Error" });
    }
};
