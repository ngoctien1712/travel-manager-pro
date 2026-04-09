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

// Dashboard Stats
router.get('/dashboard-stats', adminController.getAdminDashboardStats);

// Provider Management
router.get('/providers', adminController.listProviders);
router.patch('/providers/:id/status', adminController.updateProviderStatus);
router.get('/pending-business', adminController.listPendingBusinessRegistrations);
router.post('/approve-business-account/:userId', adminController.approveBusinessAccount);

// Payroll Management
router.get('/payroll/stats', adminController.getPayrollStats);
router.get('/payroll/history', adminController.getPayrollHistory);
router.get('/payroll/paid-orders', adminController.getPaidOrdersHistory);
router.get('/payroll/provider/:id/orders', adminController.getProviderOrdersForPayroll);
router.post('/payroll/process', adminController.processPayroll);

// Owner Activity Monitoring
router.get('/owner-activities/providers', adminController.listActivityProviders);
router.get('/owner-activities/provider/:id_provider/items', adminController.getProviderActivityItems);
router.patch('/owner-activities/items/:type/:id/status', adminController.updateActivityItemStatus);
router.patch('/owner-activities/items/:type/:id', adminController.updateActivityItemDetails);
 
// Refund Management
router.get('/refunds', adminController.listRefundRequests);
router.post('/refunds/:id/approve', adminController.approveRefund);
router.post('/refunds/:id/reject', adminController.rejectRefund);

export default router;
