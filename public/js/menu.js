const TOKEN_KEY = 'token';
const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

let currentUser = null;
let currentRestaurant = null;
let dishes = [];
let editingDishId = null;
let previewObjectUrl = null;

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

function safeDishImageUrl(value) {
  if (typeof value !== 'string' || !value.startsWith('/uploads/dishes/')) return null;

  try {
    const url = new URL(value, window.location.origin);
    if (url.origin !== window.location.origin) return null;
    if (!/^\/uploads\/dishes\/[A-Za-z0-9_-]+\.(?:jpe?g|png|webp)$/i.test(url.pathname)) return null;
    return `${url.pathname}${url.search}`;
  } catch {
    return null;
  }
}

function formatPrice(value) {
  if (value === null || value === undefined || value === '') return 'Preço não informado';
  const amount = Number(value);
  if (!Number.isFinite(amount)) return 'Preço não informado';
  return amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function redirectToLogin() {
  const destination = `${window.location.pathname}${window.location.search}`;
  window.location.replace(`/auth/login?redirect=${encodeURIComponent(destination || '/')}`);
}

async function apiFetch(url, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(url, { ...options, headers, cache: options.cache || 'no-store' });
  if (response.status === 401) {
    clearSession();
    redirectToLogin();
    throw new Error('UNAUTHORIZED');
  }
  return response;
}

function showPageStatus(message, type = 'success') {
  const status = document.getElementById('pageStatus');
  if (!status) return;
  status.textContent = message;
  status.className = message ? `menu-status ${type}` : 'menu-status';
}

function showFormStatus(message, type = 'success') {
  const status = document.getElementById('dishFormStatus');
  if (!status) return;
  status.textContent = message;
  status.className = message ? `dish-form-status ${type}` : 'dish-form-status';
}

function configureUser(user) {
  currentUser = user;
  const name = user?.name || 'Usuário';
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join('') || 'U';
  const avatar = document.getElementById('userAvatar');
  document.getElementById('authStatus').textContent = name;
  document.getElementById('authStatus').title = user?.email || name;
  avatar.textContent = initials;
  avatar.style.backgroundImage = '';

  const imageUrl = typeof user?.imageUrl === 'string' && /^\/uploads\/profiles\/[a-z0-9-]+\.webp$/i.test(user.imageUrl)
    ? user.imageUrl
    : null;
  if (imageUrl) {
    avatar.textContent = '';
    avatar.style.backgroundImage = `url("${imageUrl}")`;
  }
}

async function uploadProfileImage(file) {
  if (!file) return;
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    showPageStatus('Formato inválido. Selecione JPEG, PNG ou WebP.', 'error');
    document.getElementById('profileImageInput').value = '';
    return;
  }
  if (file.size > IMAGE_MAX_BYTES) {
    showPageStatus('A foto deve ter no máximo 5 MB.', 'error');
    document.getElementById('profileImageInput').value = '';
    return;
  }

  const button = document.getElementById('userAvatar');
  const input = document.getElementById('profileImageInput');
  if (button) button.disabled = true;
  try {
    const form = new FormData();
    form.append('image', file);
    const response = await apiFetch('/auth/me/image', { method: 'POST', body: form });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Não foi possível atualizar a foto de perfil.');
    configureUser(data.user);
    showPageStatus('Foto de perfil atualizada com sucesso.', 'success');
  } catch (error) {
    if (error.message === 'UNAUTHORIZED') return;
    showPageStatus(error.message || 'Erro ao enviar a foto de perfil.', 'error');
  } finally {
    if (button) button.disabled = false;
    if (input) input.value = '';
  }
}

function isOwner() {
  return Boolean(currentRestaurant && currentUser && Number(currentRestaurant.ownerId) === Number(currentUser.id));
}

