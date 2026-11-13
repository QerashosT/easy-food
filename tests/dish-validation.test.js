import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDishFields, DishValidationError } from '../src/modules/restaurants/dishValidation.js';

test('valida e normaliza o JSON de cadastro de prato', () => {
  const result = parseDishFields({
    name: '  Lasanha da casa  ',
    category: ' Massas ',
    description: ' Molho artesanal ',
    price: '39,9'
  });

  assert.deepEqual(result, {
    name: 'Lasanha da casa',
    category: 'Massas',
    description: 'Molho artesanal',
    price: '39.90'
  });
});

test('exige nome, categoria, preço e descrição no cadastro', () => {
  assert.throws(() => parseDishFields({ name: 'Lasanha', price: '20' }), DishValidationError);
  assert.throws(() => parseDishFields({ name: 'Lasanha', category: 'Massas', price: '20' }), /descrição/i);
  assert.throws(() => parseDishFields({ name: 'Lasanha', category: 'Massas', description: '', price: '' }), /preço/i);
});

test('rejeita preços inválidos e valores negativos', () => {
  const base = { name: 'Lasanha', category: 'Massas', description: 'Molho', price: '20' };
  assert.throws(() => parseDishFields({ ...base, price: '-1' }), /preço/i);
  assert.throws(() => parseDishFields({ ...base, price: 'abc' }), /preço/i);
  assert.throws(() => parseDishFields({ ...base, price: '100000000' }), /preço/i);
});

test('atualização parcial só inclui os campos enviados', () => {
  assert.deepEqual(parseDishFields({ category: 'Sobremesas' }, { partial: true }), {
    category: 'Sobremesas'
  });
  assert.throws(() => parseDishFields({ category: ' ' }, { partial: true }), DishValidationError);
});

test('rejeita campos acima dos limites', () => {
  const base = { name: 'x'.repeat(151), category: 'Massas', description: 'descrição', price: '1' };
  assert.throws(() => parseDishFields(base), /150 caracteres/i);
});
