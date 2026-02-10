import { Router } from 'express';
import { body } from 'express-validator';
import { auth, requireRole } from '../middleware/auth.js';
import * as ownerController from '../controllers/owner.controller.js';

const router = Router();

router.use(auth);
router.use(requireRole('owner'));

router.get('/area-ownerships', ownerController.getMyAreaOwnerships);
router.post(
  '/area-ownerships',
  [body('areaId').isUUID().withMessage('areaId không hợp lệ')],
  ownerController.requestAreaOwnership
);

router.get('/providers', ownerController.getMyProviders);
router.post(
  '/providers',
  [
    body('name').trim().notEmpty().withMessage('Tên nhà cung cấp bắt buộc'),
    body('areaId').isUUID().withMessage('areaId không hợp lệ'),
  ],
  ownerController.createProvider
);

router.post(
  '/bookable-items',
  [
    body('providerId').isUUID().withMessage('providerId không hợp lệ'),
    body('areaId').optional().isUUID(),
    body('itemType').isIn(['tour', 'accommodation', 'vehicle', 'ticket']).withMessage('Loại dịch vụ không hợp lệ'),
    body('title').trim().notEmpty().withMessage('Tên dịch vụ bắt buộc'),
    body('attribute').optional().isObject(),
    body('price').optional().isFloat({ min: 0 }),
  ],
  ownerController.createBookableItem
);

export default router;
