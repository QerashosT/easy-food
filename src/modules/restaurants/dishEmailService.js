const RESEND_ENDPOINT = 'https://api.resend.com/emails';

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

/** Envia uma notificação transacional ao proprietário pelo serviço Resend. */
export async function sendDishCreatedEmail({ owner, restaurant, dish }) {
  const apiKey = process.env.RESEND_API_KEY;
  const sender = process.env.EMAIL_FROM;

  if (!apiKey || !sender) {
    return { sent: false, status: 'not_configured' };
  }

  if (!owner?.email) {
    return { sent: false, status: 'recipient_missing' };
  }

  const description = dish.description || 'Sem descrição informada.';
  const price = dish.price == null
    ? 'Não informado'
    : Number(dish.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const baseUrl = (process.env.APP_BASE_URL || '').replace(/\/$/, '');
  const photoUrl = dish.imageUrl && baseUrl ? `${baseUrl}${dish.imageUrl}` : null;
  const htmlPhoto = photoUrl
    ? `<p><img src="${escapeHtml(photoUrl)}" alt="${escapeHtml(dish.name)}" style="max-width:100%;height:auto;border-radius:12px"></p>`
    : '';

  const payload = {
    from: sender,
    to: [owner.email],
    subject: `Novo prato cadastrado: ${dish.name}`,
    text: [
      `Olá, ${owner.name || 'proprietário'}!`,
      `Um novo prato foi cadastrado no restaurante ${restaurant.name}.`,
      `Prato: ${dish.name}`,
      `Descrição: ${description}`,
      `Preço: ${price}`,
      photoUrl ? `Foto: ${photoUrl}` : ''
    ].filter(Boolean).join('\n'),
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#25211f;line-height:1.6">
        <h2 style="color:#e65332">Um novo prato foi cadastrado</h2>
        <p>Olá, ${escapeHtml(owner.name || 'proprietário')}!</p>
        <p>O restaurante <strong>${escapeHtml(restaurant.name)}</strong> recebeu um novo prato no EasyFood.</p>
        ${htmlPhoto}
        <h3>${escapeHtml(dish.name)}</h3>
        <p>${escapeHtml(description)}</p>
        <p><strong>Preço:</strong> ${escapeHtml(price)}</p>
      </div>
    `
  };

  const response = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': 'EasyFood/1.0',
      'Idempotency-Key': `dish-created-${dish.id}`
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10_000)
  });

  const responseBody = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = responseBody.message || responseBody.error || `HTTP ${response.status}`;
    throw new Error(`Falha ao enviar e-mail: ${message}`);
  }

  return { sent: true, id: responseBody.id || null };
}
