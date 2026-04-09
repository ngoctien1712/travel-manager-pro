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

const sanitizeUid = (uid: string) => uid.replace(/\./g, '_');

export const initializeChat = async (req: Request, res: Response) => {
    const { customer_id, item_id, item_name, customer_name } = req.body;
    const db = getDb();
    if (!db) return res.status(500).json({ message: "Firebase error" });

    try {
        // Step 1: Find Owner and Provider of the item
        const sql = `
            SELECT p.id_user as id_owner, p.id_provider, p.name as provider_name
            FROM bookable_items b
            JOIN provider p ON b.id_provider = p.id_provider
            WHERE b.id_item = $1
        `;
        const { rows: itemInfo } = await query(sql, [item_id]);
        
        if (itemInfo.length === 0) {
            return res.status(404).json({ message: "Item not found" });
        }

        const { id_owner, id_provider, provider_name } = itemInfo[0];
        const conversationId = `${customer_id}_${id_owner}`.replace(/\./g, '_');
        
        console.log(`[DEBUG] Initializing chat room: ${conversationId} for customer: ${customer_id}, owner: ${id_owner}`);
        
        const conversationRef = db.ref(`chats/${conversationId}`);
        const messagesRef = conversationRef.child('messages');

        // Step 2: Check for existing messages (Limit 10 as requested, though Firebase is usually just one-shot read here)
        const snap = await messagesRef.limitToLast(10).once('value');
        const hasAnyMessage = snap.exists();

        // Step 3: Update Chat Metadata
        const nowMs = admin.database.ServerValue.TIMESTAMP;
        const metadata = {
            id_customer: customer_id,
            id_owner: id_owner,
            id_provider: id_provider,
            id_item: item_id,
            item_name: item_name,
            customer_name: customer_name,
            updated_at: nowMs,
        };
        
        await conversationRef.update(metadata);

        // Step 4: Handle welcome message if new
        if (!hasAnyMessage) {
            const welcomeMsg = `👋 Xin chào! ${provider_name} rất vui được đón tiếp quý khách.\n\nCảm ơn bạn đã quan tâm đến dịch vụ "${item_name}". Chúng tôi có thể hỗ trợ gì cho hành trình sắp tới của bạn không?`;
            
            await messagesRef.push({
                sender_id: id_owner,
                sender_name: provider_name,
                content: welcomeMsg,
                timestamp: nowMs,
                is_auto_reply: true,
                id_item: item_id
            });

            await conversationRef.update({
                last_message: welcomeMsg,
                last_sender_id: id_owner,
            });
        }

        // Step 5: Update user chat index
        const roomTs = admin.database.ServerValue.TIMESTAMP;
        await db.ref(`user_chats/${sanitizeUid(customer_id)}/${conversationId}`).set(roomTs);
        await db.ref(`user_chats/${sanitizeUid(id_owner)}/${conversationId}`).set(roomTs);

        return res.json({ conversation_id: conversationId, is_new: !hasAnyMessage, owner_id: id_owner });
    } catch (error) {
        console.error(`[ERROR] Chat initialization failed:`, error);
        return res.status(500).json({ message: "Error" });
    }
};

export const trackChatActivity = async (req: Request, res: Response) => {
    const { conversation_id, customer_id, owner_id, provider_id, customer_name, item_name, last_message, sender_id, item_id } = req.body;
    const db = getDb();
    if (!db) return res.status(500).json({ message: "Firebase error" });

    try {
        const now = new Date();
        // Sync to SQL
        await query(
            `INSERT INTO chat_rooms (id_room, id_customer, id_provider, id_item, item_name, customer_name, last_message, last_sender_id, updated_at, is_active_for_customer, is_active_for_provider)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, true)
             ON CONFLICT (id_room) DO UPDATE 
             SET updated_at = EXCLUDED.updated_at, 
                 last_message = EXCLUDED.last_message, 
                 last_sender_id = EXCLUDED.last_sender_id,
                 id_item = EXCLUDED.id_item,
                 id_provider = EXCLUDED.id_provider,
                 item_name = EXCLUDED.item_name,
                 customer_name = EXCLUDED.customer_name`,
            [conversation_id, customer_id, provider_id, item_id, item_name, customer_name, last_message, sender_id, now]
        );

        // Update Unread
        const recipientId = (sender_id === customer_id) ? owner_id : customer_id;
        const unreadRef = db.ref(`chats/${conversation_id}/unread/${recipientId}`);
        await unreadRef.transaction((currentCount) => (currentCount || 0) + 1);

        // Update Firebase Metadata
        await db.ref(`chats/${conversation_id}`).update({
            last_message,
            updated_at: admin.database.ServerValue.TIMESTAMP,
            last_sender_id: sender_id,
            id_item: item_id,
            item_name,
            customer_name
        });

        // Update real-time indexes
        const roomTs = admin.database.ServerValue.TIMESTAMP;
        await db.ref(`user_chats/${sanitizeUid(customer_id)}/${conversation_id}`).set(roomTs);
        await db.ref(`user_chats/${sanitizeUid(owner_id)}/${conversation_id}`).set(roomTs);

        return res.json({ success: true });
    } catch (error) {
        console.error(`[ERROR] trackChatActivity failed:`, error);
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
            await query(`UPDATE chat_rooms SET is_active_for_provider = false WHERE id_room = $1`, [conversation_id]);
            await db.ref(`user_chats/${userId}/${conversation_id}`).remove();
        }

        await db.ref(`chats/${conversation_id}/unread/${userId}`).remove();
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

        let sql = role === 'customer'
            ? `SELECT * FROM chat_rooms WHERE id_customer = $1 AND is_active_for_customer = true ORDER BY updated_at DESC`
            : `SELECT cr.* FROM chat_rooms cr
               JOIN provider p ON cr.id_provider = p.id_provider
               WHERE p.id_user = $1 AND cr.is_active_for_provider = true 
               ORDER BY cr.updated_at DESC`;

        const { rows } = await query(sql, [userId]);
        res.json(rows);
    } catch (error) {
        console.error(error);
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
