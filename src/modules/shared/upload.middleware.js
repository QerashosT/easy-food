import multer from 'multer';

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp'
]);

const storage = multer.memoryStorage();

function imageFileFilter(_req, file, callback) {
  if (!ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype)) {
    const error = new Error('Formato de imagem inválido. Envie JPEG, PNG ou WebP.');
    error.status = 400;
    return callback(error);
  }
  return callback(null, true);
}

const multerUpload = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: MAX_IMAGE_SIZE_BYTES,
    files: 1,
    fields: 10,
    parts: 11
  }
});

/** Recebe um único arquivo no campo multipart/form-data chamado "image". */
export function uploadImage(req, res, next) {
  multerUpload.single('image')(req, res, (error) => {
    if (!error) return next();

    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        error.status = 413;
        error.message = 'A imagem excede o limite de 5 MB.';
      } else {
        error.status = 400;
        error.message = 'Não foi possível receber a imagem. Envie somente um arquivo no campo "image".';
      }
    }

    return next(error);
  });
}
