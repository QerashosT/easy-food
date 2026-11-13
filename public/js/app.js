const API = {
  me: '/auth/me',
  restaurants: '/restaurants'
};

let todosRestaurantes = [];
let usuarioAtual = null;

function obterToken() {
  return localStorage.getItem('token');
}

function limparSessao() {
  localStorage.removeItem('token');
}

function escaparHTML(valor) {
  const div = document.createElement('div');
  div.textContent = String(valor);
  return div.innerHTML;
}

function mostrarStatus(mensagem, tipo = 'success') {
  const status = document.getElementById('status');
  if (!status) return;

  status.textContent = mensagem;
  status.className = `status ${tipo}`;

  window.clearTimeout(mostrarStatus.timer);
  mostrarStatus.timer = window.setTimeout(() => {
    status.className = 'status';
    status.textContent = '';
  }, 4000);
}

function redirecionarParaLogin() {
  const destino = `${window.location.pathname}${window.location.search}`;
  const query = encodeURIComponent(destino || '/');
  window.location.replace(`/auth/login?redirect=${query}`);
}

async function validarSessao() {
  const token = obterToken();
  if (!token) {
    redirecionarParaLogin();
    return null;
  }

  try {
    const response = await fetch(API.me, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store'
    });

    if (response.status === 401) {
      limparSessao();
      redirecionarParaLogin();
      return null;
    }

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('Erro ao validar autenticação:', error);
    mostrarStatus('Não foi possível validar sua sessão.', 'error');
    return null;
  }
}

async function apiFetch(url, options = {}) {
  const token = obterToken();
  const headers = new Headers(options.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    limparSessao();
    redirecionarParaLogin();
    throw new Error('UNAUTHORIZED');
  }

  return response;
}

function atualizarResumo(lista) {
  const total = lista.length;
  const categorias = new Set(lista.map((rest) => String(rest.category ?? '').trim()).filter(Boolean)).size;
  const ratings = lista
    .map((rest) => Number(rest.rating))
    .filter((value) => Number.isFinite(value));
  const media = ratings.length
    ? (ratings.reduce((acc, value) => acc + value, 0) / ratings.length).toFixed(1)
    : '—';

  const totalEl = document.getElementById('totalRestaurantes');
  const categoriasEl = document.getElementById('totalCategorias');
  const mediaEl = document.getElementById('mediaAvaliacoes');

  if (totalEl) totalEl.textContent = total;
  if (categoriasEl) categoriasEl.textContent = categorias;
  if (mediaEl) mediaEl.textContent = media;
}

function inicialDaCategoria(categoria) {
  const texto = String(categoria || '').trim();
  return texto ? texto[0].toUpperCase() : 'R';
}

function exibirRestaurantes(lista) {
  const container = document.getElementById('listaRestaurantes');
  if (!container) return;

  container.innerHTML = '';

  if (!lista.length) {
    container.innerHTML = `
      <div class="empty-state glass-card">
        <div class="empty-art">✦</div>
        <h3>Nenhum restaurante encontrado.</h3>
        <p>Cadastre um novo estabelecimento ou escolha outra categoria.</p>
      </div>
    `;
    return;
  }

  lista.forEach((rest, index) => {
    const card = document.createElement('a');
    const menuUrl = `/restaurantes/${encodeURIComponent(rest.id)}/cardapio`;
    card.className = 'restaurant-card tilt-card';
    card.dataset.tiltStrength = '5';
    card.href = menuUrl;
    card.setAttribute('aria-label', `Abrir cardápio de ${rest.name || 'restaurante'}`);

    const nome = escaparHTML(rest.name ?? 'Sem nome');
    const categoria = escaparHTML(rest.category ?? 'Sem categoria');
    const ratingValue = rest.rating == null ? null : Number(rest.rating);
    const rating = Number.isFinite(ratingValue) ? ratingValue.toFixed(1) : 'N/A';
    const dishCount = Number(rest._count?.dishes || 0);

    card.innerHTML = `
      <div class="restaurant-top">
        <div class="restaurant-mark">${escaparHTML(inicialDaCategoria(rest.category))}</div>
        <span class="restaurant-id">#${String(index + 1).padStart(2, '0')}</span>
      </div>
      <h3>${nome}</h3>
      <span class="badge">${categoria}</span>
      <div class="restaurant-bottom">
        <span>avaliação</span>
        <span class="rating">★ ${rating}</span>
      </div>
      <div class="restaurant-card-actions">
        <span>${dishCount} ${dishCount === 1 ? 'prato' : 'pratos'}</span>
        <span class="menu-open-button">Ver cardápio <span aria-hidden="true">→</span></span>
      </div>
    `;

    container.appendChild(card);
  });

  aplicarTiltCards(container);
}


