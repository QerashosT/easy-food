import {
  findRestaurantDishes,
  createRestaurantDish,
  updateRestaurantDish,
  updateDishImage,
  deleteRestaurantDish,
  DishServiceError
} from './dishService.js';
import { processAndStoreImage, removeStoredImage, ImageServiceError } from '../shared/image.service.js';
import { sendDishCreatedEmail } from './dishEmailService.js';
import { parseDishFields } from './dishValidation.js';

function sendError(res, error, action) {
  if (error instanceof DishServiceError || error instanceof ImageServiceError || Number.isInteger(error.status)) {
    return res.status(error.status).json({ error: error.message });
  }
  console.error(`${action}:`, error);
  return res.status(500).json({ error: 'Erro interno do servidor.' });
}

export async function getRestaurantDishes(req, res) {
  try {
    const dishes = await findRestaurantDishes(req.params.restaurantId);
    return res.json(dishes);
  } catch (error) {
    return sendError(res, error, 'Erro ao listar pratos');
  }
}

/** Cadastro do prato apenas com JSON, conforme POST /restaurants/:restaurantId/dishes. */
export async function postRestaurantDish(req, res) {
  try {
    const fields = parseDishFields(req.body ?? {});
    const { dish, restaurant } = await createRestaurantDish({
      restaurantId: req.params.restaurantId,
      userId: req.user.id,
      ...fields
    });

    // A notificação permanece opcional e nunca desfaz um cadastro já persistido.
    let notification = { sent: false, status: 'not_configured' };
    try {
      notification = await sendDishCreatedEmail({ owner: restaurant.owner, restaurant, dish });
    } catch (emailError) {
      console.error('Prato criado, mas o e-mail de notificação falhou:', emailError);
      notification = { sent: false, status: 'failed' };
    }

    return res.status(201).json({ dish, notification });
  } catch (error) {
    return sendError(res, error, 'Erro ao cadastrar prato');
  }
}

export async function patchRestaurantDish(req, res) {
  try {
    const fields = parseDishFields(req.body ?? {}, { partial: true });
    if (Object.keys(fields).length === 0) {
      throw new DishServiceError(400, 'Informe ao menos um campo para atualizar o prato.');
    }

    const dish = await updateRestaurantDish({
      restaurantId: req.params.restaurantId,
      dishId: req.params.dishId,
      userId: req.user.id,
      ...fields
    });
    return res.json({ dish });
  } catch (error) {
    return sendError(res, error, 'Erro ao atualizar prato');
  }
}

/** Upload posterior à criação: POST /dishes/:dishId/image. */
export async function uploadDishImage(req, res, next) {
  let storedImage = null;
  try {
    if (!req.file) return res.status(400).json({ error: 'Envie uma imagem no campo "image".' });

    storedImage = await processAndStoreImage(req.file, {
      folder: 'dishes',
      width: 1280,
      height: 960,
      fit: 'inside'
    });

    const result = await updateDishImage({
      dishId: req.params.dishId,
      userId: req.user.id,
      imageUrl: storedImage.imageUrl
    });

    if (result.previousImageUrl) {
      await removeStoredImage(result.previousImageUrl).catch((error) => {
        console.error('Não foi possível remover a foto anterior do prato:', error);
      });
    }

    return res.json({ message: 'Foto do prato atualizada com sucesso.', dish: result.dish });
  } catch (error) {
    if (storedImage?.imageUrl) {
      await removeStoredImage(storedImage.imageUrl).catch(() => {});
    }
    if (error instanceof DishServiceError || error instanceof ImageServiceError || Number.isInteger(error.status)) {
      return sendError(res, error, 'Erro ao enviar foto do prato');
    }
    return next(error);
  }
}

export async function removeRestaurantDish(req, res) {
  try {
    const result = await deleteRestaurantDish({
      restaurantId: req.params.restaurantId,
      dishId: req.params.dishId,
      userId: req.user.id
    });
    if (result.imageUrl) {
      await removeStoredImage(result.imageUrl).catch((error) => {
        console.error('Não foi possível remover a foto do prato:', error);
      });
    }
    return res.status(204).end();
  } catch (error) {
    return sendError(res, error, 'Erro ao excluir prato');
  }
}
