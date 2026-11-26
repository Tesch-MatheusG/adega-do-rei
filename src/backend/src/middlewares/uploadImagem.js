const multer = require('multer');

const LIMITE_BYTES = 2 * 1024 * 1024; // 2 MB (o frontend já reduz a foto antes de enviar)

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: LIMITE_BYTES, files: 1 } });

// Recebe 1 arquivo no campo "imagem" (multipart/form-data) e traduz os erros do multer para JSON
function uploadImagem(req, res, next) {
  upload.single('imagem')(req, res, (err) => {
    if (!err) return next();
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ erro: 'Imagem muito grande. O tamanho máximo é 2 MB.' });
    }
    return res.status(400).json({ erro: 'Não foi possível ler a imagem enviada. Envie 1 arquivo no campo "imagem".' });
  });
}

module.exports = { uploadImagem, LIMITE_BYTES };
