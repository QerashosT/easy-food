import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const uploadsRoot = path.resolve(currentDir, '../../../public/uploads');
const SUPPORTED_FORMATS = new Set(['jpeg', 'jpg', 'png', 'webp']);
const MAX_IMAGE_PIXELS = 40_000_000;

export class ImageServiceError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'ImageServiceError';
    this.status = status;
  }
}

function folderPath(folder) {
  if (folder !== 'profiles' && folder !== 'dishes') {
    throw new ImageServiceError(500, 'Destino de imagem não permitido.');
  }
  return path.join(uploadsRoot, folder);
}

/**
 * Normaliza imagens JPEG/PNG/WebP para WebP, aplica orientação EXIF,
 * redimensiona e armazena em public/uploads/{profiles|dishes}.
 * Os módulos de usuário e pratos reutilizam exatamente este serviço.
 */
export async function processAndStoreImage(file, {
  folder,
  width = 1200,
  height = 900,
  fit = 'inside'
} = {}) {
  if (!file?.buffer || !Buffer.isBuffer(file.buffer) || file.buffer.length === 0) {
    throw new ImageServiceError(400, 'Envie uma imagem no campo "image".');
  }

  if (file.buffer.length > 5 * 1024 * 1024) {
    throw new ImageServiceError(413, 'A imagem excede o limite de 5 MB.');
  }

  let metadata;
  let outputBuffer;
  try {
    const image = sharp(file.buffer, {
      failOn: 'error',
      limitInputPixels: MAX_IMAGE_PIXELS
    });
    metadata = await image.metadata();
    if (!SUPPORTED_FORMATS.has(metadata.format)) {
      throw new ImageServiceError(400, 'Formato de imagem inválido. Envie JPEG, PNG ou WebP.');
    }
    outputBuffer = await sharp(file.buffer, {
      failOn: 'error',
      limitInputPixels: MAX_IMAGE_PIXELS
    })
      .rotate()
      .resize(width, height, { fit, withoutEnlargement: true })
      .webp({ quality: 82, effort: 4 })
      .toBuffer();
  } catch (error) {
    if (error instanceof ImageServiceError) throw error;
    throw new ImageServiceError(400, 'O arquivo enviado não é uma imagem válida ou excede as dimensões permitidas.');
  }

  const directory = folderPath(folder);
  await fs.mkdir(directory, { recursive: true });

  const filename = `${randomUUID()}.webp`;
  const absolutePath = path.join(directory, filename);
  await fs.writeFile(absolutePath, outputBuffer, { flag: 'wx' });

  return {
    imageUrl: `/uploads/${folder}/${filename}`,
    absolutePath,
    format: 'webp',
    size: outputBuffer.length,
    width: metadata.width ?? null,
    height: metadata.height ?? null
  };
}

/** Remove somente arquivos criados dentro dos diretórios de upload da aplicação. */
export async function removeStoredImage(imageUrl) {
  if (typeof imageUrl !== 'string' || !imageUrl.startsWith('/uploads/')) return false;

  const relativePath = imageUrl.slice('/uploads/'.length);
  const absolutePath = path.resolve(uploadsRoot, relativePath);
  const relative = path.relative(uploadsRoot, absolutePath);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) return false;
  if (!relative.startsWith(`profiles${path.sep}`) && !relative.startsWith(`dishes${path.sep}`)) return false;

  try {
    await fs.unlink(absolutePath);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}
