import prisma from '../../lib/prisma.js';

export class DishServiceError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'DishServiceError';
    this.status = status;
  }
}

function ensureValidId(value, label = 'Identificador') {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new DishServiceError(400, `${label} inválido.`);
  }
  return parsed;
}

export async function findRestaurantDishes(restaurantId) {
  const id = ensureValidId(restaurantId, 'Restaurante');
  const restaurant = await prisma.restaurant.findUnique({ where: { id }, select: { id: true } });
  if (!restaurant) throw new DishServiceError(404, 'Restaurante não encontrado.');

  return prisma.dish.findMany({
    where: { restaurantId: id },
    select: {
      id: true,
      name: true,
      category: true,
      price: true,
      imageUrl: true,
      description: true,
      restaurantId: true
    },
    orderBy: { id: 'desc' }
  });
}

async function findOwnedRestaurant(restaurantId, userId) {
  const id = ensureValidId(restaurantId, 'Restaurante');
  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      ownerId: true,
      owner: { select: { id: true, name: true, email: true } }
    }
  });

  if (!restaurant) throw new DishServiceError(404, 'Restaurante não encontrado.');
  if (restaurant.ownerId !== Number(userId)) {
    throw new DishServiceError(403, 'Somente o criador do restaurante pode gerenciar seus pratos.');
  }
  return restaurant;
}

export async function createRestaurantDish({ restaurantId, userId, name, category, price, description }) {
  const restaurant = await findOwnedRestaurant(restaurantId, userId);
  const dish = await prisma.dish.create({
    data: {
      restaurantId: restaurant.id,
      name,
      category,
      price,
      // A imagem é enviada em um segundo endpoint; até lá, imageUrl fica vazio.
      imageUrl: '',
      description
    }
  });
  return { dish, restaurant };
}

export async function updateRestaurantDish({ restaurantId, dishId, userId, name, category, price, description }) {
  const restaurant = await findOwnedRestaurant(restaurantId, userId);
  const id = ensureValidId(dishId, 'Prato');
  const existingDish = await prisma.dish.findFirst({ where: { id, restaurantId: restaurant.id } });
  if (!existingDish) throw new DishServiceError(404, 'Prato não encontrado neste restaurante.');

  const dish = await prisma.dish.update({
    where: { id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(category !== undefined ? { category } : {}),
      ...(price !== undefined ? { price } : {}),
      ...(description !== undefined ? { description } : {})
    }
  });
  return dish;
}

export async function updateDishImage({ dishId, userId, imageUrl }) {
  const id = ensureValidId(dishId, 'Prato');
  const existingDish = await prisma.dish.findUnique({
    where: { id },
    include: { restaurant: { select: { ownerId: true } } }
  });

  if (!existingDish) throw new DishServiceError(404, 'Prato não encontrado.');
  if (existingDish.restaurant.ownerId !== Number(userId)) {
    throw new DishServiceError(403, 'Somente o criador do restaurante pode enviar imagens para seus pratos.');
  }

  const dish = await prisma.dish.update({ where: { id }, data: { imageUrl } });
  return { dish, previousImageUrl: existingDish.imageUrl };
}

export async function deleteRestaurantDish({ restaurantId, dishId, userId }) {
  const restaurant = await findOwnedRestaurant(restaurantId, userId);
  const id = ensureValidId(dishId, 'Prato');
  const existingDish = await prisma.dish.findFirst({ where: { id, restaurantId: restaurant.id } });
  if (!existingDish) throw new DishServiceError(404, 'Prato não encontrado neste restaurante.');

  await prisma.dish.delete({ where: { id } });
  return { imageUrl: existingDish.imageUrl };
}
