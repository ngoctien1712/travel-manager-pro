import { Router } from 'express';
import { body } from 'express-validator';
import { auth, requireRole } from '../middleware/auth.js';
import * as geo from '../controllers/geography.controller.js';

const router = Router();

router.use(auth);
router.use(requireRole('admin'));

// Countries
router.post(
  '/countries',
  [
    body('code').trim().notEmpty().withMessage('Mã quốc gia bắt buộc'),
    body('name').optional().trim(),
    body('nameVi').optional().trim(),
  ],
  geo.createCountry
);
router.patch('/countries/:id', geo.updateCountry);
router.delete('/countries/:id', geo.deleteCountry);

// Cities
router.post(
  '/cities',
  [
    body('countryId').isUUID().withMessage('countryId không hợp lệ'),
    body('name').trim().notEmpty().withMessage('Tên thành phố bắt buộc'),
    body('nameVi').optional().trim(),
    body('latitude').optional().isFloat(),
    body('longitude').optional().isFloat(),
  ],
  geo.createCity
);
router.patch('/cities/:id', geo.updateCity);
router.delete('/cities/:id', geo.deleteCity);

// Areas
router.post(
  '/areas',
  [
    body('cityId').isUUID().withMessage('cityId không hợp lệ'),
    body('name').trim().notEmpty().withMessage('Tên khu vực bắt buộc'),
    body('attribute').optional().isObject(),
    body('status').optional().isIn(['active', 'inactive']),
  ],
  geo.createArea
);
router.patch('/areas/:id', geo.updateArea);
router.delete('/areas/:id', geo.deleteArea);

// Point of interest
router.post(
  '/pois',
  [
    body('areaId').isUUID().withMessage('areaId không hợp lệ'),
    body('name').trim().notEmpty().withMessage('Tên địa điểm bắt buộc'),
    body('poiType').optional().isObject(),
  ],
  geo.createPoi
);
router.patch('/pois/:id', geo.updatePoi);
router.delete('/pois/:id', geo.deletePoi);

export default router;
