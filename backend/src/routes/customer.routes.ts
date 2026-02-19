import { Router } from 'express';
import customerCtrl from '../controllers/customer.controller.js';
import { auth, requireRole } from '../middleware/auth.js';

const router = Router();

// public
router.get('/services', customerCtrl.listServices);
router.get('/services/:id', customerCtrl.getService);
router.get('/home', customerCtrl.getHomeData);

// authenticated customer routes
router.use(auth);
router.use(requireRole('customer'));

router.post('/cart', customerCtrl.addToCart);
router.get('/cart', customerCtrl.getCart);
router.delete('/cart/:id', customerCtrl.removeCartItem);

router.post('/orders', customerCtrl.createOrder);
router.get('/orders', customerCtrl.listOrders);
router.get('/orders/:id', customerCtrl.getOrder);
router.post('/orders/:id/cancel', customerCtrl.cancelOrder);
router.post('/orders/:id/refund', customerCtrl.requestRefund);

router.post('/payments', customerCtrl.createPayment);

router.post('/trip-plans', customerCtrl.createTripPlan);
router.get('/trip-plans', customerCtrl.listTripPlans);

export default router;