function configureRestaurant(restaurant) {
  currentRestaurant = restaurant;
  document.title = `${restaurant.name} — Cardápio EasyFood`;
  document.getElementById('restaurantCategory').textContent = restaurant.category || 'RESTAURANTE';
  document.getElementById('restaurantName').textContent = restaurant.name || 'Restaurante';
  document.getElementById('restaurantSummary').textContent = `Confira os pratos de ${restaurant.name || 'este restaurante'} e escolha sua próxima refeição.`;

  const rating = restaurant.rating == null ? null : Number(restaurant.rating);
  document.getElementById('restaurantRating').textContent = Number.isFinite(rating) ? `★ ${rating.toFixed(1)} / 5` : '★ Sem avaliação';

  const owner = isOwner();
  document.getElementById('openDishFormButton').classList.toggle('hidden', !owner);
  document.getElementById('dishManagement').classList.toggle('hidden', true);

  const notice = document.getElementById('ownerNotice');
  if (notice) {
    if (owner) {
      notice.classList.add('hidden');
      notice.textContent = '';
    } else {
      notice.classList.remove('hidden');
      notice.textContent = restaurant.ownerId == null
        ? 'Este restaurante foi cadastrado antes do registro de proprietários. O cardápio pode ser consultado, mas um administrador precisa atribuir um responsável para habilitar edições.'
        : 'Cardápio público. Somente a pessoa que criou este restaurante pode cadastrar, editar ou excluir pratos.';
    }
  }
}

function renderDishCount() {
  const total = dishes.length;
  document.getElementById('dishCount').textContent = `${total} ${total === 1 ? 'prato cadastrado' : 'pratos cadastrados'}`;
}

function renderDishes() {
  const container = document.getElementById('dishList');
  renderDishCount();

  if (!dishes.length) {
    container.innerHTML = `
      <div class="menu-empty glass-card">
        <div class="empty-art">✦</div>
        <h3>Este cardápio ainda está vazio.</h3>
        <p>${isOwner() ? 'Use “Cadastrar prato” para adicionar a primeira opção. O formulário ficará disponível acima desta lista.' : 'O proprietário ainda não publicou pratos neste restaurante.'}</p>
      </div>
    `;
    return;
  }

  container.innerHTML = dishes.map((dish) => {
    const imageUrl = safeDishImageUrl(dish.imageUrl);
    const image = imageUrl
      ? `<img src="${escapeHtml(imageUrl)}" alt="Foto de ${escapeHtml(dish.name)}" loading="lazy">`
      : '<div class="menu-dish-photo-placeholder" aria-label="Sem foto disponível">✦</div>';
    const category = dish.category ? `<span class="menu-dish-category">${escapeHtml(dish.category)}</span>` : '';
    const description = dish.description
      ? `<p>${escapeHtml(dish.description)}</p>`
      : '<p class="no-description">Sem descrição cadastrada.</p>';
    const actions = isOwner()
      ? `<div class="menu-dish-actions"><button type="button" data-edit-dish="${Number(dish.id)}">Editar</button><button type="button" data-delete-dish="${Number(dish.id)}" class="delete-button">Excluir</button></div>`
      : '';

    return `
      <article class="menu-dish-card">
        <div class="menu-dish-photo">${image}</div>
        <div class="menu-dish-content">
          <div class="menu-dish-title"><h3>${escapeHtml(dish.name)}</h3><strong class="menu-dish-price">${formatPrice(dish.price)}</strong></div>
          ${category}
          ${description}
          ${actions}
        </div>
      </article>
    `;
  }).join('');

  container.querySelectorAll('[data-edit-dish]').forEach((button) => {
    button.addEventListener('click', () => {
      const dish = dishes.find((item) => Number(item.id) === Number(button.dataset.editDish));
      startEditDish(dish);
    });
  });

  container.querySelectorAll('.menu-dish-photo img').forEach((image) => {
    image.addEventListener('error', () => {
      const placeholder = document.createElement('div');
      placeholder.className = 'menu-dish-photo-placeholder';
      placeholder.setAttribute('aria-label', 'Foto indisponível');
      placeholder.textContent = '✦';
      image.replaceWith(placeholder);
    }, { once: true });
  });

  container.querySelectorAll('[data-delete-dish]').forEach((button) => {
    button.addEventListener('click', () => deleteDish(Number(button.dataset.deleteDish)));
  });
}

