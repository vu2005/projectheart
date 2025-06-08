import { Router } from 'express';
import { YourController } from '../controllers/index';

const router = Router();

// Define your routes here
router.get('/your-endpoint', YourController.getMethod);
router.post('/your-endpoint', YourController.createMethod);
router.put('/your-endpoint/:id', YourController.updateMethod);
router.delete('/your-endpoint/:id', YourController.deleteMethod);

export default router;