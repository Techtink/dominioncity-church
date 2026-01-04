import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate, editorOrAdmin } from '../middleware/auth.js';

const router = Router();

// Ensure uploads directory exists
const uploadsDir = process.env.UPLOAD_DIR || 'uploads';
const subDirs = ['images', 'audio', 'video', 'documents'];

subDirs.forEach(dir => {
  const fullPath = path.join(uploadsDir, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let subDir = 'documents';

    if (file.mimetype.startsWith('image/')) {
      subDir = 'images';
    } else if (file.mimetype.startsWith('audio/')) {
      subDir = 'audio';
    } else if (file.mimetype.startsWith('video/')) {
      subDir = 'video';
    }

    cb(null, path.join(uploadsDir, subDir));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'video/mp4',
    'video/webm',
    'application/pdf',
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} not allowed`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default
  },
});

// Single file upload
router.post(
  '/single',
  authenticate,
  editorOrAdmin,
  upload.single('file'),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: { message: 'No file uploaded' } });
    }

    const fileUrl = `/${req.file.path.replace(/\\/g, '/')}`;

    res.json({
      message: 'File uploaded successfully',
      file: {
        url: fileUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
      },
    });
  }
);

// Multiple files upload
router.post(
  '/multiple',
  authenticate,
  editorOrAdmin,
  upload.array('files', 10),
  (req, res) => {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: { message: 'No files uploaded' } });
    }

    const files = req.files.map(file => ({
      url: `/${file.path.replace(/\\/g, '/')}`,
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    }));

    res.json({
      message: `${files.length} files uploaded successfully`,
      files,
    });
  }
);

// Delete file
router.delete('/:filename', authenticate, editorOrAdmin, async (req, res, next) => {
  try {
    const { type = 'images' } = req.query;
    const filePath = path.join(uploadsDir, type, req.params.filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: { message: 'File not found' } });
    }

    fs.unlinkSync(filePath);

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// List files in a directory
router.get('/list/:type', authenticate, editorOrAdmin, async (req, res, next) => {
  try {
    const { type } = req.params;
    const dirPath = path.join(uploadsDir, type);

    if (!fs.existsSync(dirPath)) {
      return res.json({ files: [] });
    }

    const files = fs.readdirSync(dirPath).map(filename => ({
      filename,
      url: `/${uploadsDir}/${type}/${filename}`,
    }));

    res.json({ files });
  } catch (error) {
    next(error);
  }
});

// Error handling for multer
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: { message: 'File too large' } });
    }
    return res.status(400).json({ error: { message: err.message } });
  }
  next(err);
});

export default router;
