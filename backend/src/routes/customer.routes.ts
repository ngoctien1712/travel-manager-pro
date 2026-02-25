import { Router } from 'express';
import customerCtrl from '../controllers/customer.controller.js';
import { auth, requireRole } from '../middleware/auth.js';

const router = Router();

// public
router.get('/services', customerCtrl.listServices);
router.get('/services/:id', customerCtrl.getService);
router.get('/home', customerCtrl.getHomeData);
router.post('/webhook/momo', customerCtrl.handleMomoIPN);
router.post('/webhook/project', customerCtrl.handleProjectWebhook);

// authenticated customer routes
router.use(auth);
router.use(requireRole('customer'));

// Booking routes
router.post('/bookings', customerCtrl.createBooking);
router.get('/orders', customerCtrl.listOrders);
router.get('/orders/:id', customerCtrl.getOrder);
router.post('/orders/:id/cancel', customerCtrl.cancelOrder);
router.post('/orders/:id/refund', customerCtrl.requestRefund);

router.post('/payments', customerCtrl.createPayment);
router.post('/payments/momo', customerCtrl.initMomoPayment);

router.post('/trip-plans', customerCtrl.createTripPlan);
router.get('/trip-plans', customerCtrl.listTripPlans);

export default router;
