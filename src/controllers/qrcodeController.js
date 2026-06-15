const qrcodeService = require('../services/qrcodeService');
const path = require('path');

/**
 * Generate QR code endpoint
 */
const generateQRCode = async (req, res) => {
  try {
    const { text, format = 'dataurl' } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Text is required'
      });
    }

    let result;

    if (format === 'buffer') {
      result = await qrcodeService.generateQRCodeBuffer(text);
      res.setHeader('Content-Type', 'image/png');
      res.send(result);
    } else {
      // Default: data URL format
      result = await qrcodeService.generateQRCode(text);
      res.json({
        success: true,
        qrCode: result,
        format: 'dataurl'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Generate QR code with logo
 */
const generateQRCodeWithLogo = async (req, res) => {
  try {
    const { text, logoPath, width = 300, logoSize = 80 } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Text is required'
      });
    }

    if (!logoPath) {
      return res.status(400).json({
        success: false,
        message: 'Logo path is required'
      });
    }

    const result = await qrcodeService.generateQRCodeWithLogo(text, logoPath, {
      width,
      logoSize,
      errorCorrectionLevel: 'H'
    });

    res.json({
      success: true,
      qrCode: result,
      format: 'dataurl-with-logo'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Generate QR code and download as file
 */
const downloadQRCode = async (req, res) => {
  try {
    const { text, filename = 'qrcode.png' } = req.query;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Text query parameter is required'
      });
    }

    const buffer = await qrcodeService.generateQRCodeBuffer(text);

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Generate QR code with logo and download
 */
const downloadQRCodeWithLogo = async (req, res) => {
  try {
    const { text, logoPath, filename = 'qrcode-with-logo.svg', width = 300, logoSize = 80 } = req.query;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Text query parameter is required'
      });
    }

    if (!logoPath) {
      return res.status(400).json({
        success: false,
        message: 'Logo path query parameter is required'
      });
    }

    const result = await qrcodeService.generateQRCodeWithLogo(text, logoPath, {
      width: parseInt(width),
      logoSize: parseInt(logoSize),
      errorCorrectionLevel: 'H'
    });

    // Convert data URL to buffer for download
    const base64Data = result.replace(/^data:image\/svg\+xml;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  generateQRCode,
  generateQRCodeWithLogo,
  downloadQRCode,
  downloadQRCodeWithLogo
};
