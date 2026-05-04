const express = require('express');
const multer = require('multer');
const { uploadImage } = require('../controllers/uploadController');

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow JPG and PNG images
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
      cb(null, true);
    } else {
      cb(new Error('Only JPG and PNG images are allowed'), false);
    }
  }
});

// Single image upload route
router.post('/', upload.single('image'), uploadImage);

module.exports = router;
