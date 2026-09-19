import { Router } from 'express';
import { getRestaurants, postRestaurant } from './restaurantControler.js';
import { verifyJWT } from '../../middlewares/authMiddleware.js';

const router = Router();

// A listagem continua pública para manter a API existente.
router.get('/restaurants', getRestaurants);

// Cadastro exige uma sessão válida.
router.post('/restaurants', verifyJWT, postRestaurant);

export default router;
