import 'dotenv/config';
import admin from 'firebase-admin';

const wipeFirebase = async () => {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
        : null;

    if (!serviceAccount) {
        console.error("No service account found");
        return;
    }

    try {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: process.env.FIREBASE_DATABASE_URL
        });

        const db = admin.database();
        console.log("Wiping 'chats' node...");
        await db.ref('chats').remove();
        console.log("Wiping 'user_chats' node...");
        await db.ref('user_chats').remove();
        console.log("Firebase wiped successfully!");
        process.exit(0);
    } catch (error) {
        console.error("Wipe failed:", error);
        process.exit(1);
    }
};

wipeFirebase();
