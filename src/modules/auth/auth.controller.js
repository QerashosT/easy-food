import { registerUser, loginUser, setUserProfileImage } from './auth.service.js';
import { processAndStoreImage, removeStoredImage, ImageServiceError } from '../shared/image.service.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function register(req, res, next) {
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios' });
  }
  if (name.length < 2 || name.length > 150) {
    return res.status(400).json({ error: 'O nome deve ter entre 2 e 150 caracteres' });
  }
  if (!EMAIL_RE.test(email) || email.length > 150) {
    return res.status(400).json({ error: 'Informe um e-mail válido com até 150 caracteres' });
  }
  if (password.length < 6 || password.length > 72) {
    return res.status(400).json({ error: 'A senha deve ter entre 6 e 72 caracteres' });
  }

  try {
    const user = await registerUser({ name, email, password });
    return res.status(201).json(user);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'E-mail já cadastrado' });
    }
    return next(error);
  }
}

export async function login(req, res, next) {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';

  if (!email || !password) {
    return res.status(400).json({ error: 'E-mail e senha são obrigatórios' });
  }

  try {
    const result = await loginUser({ email, password });
    if (!result) return res.status(401).json({ error: 'Credenciais inválidas' });
    return res.json(result);
  } catch (error) {
    return next(error);
  }
}

export async function uploadMyProfileImage(req, res, next) {
  let storedImage = null;
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Envie uma imagem no campo "image".' });
    }

    storedImage = await processAndStoreImage(req.file, {
      folder: 'profiles',
      width: 512,
      height: 512,
      fit: 'cover'
    });

    const { user, previousImageUrl } = await setUserProfileImage(req.user.id, storedImage.imageUrl);
    // Remove a imagem anterior somente depois de confirmar a atualização no banco.
    if (previousImageUrl && previousImageUrl !== storedImage.imageUrl) {
      await removeStoredImage(previousImageUrl).catch((error) => {
        console.error('Não foi possível remover a foto de perfil anterior:', error);
      });
    }

    return res.json({ message: 'Foto de perfil atualizada com sucesso.', user });
  } catch (error) {
    if (storedImage?.imageUrl) {
      await removeStoredImage(storedImage.imageUrl).catch(() => {});
    }
    if (error instanceof ImageServiceError) {
      return res.status(error.status).json({ error: error.message });
    }
    return next(error);
  }
}
