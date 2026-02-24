import { Router } from 'express';
import { body } from 'express-validator';
import { auth, requireRole } from '../middleware/auth.js';
import * as geo from '../controllers/geography.controller.js';

const router = Router();

// Public/Owner list (no auth) - for dropdowns and owner registration
router.get('/countries', geo.listCountries);
router.get('/cities', geo.listCities);
router.get('/areas', geo.listAreas);
router.get('/pois', geo.listPois);
router.get('/wards', geo.listWards);

export default router;
