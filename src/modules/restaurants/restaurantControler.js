import { findAllRestaurants, createRestaurant } from './restaurantService.js';

export async function getRestaurants(req, res) {
  try {
    const restaurants = await findAllRestaurants();
    return res.json(restaurants);
  } catch (error) {
    console.error('Erro ao buscar restaurantes:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

export async function postRestaurant(req, res) {
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
  const category = typeof req.body.category === 'string' ? req.body.category.trim() : '';
  const { rating } = req.body;

  if (!name || !category) {
    return res.status(400).json({ error: 'Nome e categoria são obrigatórios' });
  }

  if (name.length > 120 || category.length > 80) {
    return res.status(400).json({ error: 'Nome ou categoria excedem o tamanho permitido' });
  }

  let normalizedRating = 0;
  if (rating !== undefined && rating !== null && rating !== '') {
    normalizedRating = Number(rating);

    if (!Number.isFinite(normalizedRating) || normalizedRating < 0 || normalizedRating > 5) {
      return res.status(400).json({ error: 'A avaliação deve estar entre 0 e 5' });
    }
  }

  try {
    const novoRestaurante = await createRestaurant({
      name,
      category,
      rating: normalizedRating
    });

    return res.status(201).json(novoRestaurante);
  } catch (error) {
    console.error('Erro ao cadastrar restaurante:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
}
