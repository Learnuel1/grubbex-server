const express = require('express');
const qrcodeController = require('../controllers/qrcodeController');

const router = express.Router();

/**
 * POST /qrcode/generate
 * Generate QR code
 * Body: { text: string, format?: 'dataurl' | 'buffer' }
 */
router.post('/generate', qrcodeController.generateQRCode);

/**
 * POST /qrcode/generate-with-logo
 * Generate QR code with logo
 * Body: { text: string, logoPath: string, width?: number, logoSize?: number }
 */
router.post('/generate-with-logo', qrcodeController.generateQRCodeWithLogo);

/**
 * GET /qrcode/download
 * Download QR code as file
 * Query: { text: string, filename?: string }
 */
router.get('/download', qrcodeController.downloadQRCode);

/**
 * GET /qrcode/download-with-logo
 * Download QR code with logo as file
 * Query: { text: string, logoPath: string, filename?: string, width?: number, logoSize?: number }
 */
router.get('/download-with-logo', qrcodeController.downloadQRCodeWithLogo);

module.exports = router;