function atualizarFiltros(lista) {
  const select = document.getElementById('filtroCategory');
  if (!select) return;

  const valorAtual = select.value;
  const categorias = [...new Set(lista.map((rest) => rest.category).filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b), 'pt-BR'));

  select.innerHTML = '<option value="">Todas as categorias</option>';
  categorias.forEach((categoria) => {
    const option = document.createElement('option');
    option.value = categoria;
    option.textContent = categoria;
    select.appendChild(option);
  });

  if (categorias.includes(valorAtual)) select.value = valorAtual;
}

function filtrarRestaurantes() {
  const select = document.getElementById('filtroCategory');
  const categoria = select?.value || '';
  const filtrados = categoria
    ? todosRestaurantes.filter((rest) => rest.category === categoria)
    : todosRestaurantes;

  exibirRestaurantes(filtrados);
}

async function carregarRestaurantes() {
  try {
    const response = await apiFetch(API.restaurants, { cache: 'no-store' });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const dados = await response.json();
    todosRestaurantes = Array.isArray(dados)
      ? dados
      : Array.isArray(dados.restaurants)
        ? dados.restaurants
        : [];

    atualizarResumo(todosRestaurantes);
    exibirRestaurantes(todosRestaurantes);
    atualizarFiltros(todosRestaurantes);
  } catch (error) {
    if (error.message === 'UNAUTHORIZED') return;

    console.error('Erro ao carregar restaurantes:', error);
    document.getElementById('listaRestaurantes').innerHTML = `
      <div class="empty-state glass-card">
        <div class="empty-art">!</div>
        <h3>Não foi possível carregar.</h3>
        <p>Verifique a conexão com o servidor e tente novamente.</p>
      </div>
    `;
    mostrarStatus('Erro ao conectar com o servidor da API.', 'error');
  }
}

async function cadastrarRestaurante(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const submitButton = document.getElementById('submitButton');
  const novoRestaurante = {
    name: document.getElementById('name').value.trim(),
    category: document.getElementById('category').value.trim(),
    rating: Number(document.getElementById('rating').value)
  };

  if (!novoRestaurante.name || !novoRestaurante.category) {
    mostrarStatus('Preencha nome e categoria.', 'error');
    return;
  }

  if (!Number.isFinite(novoRestaurante.rating) || novoRestaurante.rating < 0 || novoRestaurante.rating > 5) {
    mostrarStatus('A avaliação deve estar entre 0 e 5.', 'error');
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = 'Cadastrando...';

  try {
    const response = await apiFetch(API.restaurants, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(novoRestaurante)
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      mostrarStatus(data.error || 'Erro ao cadastrar restaurante.', 'error');
      return;
    }

    form.reset();
    mostrarStatus('Restaurante cadastrado com sucesso!', 'success');
    await carregarRestaurantes();
    document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (error) {
    if (error.message === 'UNAUTHORIZED') return;
    console.error('Erro na requisição POST:', error);
    mostrarStatus('Não foi possível conectar ao servidor.', 'error');
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = 'Cadastrar restaurante <span>→</span>';
  }
}

function configurarIdentidade(usuario) {
  const status = document.getElementById('authStatus');
  const avatar = document.getElementById('userAvatar');
  if (!status || !avatar) return;

  const nome = usuario?.name || 'Usuário';
  const iniciais = nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0].toUpperCase())
    .join('') || 'U';

  status.textContent = nome;
  status.title = usuario?.email || nome;
  avatar.textContent = iniciais;
  avatar.style.backgroundImage = '';

  const imageUrl = typeof usuario?.imageUrl === 'string' && /^\/uploads\/profiles\/[a-z0-9-]+\.webp$/i.test(usuario.imageUrl)
    ? usuario.imageUrl
    : null;
  if (imageUrl) {
    avatar.textContent = '';
    avatar.style.backgroundImage = `url("${imageUrl}")`;
  }
}

