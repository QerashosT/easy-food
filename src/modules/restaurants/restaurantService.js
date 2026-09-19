import prisma from '../../lib/prisma.js';

export async function findAllRestaurants() {
  return prisma.restaurant.findMany({
    orderBy: { id: 'desc' }
  });
}

export async function createRestaurant({ name, category, rating = 0 }) {
  return prisma.restaurant.create({
    data: {
      name,
      category,
      rating
    }
  });
}
