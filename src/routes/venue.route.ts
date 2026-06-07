import { Router } from 'express';
import type { NextFunction, Request, Response } from 'express';
import { VenueController } from '../controllers/venue.controller.ts';
import { authenticate } from '../middlewares/auth.ts';
import { requireSuperAdmin } from '../middlewares/role.ts';
import { upload } from '../config/multer.ts';
import { validate } from '../middlewares/validate.ts';
import { createVenueSchema, updateVenueSchema } from '../validators/venue.schema.ts';

const router:Router = Router();

const normalizeVenueBody = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.body.features && req.body['features[]']) {
    req.body.features = req.body['features[]'];
  }
  next();
};

// Public Discovery
router.get('/', authenticate, VenueController.getAllVenues);

router.get('/:id', authenticate, VenueController.getVenue);

// Administrative Updates
// Requires 'manage_structure' permission for ADUN staff
router.post(
  '/', 
  authenticate, 
  requireSuperAdmin,
  upload.fields([{ name: 'thumbnail', maxCount: 1 }, { name: 'images', maxCount: 10 }]),
  normalizeVenueBody,
  validate(createVenueSchema),
  VenueController.createVenue
);

router.put(
  '/:id', 
  authenticate, 
  requireSuperAdmin,
  upload.fields([{ name: 'thumbnail', maxCount: 1 }, { name: 'images', maxCount: 10 }]),
  normalizeVenueBody,
  validate(updateVenueSchema),
  VenueController.updateVenue
);

export default router;
