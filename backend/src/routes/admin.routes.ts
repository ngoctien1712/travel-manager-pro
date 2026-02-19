import { Router } from 'express';
import { body } from 'express-validator';
import { auth, requireRole } from '../middleware/auth.js';
import * as adminController from '../controllers/admin.controller.js';

const router = Router();

router.use(auth);
router.use(requireRole('admin'));

router.get('/users', adminController.listUsers);
router.get('/users/:id', adminController.getUserById);
router.post(
  '/users',
  [
    body('email').isEmail().normalizeEmail().withMessage('Email không hợp lệ'),
    body('password').optional().isLength({ min: 6 }).withMessage('Mật khẩu tối thiểu 6 ký tự'),
    body('fullName').optional().trim(),
    body('phone').optional().trim(),
    body('role').isIn(['admin', 'customer', 'owner']).withMessage('Vai trò không hợp lệ'),
    body('status').optional().isIn(['active', 'inactive', 'banned']),
  ],
  adminController.createUser
);
router.patch(
  '/users/:id',
  [
    body('fullName').optional().trim(),
    body('phone').optional().trim(),
    body('status').optional().isIn(['active', 'inactive', 'banned']),
    body('role').optional().isIn(['admin', 'customer', 'owner']),
    body('profile').optional(),
  ],
  adminController.updateUser
);
router.delete('/users/:id', adminController.deleteUser);

router.get('/providers', adminController.listProviders);
router.patch('/providers/:id/status', adminController.updateProviderStatus);

export default router;
