const express = require('express');
const qrcodeController = require('../controllers/qrcode.controller');

const QRRouter = express.Router();

/**
 * POST /qrcode/generate
 * Generate QR code
 * Body: { text: string, format?: 'dataurl' | 'buffer' }
 */
QRRouter.post('/generate', qrcodeController.generateQRCode);

/**
 * POST /qrcode/generate-with-logo
 * Generate QR code with logo
 * Body: { text: string, logoPath: string, width?: number, logoSize?: number }
 */
QRRouter.post('/generate-with-logo', qrcodeController.generateQRCodeWithLogo);

/**
 * GET /qrcode/download
 * Download QR code as file
 * Query: { text: string, filename?: string }
 */
QRRouter.get('/download', qrcodeController.downloadQRCode);

/**
 * GET /qrcode/download-with-logo
 * Download QR code with logo as file
 * Query: { text: string, logoPath: string, filename?: string, width?: number, logoSize?: number }
 */
QRRouter.get('/download-with-logo', qrcodeController.downloadQRCodeWithLogo);

module.exports = {QRRouter};
