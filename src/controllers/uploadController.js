const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const sharp = require('sharp');
const crypto = require('crypto');
const path = require('path');

// Initialize S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const bucketName = process.env.S3_BUCKET_NAME;
    if (!bucketName) {
      return res.status(500).json({ error: 'S3_BUCKET_NAME is not configured' });
    }

    // Bonus: Image resizing (compress / optimize to max 1024px width)
    const processedBuffer = await sharp(req.file.buffer)
      .resize({ width: 1024, withoutEnlargement: true })
      .jpeg({ quality: 80 }) // Convert/optimize output
      .toBuffer();

    const fileExtension = path.extname(req.file.originalname) || '.jpg';
    const fileName = `${Date.now()}-${crypto.randomUUID()}${fileExtension}`;

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      Body: processedBuffer,
      ContentType: req.file.mimetype,
    });

    await s3Client.send(command);

    // Standard URL format requested
    const fileUrl = `https://${bucketName}.s3.amazonaws.com/${fileName}`;

    // Bonus: Generate signed S3 URL (Valid for 1 hour)
    const getCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: fileName,
    });
    const signedUrl = await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 });

    res.status(200).json({
      url: fileUrl,
      signedUrl: signedUrl,
      serverPort: process.env.PORT || 3000 // Return the server port to verify load balancing
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadImage
};
