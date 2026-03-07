import { Router } from 'express';
import { body } from 'express-validator';
import { auth, requireRole } from '../middleware/auth.js';
import * as userController from '../controllers/user.controller.js';

import { upload } from '../utils/upload.js';

const router = Router();

router.use(auth);

router.get('/profile', userController.getProfile);

router.patch(
  '/profile',
  [
    body('fullName').optional().trim(),
    body('phone').optional().trim(),
    body('travel_style').optional().trim(),
    body('business_name').optional().trim(),
    body('department').optional().trim(),
    body('date').optional(),
  ],
  userController.updateProfile
);

router.post(
  '/change-password',
  [
    body('currentPassword').notEmpty().withMessage('Mật khẩu hiện tại không được để trống'),
    body('newPassword').isLength({ min: 6 }).withMessage('Mật khẩu mới tối thiểu 6 ký tự'),
  ],
  userController.changePassword
);

router.post(
  '/request-business',
  upload.array('images', 5),
  [
    body('name').trim().notEmpty().withMessage('Tên doanh nghiệp bắt buộc'),
    body('areaId').isUUID().withMessage('areaId không hợp lệ'),
    body('phone').trim().notEmpty().withMessage('Số điện thoại bắt buộc'),
  ],
  userController.requestBusiness
);

export default router;
