import { Router } from 'express';
import { body } from 'express-validator';
import { auth, requireRole } from '../middleware/auth.js';
import * as ownerController from '../controllers/owner.controller.js';
import * as voucherController from '../controllers/voucher.controller.js';
import { upload } from '../utils/upload.js';

const router = Router();

router.use(auth);
router.use(requireRole('owner'));

router.get('/area-ownerships', ownerController.getMyAreaOwnerships);
router.get('/providers', ownerController.getMyProviders);
router.get('/bookable-items', ownerController.getMyBookableItems);
router.post(
  '/area-ownerships',
  [body('areaId').isUUID().withMessage('areaId không hợp lệ')],
  ownerController.requestAreaOwnership
);

router.get('/providers/:providerId/bookable-items', ownerController.getProviderBookableItems);
router.post(
  '/providers',
  upload.array('images', 5),
  [
    body('name').trim().notEmpty().withMessage('Tên nhà cung cấp bắt buộc'),
    body('areaId').isUUID().withMessage('areaId không hợp lệ'),
    body('phone').trim().notEmpty().withMessage('Số điện thoại bắt buộc'),
  ],
  ownerController.createProvider
);

router.get('/bookable-items/:idItem', ownerController.getServiceDetail);
router.put('/bookable-items/:idItem', ownerController.updateServiceDetail);
router.post(
  '/bookable-items/:idItem/media',
  upload.array('images', 10),
  ownerController.addItemMedia
);

router.delete(
  '/media/:idMedia',
  ownerController.deleteItemMedia
);

router.put(
  '/bookable-items/:idItem/status',
  [body('status').isIn(['active', 'inactive', 'pending']).withMessage('Trạng thái không hợp lệ')],
  ownerController.updateServiceStatus
);

router.delete(
  '/bookable-items/:idItem',
  ownerController.deleteService
);

router.post(
  '/bookable-items/:idItem/rooms',
  ownerController.addAccommodationRoom
);

router.put(
  '/rooms/:idRoom',
  ownerController.updateAccommodationRoom
);

router.delete(
  '/rooms/:idRoom',
  ownerController.deleteAccommodationRoom
);

router.post(
  '/bookable-items/:idItem/positions',
  ownerController.addVehiclePosition
);

router.put(
  '/positions/:idPosition',
  ownerController.updateVehiclePosition
);

router.delete(
  '/positions/:idPosition',
  ownerController.deleteVehiclePosition
);

router.post(
  '/bookable-items/:idItem/positions/bulk',
  ownerController.bulkAddVehiclePositions
);

router.post(
  '/rooms/:idRoom/media',
  upload.array('images', 5),
  ownerController.uploadRoomMedia
);

router.post(
  '/bookable-items/:idItem/vehicle',
  ownerController.manageVehicle
);

router.post(
  '/vehicle/:idVehicle/trips',
  ownerController.addVehicleTrip
);

router.delete(
  '/trips/:idTrip',
  ownerController.deleteVehicleTrip
);

router.get('/vouchers', voucherController.getMyVouchers);
router.post(
  '/vouchers',
  [
    body('code').trim().notEmpty().withMessage('Mã voucher bắt buộc'),
    body('name').trim().notEmpty().withMessage('Tên voucher bắt buộc'),
    body('idProvider').isUUID().withMessage('providerId không hợp lệ'),
    body('discountType').isIn(['percentage', 'fixed_amount']).withMessage('Loại giảm giá không hợp lệ'),
    body('discountValue').isFloat({ min: 0 }).withMessage('Giá trị giảm giá không hợp lệ'),
  ],
  voucherController.createVoucher
);
router.put('/vouchers/:idVoucher', voucherController.updateVoucher);
router.delete('/vouchers/:idVoucher', voucherController.deleteVoucher);

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
