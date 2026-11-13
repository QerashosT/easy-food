import { Router } from 'express';
import { getRestaurants, postRestaurant } from './restaurantControler.js';
import { verifyJWT } from '../../middlewares/authMiddleware.js';

const router = Router();

// A listagem continua pública para manter a API existente.
router.get('/restaurants', getRestaurants);

// O usuário autenticado passa a ser o proprietário do restaurante que cadastrou.
router.post('/restaurants', verifyJWT, postRestaurant);

export default router;