async function enviarFotoPerfil(file) {
  if (!file) return;
  const allowed = new Set(['image/jpeg', 'image/png', 'image/webp']);
  if (!allowed.has(file.type)) {
    mostrarStatus('Formato inválido. Selecione JPEG, PNG ou WebP.', 'error');
    document.getElementById('profileImageInput').value = '';
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    mostrarStatus('A foto deve ter no máximo 5 MB.', 'error');
    document.getElementById('profileImageInput').value = '';
    return;
  }

  const button = document.getElementById('userAvatar');
  const input = document.getElementById('profileImageInput');
  if (button) button.disabled = true;
  try {
    const formData = new FormData();
    formData.append('image', file);
    const response = await apiFetch('/auth/me/image', { method: 'POST', body: formData });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Não foi possível atualizar a foto de perfil.');
    usuarioAtual = data.user;
    configurarIdentidade(data.user);
    mostrarStatus('Foto de perfil atualizada com sucesso.', 'success');
  } catch (error) {
    if (error.message === 'UNAUTHORIZED') return;
    mostrarStatus(error.message || 'Erro ao enviar a foto de perfil.', 'error');
  } finally {
    if (button) button.disabled = false;
    if (input) input.value = '';
  }
}

async function fazerLogout() {
  limparSessao();
  window.location.replace('/auth/login');
}

function aplicarTiltCards(root = document) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.matchMedia('(pointer: coarse)').matches) return;

  const cards = root.querySelectorAll?.('.tilt-card') || [];
  cards.forEach((card) => {
    if (card.dataset.tiltBound === '1') return;
    card.dataset.tiltBound = '1';

    const strength = Number(card.dataset.tiltStrength || 5);

    const reset = () => {
      card.style.transform = '';
    };

    card.addEventListener('pointermove', (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      const rotateY = (x - .5) * strength;
      const rotateX = (0.5 - y) * strength;
      card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-3px)`;
    });

    card.addEventListener('pointerleave', reset);
    card.addEventListener('pointercancel', reset);
  });
}

function configurarInteracoes() {
  document.querySelectorAll('.primary-cta, .secondary-cta, .closing-cta').forEach((link) => {
    link.addEventListener('click', () => {
      window.setTimeout(() => window.scrollBy({ top: -80, left: 0 }), 10);
    });
  });

  aplicarTiltCards(document.querySelector('#listaRestaurantes'));

  const revealItems = document.querySelectorAll('.reveal, .reveal-group');
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.13, rootMargin: '0px 0px -40px' });
    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  }
}

async function iniciarHome() {
  const usuario = await validarSessao();
  if (!usuario) return;

  usuarioAtual = usuario;
  configurarIdentidade(usuario);
  document.getElementById('loadingScreen')?.classList.add('hidden');
  document.getElementById('appContent')?.classList.remove('hidden');
  configurarInteracoes();
  await carregarRestaurantes();

  // Quando o usuário volta do cardápio por /#catalogo, a Home só deixa de
  // estar oculta depois da validação do token; reaplica a âncora nesse ponto.
  if (window.location.hash) {
    document.querySelector(window.location.hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('formCadastro')?.addEventListener('submit', cadastrarRestaurante);
  document.getElementById('filtroCategory')?.addEventListener('change', filtrarRestaurantes);
  document.getElementById('logoutButton')?.addEventListener('click', fazerLogout);
  document.getElementById('userAvatar')?.addEventListener('click', () => document.getElementById('profileImageInput')?.click());
  document.getElementById('profileImageInput')?.addEventListener('change', (event) => enviarFotoPerfil(event.target.files?.[0]));
  iniciarHome();
});
