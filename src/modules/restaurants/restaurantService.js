import prisma from '../../lib/prisma.js';

export async function findAllRestaurants() {
  return prisma.restaurant.findMany({
    orderBy: { id: 'desc' },
    include: { _count: { select: { dishes: true } } }
  });
}

export async function createRestaurant({ name, category, rating = 0, ownerId }) {
  return prisma.restaurant.create({
    data: { name, category, rating: Number(rating).toFixed(1), ownerId: Number(ownerId) }
  });
}
