import { Router } from 'express';
import { body } from 'express-validator';
import * as authController from '../controllers/auth.controller.js';

const router = Router();

router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail().withMessage('Email không hợp lệ'),
    body('password').isLength({ min: 6 }).withMessage('Mật khẩu tối thiểu 6 ký tự'),
    body('fullName').optional().trim(),
    body('phone').optional().trim(),
    body('role').isIn(['admin', 'customer', 'owner']).withMessage('Vai trò không hợp lệ'),
  ],
  authController.register
);

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Email không hợp lệ'),
    body('password').notEmpty().withMessage('Mật khẩu không được để trống'),
  ],
  authController.login
);

router.post('/logout', authController.logout);

router.post(
  '/forgot-password',
  [body('email').isEmail().normalizeEmail().withMessage('Email không hợp lệ')],
  authController.forgotPassword
);

router.post(
  '/reset-password',
  [
    body('token').notEmpty().withMessage('Token không được để trống'),
    body('password').isLength({ min: 6 }).withMessage('Mật khẩu tối thiểu 6 ký tự'),
  ],
  authController.resetPassword
);

router.post(
  '/verify-account',
  [body('token').notEmpty().withMessage('Token không được để trống')],
  authController.verifyAccount
);

export default router;
