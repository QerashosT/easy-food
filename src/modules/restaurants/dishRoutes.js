import { Router } from 'express';
import { verifyJWT } from '../../middlewares/authMiddleware.js';
import { uploadImage } from '../shared/upload.middleware.js';
import {
  getRestaurantDishes,
  postRestaurantDish,
  patchRestaurantDish,
  uploadDishImage,
  removeRestaurantDish
} from './dishController.js';

const router = Router();

// Consulta pública do cardápio.
router.get('/restaurants/:restaurantId/dishes', getRestaurantDishes);

// O prato é criado via JSON e a foto é enviada em uma requisição separada.
router.post('/restaurants/:restaurantId/dishes', verifyJWT, postRestaurantDish);
router.patch('/restaurants/:restaurantId/dishes/:dishId', verifyJWT, patchRestaurantDish);
router.delete('/restaurants/:restaurantId/dishes/:dishId', verifyJWT, removeRestaurantDish);

// Upload exige JWT e a autorização de propriedade é conferida no service.
router.post('/dishes/:dishId/image', verifyJWT, uploadImage, uploadDishImage);

export default router;
