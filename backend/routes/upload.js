const express = require('express');
const multer = require('multer');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { analyzeFile } = require('../controllers/uploadController');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});

function handleUpload(req, res, next) {
  upload.single('file')(req, res, (err) => {
    if (err) {
      const message =
        err.code === 'LIMIT_FILE_SIZE' ? 'The file is too large (maximum 5 MB)' : 'Could not read the uploaded file';
      return res.status(400).json({ message });
    }
    next();
  });
}

// POST /api/upload   multipart form: file, paymentType, saveFlagged
router.post('/', auth, handleUpload, analyzeFile);

module.exports = router;