import { Router } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '../../public');

const pages = {
  home: path.join(publicDir, 'index.html'),
  login: path.join(publicDir, 'auth', 'login.html'),
  register: path.join(publicDir, 'auth', 'register.html'),
  menu: path.join(publicDir, 'menu.html'),
};

function sendPage(file) {
  return (_req, res) => {
    res.set('Cache-Control', 'no-store');
    res.sendFile(file);
  };
}

router.get('/', sendPage(pages.home));
router.get('/auth', (_req, res) => res.redirect(302, '/auth/login'));
router.get('/auth/login', sendPage(pages.login));
router.get('/auth/register', sendPage(pages.register));
router.get('/restaurantes/:restaurantId/cardapio', (req, res, next) => {
  if (!/^\d+$/.test(req.params.restaurantId)) return next();
  return sendPage(pages.menu)(req, res);
});

export default router;
