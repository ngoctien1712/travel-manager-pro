import { Router } from 'express';
import * as planningController from '../controllers/planning.controller.js';
import { auth } from '../middleware/auth.js';

const router = Router();

// Tất cả chức năng lập kế hoạch cần đăng nhập
router.use(auth);

router.post('/generate', planningController.generateItinerary);
router.get('/suggest', planningController.getSuggestions);

export default router;
