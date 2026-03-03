import { Router } from 'express';
import { initializeChat, listMyChats, getProviderId, trackChatActivity, markAsRead, deleteChat } from '../controllers/chat.controller.js';
import { auth } from '../middleware/auth.js';

const router = Router();

router.post('/initialize', auth, initializeChat);
router.get('/my-chats', auth, listMyChats);
router.post('/track-activity', auth, trackChatActivity);
router.post('/mark-read', auth, markAsRead);
router.delete('/:conversation_id', auth, deleteChat);

export default router;