async function loadDishes() {
  if (!currentRestaurant) return;
  const container = document.getElementById('dishList');
  container.innerHTML = '<div class="menu-empty glass-card"><div class="empty-art">✦</div><h3>Carregando pratos...</h3></div>';

  try {
    const response = await apiFetch(`/restaurants/${currentRestaurant.id}/dishes`);
    const data = await response.json().catch(() => []);
    if (!response.ok) throw new Error(data.error || 'Não foi possível carregar os pratos.');
    dishes = Array.isArray(data) ? data : [];
    renderDishes();
  } catch (error) {
    if (error.message === 'UNAUTHORIZED') return;
    container.innerHTML = '<div class="menu-empty glass-card"><div class="empty-art">!</div><h3>Não foi possível carregar o cardápio.</h3><p>Verifique a conexão e atualize a página.</p></div>';
    showPageStatus(error.message || 'Erro ao carregar o cardápio.', 'error');
  }
}

function setPreview(imageUrl, caption) {
  const image = document.getElementById('imagePreview');
  const placeholder = document.getElementById('imagePreviewPlaceholder');
  const captionEl = document.getElementById('imagePreviewCaption');

  if (imageUrl) {
    image.src = imageUrl;
    image.classList.remove('hidden');
    placeholder.classList.add('hidden');
  } else {
    image.removeAttribute('src');
    image.classList.add('hidden');
    placeholder.classList.remove('hidden');
  }
  captionEl.textContent = caption || 'Selecione uma imagem para visualizar como ela ficará no cardápio.';
}

function revokePreviewUrl() {
  if (previewObjectUrl) {
    URL.revokeObjectURL(previewObjectUrl);
    previewObjectUrl = null;
  }
}

function clearDishForm() {
  document.getElementById('dishForm').reset();
  editingDishId = null;
  revokePreviewUrl();
  setPreview(null);
  document.getElementById('dishManagementTitle').textContent = 'Cadastrar um prato';
  document.getElementById('dishSubmitButton').innerHTML = 'Cadastrar prato <span>→</span>';
  document.getElementById('cancelDishEdit').classList.add('hidden');
  showFormStatus('');
}

function openDishForm({ focus = true } = {}) {
  if (!isOwner()) return;
  const panel = document.getElementById('dishManagement');
  panel.classList.remove('hidden');
  document.getElementById('openDishFormButton').classList.add('hidden');
  if (focus) {
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.setTimeout(() => document.getElementById('dishName').focus(), 350);
  }
}

function closeDishForm() {
  clearDishForm();
  document.getElementById('dishManagement').classList.add('hidden');
  document.getElementById('openDishFormButton').classList.toggle('hidden', !isOwner());
}

function startEditDish(dish) {
  if (!dish || !isOwner()) return;
  clearDishForm();
  editingDishId = Number(dish.id);
  document.getElementById('dishName').value = dish.name || '';
  document.getElementById('dishCategory').value = dish.category || '';
  document.getElementById('dishDescription').value = dish.description || '';
  document.getElementById('dishPrice').value = dish.price ?? '';
  document.getElementById('dishManagementTitle').textContent = `Editar: ${dish.name}`;
  document.getElementById('dishSubmitButton').innerHTML = 'Salvar alterações <span>→</span>';
  document.getElementById('cancelDishEdit').classList.remove('hidden');

  const currentImage = safeDishImageUrl(dish.imageUrl);
  if (currentImage) setPreview(currentImage, 'Foto atual. Escolha outro arquivo somente se quiser substituí-la.');
  else setPreview(null, 'Este prato ainda não tem foto. Você pode adicionar uma agora.');

  openDishForm({ focus: false });
  document.getElementById('dishManagement').scrollIntoView({ behavior: 'smooth', block: 'start' });
  window.setTimeout(() => document.getElementById('dishName').focus(), 350);
}

function validateSelectedImage(file) {
  if (!file) return true;
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    showFormStatus('Formato inválido. Selecione uma imagem JPG, PNG ou WebP.', 'error');
    return false;
  }
  if (file.size > IMAGE_MAX_BYTES) {
    showFormStatus('A imagem excede o limite de 5 MB.', 'error');
    return false;
  }
  return true;
}

