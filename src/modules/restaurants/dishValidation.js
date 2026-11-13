export class DishValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'DishValidationError';
    this.status = 400;
  }
}

/** Valida e normaliza o contrato JSON do endpoint de pratos. */
export function parseDishFields(body = {}, { partial = false } = {}) {
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const category = typeof body.category === 'string' ? body.category.trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const rawPrice = body.price === undefined || body.price === null
    ? ''
    : String(body.price).trim().replace(',', '.');

  if (!partial || body.name !== undefined) {
    if (!name) throw new DishValidationError('O nome do prato é obrigatório.');
    if (name.length > 150) throw new DishValidationError('O nome do prato deve ter até 150 caracteres.');
  }
  if (!partial || body.category !== undefined) {
    if (!category) throw new DishValidationError('A categoria do prato é obrigatória.');
    if (category.length > 100) throw new DishValidationError('A categoria deve ter até 100 caracteres.');
  }
  if (!partial || body.description !== undefined) {
    if (typeof body.description !== 'string' || description.length > 5000) {
      throw new DishValidationError('Informe uma descrição com até 5.000 caracteres.');
    }
  }

  let price;
  if (!partial || body.price !== undefined) {
    const parsedPrice = Number(rawPrice);
    if (!rawPrice || !Number.isFinite(parsedPrice) || parsedPrice < 0 || parsedPrice > 99_999_999.99) {
      throw new DishValidationError('Informe um preço válido entre R$ 0,00 e R$ 99.999.999,99.');
    }
    price = parsedPrice.toFixed(2);
  }

  return {
    ...(body.name !== undefined || !partial ? { name } : {}),
    ...(body.category !== undefined || !partial ? { category } : {}),
    ...(body.description !== undefined || !partial ? { description } : {}),
    ...(body.price !== undefined || !partial ? { price } : {})
  };
}
