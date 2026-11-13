import { Router } from 'express';
import { register, login, uploadMyProfileImage } from './auth.controller.js';
import { verifyJWT } from '../../middlewares/authMiddleware.js';
import { uploadImage } from '../shared/upload.middleware.js';
import { getUserById } from './auth.service.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);

router.get('/me', verifyJWT, async (req, res, next) => {
  try {
    const user = await getUserById(req.user.id);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    return res.json({ user });
  } catch (error) {
    return next(error);
  }
});

// A conta é identificada exclusivamente pelo usuário contido no JWT.
router.post('/me/image', verifyJWT, uploadImage, uploadMyProfileImage);

export default router;