function handleImageSelection(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  if (!validateSelectedImage(file)) {
    event.target.value = '';
    return;
  }

  revokePreviewUrl();
  previewObjectUrl = URL.createObjectURL(file);
  setPreview(previewObjectUrl, `${file.name} · ${(file.size / 1024 / 1024).toFixed(2)} MB`);
  showFormStatus('');
}

async function saveDish(event) {
  event.preventDefault();
  if (!isOwner()) {
    showFormStatus('Somente quem criou o restaurante pode gerenciar os pratos.', 'error');
    return;
  }

  const submit = document.getElementById('dishSubmitButton');
  const imageInput = document.getElementById('dishImage');
  const selectedImage = imageInput.files?.[0];
  if (!validateSelectedImage(selectedImage)) return;

  const fields = {
    name: document.getElementById('dishName').value.trim(),
    category: document.getElementById('dishCategory').value.trim(),
    description: document.getElementById('dishDescription').value.trim(),
    price: document.getElementById('dishPrice').value
  };
  if (!fields.name || !fields.category || fields.price === '') {
    showFormStatus('Preencha nome, categoria e preço do prato.', 'error');
    return;
  }

  const editingNow = editingDishId !== null;
  const endpoint = `/restaurants/${currentRestaurant.id}/dishes${editingNow ? `/${editingDishId}` : ''}`;
  submit.disabled = true;
  submit.textContent = editingNow ? 'Salvando...' : 'Cadastrando...';
  showFormStatus('');

  let dishSaved = false;
  try {
    const response = await apiFetch(endpoint, {
      method: editingNow ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Não foi possível salvar o prato.');

    const savedDish = data.dish || data;
    if (!savedDish?.id) throw new Error('O servidor não retornou o identificador do prato.');
    dishSaved = true;

    let imageUploadError = null;
    if (selectedImage) {
      const imageForm = new FormData();
      imageForm.append('image', selectedImage);
      const imageResponse = await apiFetch(`/dishes/${savedDish.id}/image`, {
        method: 'POST',
        body: imageForm
      });
      const imageData = await imageResponse.json().catch(() => ({}));
      if (!imageResponse.ok) imageUploadError = imageData.error || 'Não foi possível enviar a foto.';
    }

    const wasEditing = editingNow;
    clearDishForm();
    await loadDishes();

    if (imageUploadError) {
      showFormStatus(`Prato ${wasEditing ? 'atualizado' : 'cadastrado'}, mas a foto não foi enviada: ${imageUploadError}`, 'error');
    } else if (wasEditing) {
      showPageStatus(selectedImage ? 'Prato e foto atualizados com sucesso.' : 'Prato atualizado com sucesso.', 'success');
    } else if (data.notification?.sent) {
      showPageStatus(selectedImage ? 'Prato cadastrado, foto enviada e e-mail de notificação enviado.' : 'Prato cadastrado e e-mail de notificação enviado.', 'success');
    } else if (data.notification?.status === 'not_configured') {
      showPageStatus(selectedImage ? 'Prato cadastrado e foto enviada. O e-mail ainda não está configurado.' : 'Prato cadastrado. O e-mail ainda não está configurado.', 'success');
    } else {
      showPageStatus('Prato cadastrado, mas o e-mail de notificação não foi confirmado.', 'success');
    }
  } catch (error) {
    if (error.message === 'UNAUTHORIZED') return;
    if (dishSaved) {
      await loadDishes();
      showPageStatus(`O prato foi salvo, mas houve uma falha complementar: ${error.message}`, 'error');
    } else {
      showFormStatus(error.message || 'Erro ao salvar o prato.', 'error');
    }
  } finally {
    submit.disabled = false;
    submit.innerHTML = editingDishId === null ? 'Cadastrar prato <span>→</span>' : 'Salvar alterações <span>→</span>';
  }
}

async function deleteDish(dishId) {
  if (!isOwner()) return;
  const dish = dishes.find((item) => Number(item.id) === Number(dishId));
  if (!window.confirm(`Excluir “${dish?.name || 'este prato'}”? Esta ação não pode ser desfeita.`)) return;

  try {
    const response = await apiFetch(`/restaurants/${currentRestaurant.id}/dishes/${dishId}`, { method: 'DELETE' });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Não foi possível excluir o prato.');
    await loadDishes();
    showPageStatus('Prato excluído.', 'success');
  } catch (error) {
    if (error.message === 'UNAUTHORIZED') return;
    showPageStatus(error.message || 'Erro ao excluir o prato.', 'error');
  }
}

async function loadRestaurantPage() {
  const token = getToken();
  if (!token) {
    redirectToLogin();
    return;
  }

  try {
    const meResponse = await apiFetch('/auth/me');
    const meData = await meResponse.json().catch(() => ({}));
    if (!meResponse.ok || !meData.user) throw new Error('Não foi possível validar a conta.');
    configureUser(meData.user);

    const restaurantId = Number(window.location.pathname.match(/\/restaurantes\/(\d+)\/cardapio/)?.[1]);
    if (!Number.isSafeInteger(restaurantId) || restaurantId <= 0) throw new Error('Endereço de restaurante inválido.');

    const restaurantsResponse = await apiFetch('/restaurants');
    const restaurantsData = await restaurantsResponse.json().catch(() => []);
    if (!restaurantsResponse.ok) throw new Error('Não foi possível carregar os restaurantes.');
    const restaurants = Array.isArray(restaurantsData) ? restaurantsData : restaurantsData.restaurants || [];
    const restaurant = restaurants.find((item) => Number(item.id) === restaurantId);
    if (!restaurant) {
      document.title = 'Restaurante não encontrado — EasyFood';
      document.getElementById('restaurantName').textContent = 'Restaurante não encontrado';
      document.getElementById('restaurantSummary').textContent = 'Este restaurante pode ter sido removido ou o endereço está incorreto.';
      document.getElementById('dishList').innerHTML = '<div class="menu-empty glass-card"><div class="empty-art">!</div><h3>Não encontramos este restaurante.</h3><p>Volte ao catálogo para escolher outro estabelecimento.</p><a href="/#catalogo">Voltar ao catálogo</a></div>';
      document.getElementById('loadingScreen').classList.add('hidden');
      document.getElementById('appContent').classList.remove('hidden');
      return;
    }

    configureRestaurant(restaurant);
    document.getElementById('loadingScreen').classList.add('hidden');
    document.getElementById('appContent').classList.remove('hidden');
    await loadDishes();
  } catch (error) {
    if (error.message === 'UNAUTHORIZED') return;
    console.error('Erro ao abrir cardápio:', error);
    showPageStatus(error.message || 'Não foi possível abrir este cardápio.', 'error');
    document.getElementById('loadingScreen').classList.add('hidden');
    document.getElementById('appContent').classList.remove('hidden');
    if (!currentRestaurant) {
      document.getElementById('restaurantName').textContent = 'Não foi possível abrir o restaurante';
      document.getElementById('dishList').innerHTML = '<div class="menu-empty glass-card"><div class="empty-art">!</div><h3>Não foi possível carregar este cardápio.</h3><p>Volte ao catálogo e tente abrir o restaurante novamente.</p><a href="/#catalogo">Voltar aos restaurantes</a></div>';
    }
  }
}

function logout() {
  clearSession();
  window.location.replace('/auth/login');
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('logoutButton')?.addEventListener('click', logout);
  document.getElementById('userAvatar')?.addEventListener('click', () => document.getElementById('profileImageInput')?.click());
  document.getElementById('profileImageInput')?.addEventListener('change', (event) => uploadProfileImage(event.target.files?.[0]));
  document.getElementById('openDishFormButton')?.addEventListener('click', () => openDishForm());
  document.getElementById('closeDishFormButton')?.addEventListener('click', closeDishForm);
  document.getElementById('cancelDishEdit')?.addEventListener('click', clearDishForm);
  document.getElementById('dishForm')?.addEventListener('submit', saveDish);
  document.getElementById('dishImage')?.addEventListener('change', handleImageSelection);
  window.addEventListener('beforeunload', revokePreviewUrl);
  loadRestaurantPage();
});
