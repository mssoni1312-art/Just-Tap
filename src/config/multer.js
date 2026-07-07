const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const maxSizeMb = Number(process.env.UPLOAD_MAX_FILE_SIZE_MB) || 5;
const maxSizeBytes = maxSizeMb * 1024 * 1024;

const imageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(process.cwd(), 'uploads', 'images'));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

const documentStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(process.cwd(), 'uploads', 'documents'));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

const imageFilter = (_req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, WebP, and GIF images are allowed'), false);
  }
};

const documentFilter = (_req, file, cb) => {
  const allowed = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
  ];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid document type'), false);
  }
};

const uploadImage = multer({
  storage: imageStorage,
  limits: { fileSize: maxSizeBytes },
  fileFilter: imageFilter,
});

const uploadDocument = multer({
  storage: documentStorage,
  limits: { fileSize: maxSizeBytes * 2 },
  fileFilter: documentFilter,
});

const uploadImport = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxSizeBytes * 2 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['text/csv', 'application/vnd.ms-excel', 'text/plain', 'application/json'];
    if (allowed.includes(file.mimetype) || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV or JSON import files are allowed'), false);
    }
  },
});

const allTaskAttachmentMaxSizeMb = 20;
const allTaskAttachmentFilter = (_req, file, cb) => {
  const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, JPG, and PNG files are allowed'), false);
  }
};

const uploadAllTaskAttachment = multer({
  storage: documentStorage,
  limits: { fileSize: allTaskAttachmentMaxSizeMb * 1024 * 1024 },
  fileFilter: allTaskAttachmentFilter,
});

module.exports = {
  uploadImage,
  uploadDocument,
  uploadImport,
  uploadAllTaskAttachment,
  maxSizeMb,
  allTaskAttachmentMaxSizeMb,
};
