const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

/**
 * QR Code Service with Logo Support
 * 
 * This service generates QR codes with an optional logo/image in the center.
 * The logo is composited onto the QR code image.
 */

/**
 * Generate a QR code as a data URL
 * @param {string} text - The text/URL to encode
 * @param {Object} options - QR code generation options
 * @returns {Promise<string>} - Data URL of the QR code
 */
const generateQRCode = async (text, options = {}) => {
  const defaultOptions = {
    width: options.width || 200,
    margin: options.margin || 2,
    color: options.color || {
      dark: '#000000',
      light: '#FFFFFF'
    },
    errorCorrectionLevel: options.errorCorrectionLevel || 'H' // High error correction for logo overlay
  };

  try {
    const qrDataUrl = await QRCode.toDataURL(text, defaultOptions);
    return qrDataUrl;
  } catch (error) {
    throw new Error(`Failed to generate QR code: ${error.message}`);
  }
};

/**
 * Generate QR code and save to file
 * @param {string} text - The text/URL to encode
 * @param {string} filePath - Where to save the QR code
 * @param {Object} options - QR code generation options
 * @returns {Promise<void>}
 */
const generateQRCodeFile = async (text, filePath, options = {}) => {
  const defaultOptions = {
    width: options.width || 200,
    margin: options.margin || 2,
    color: options.color || {
      dark: '#000000',
      light: '#FFFFFF'
    },
    errorCorrectionLevel: options.errorCorrectionLevel || 'H'
  };

  try {
    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    await QRCode.toFile(filePath, text, defaultOptions);
    return filePath;
  } catch (error) {
    throw new Error(`Failed to generate QR code file: ${error.message}`);
  }
};

/**
 * Generate QR code as buffer
 * @param {string} text - The text/URL to encode
 * @param {Object} options - QR code generation options
 * @returns {Promise<Buffer>} - Buffer of the QR code PNG
 */
const generateQRCodeBuffer = async (text, options = {}) => {
  const defaultOptions = {
    width: options.width || 200,
    margin: options.margin || 2,
    color: options.color || {
      dark: '#000000',
      light: '#FFFFFF'
    },
    errorCorrectionLevel: options.errorCorrectionLevel || 'H'
  };

  try {
    const buffer = await QRCode.toBuffer(text, defaultOptions);
    return buffer;
  } catch (error) {
    throw new Error(`Failed to generate QR code buffer: ${error.message}`);
  }
};

/**
 * Generate QR code with logo using HTML Canvas approach (for Node.js environments)
 * This method requires canvas library or uses a data URL overlay approach
 * 
 * @param {string} text - The text/URL to encode
 * @param {string} logoPath - Path to the logo image file
 * @param {Object} options - Configuration options
 * @returns {Promise<string>} - Data URL of QR code with logo
 */
const generateQRCodeWithLogo = async (text, logoPath, options = {}) => {
  const {
    width = 300,
    logoSize = 80,
    margin = 2,
    errorCorrectionLevel = 'H'
  } = options;

  try {
    // Check if logo file exists
    if (!fs.existsSync(logoPath)) {
      throw new Error(`Logo file not found: ${logoPath}`);
    }

    // Generate QR code with high error correction
    const qrDataUrl = await QRCode.toDataURL(text, {
      width,
      margin,
      errorCorrectionLevel,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // Read logo and convert to base64
    const logoBuffer = fs.readFileSync(logoPath);
    const logoBase64 = logoBuffer.toString('base64');
    const logoMime = getImageMimeType(logoPath);

    // Create SVG that combines QR and logo
    const svg = `
      <svg width="${width}" height="${width}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
        <image x="0" y="0" width="${width}" height="${width}" xlink:href="${qrDataUrl}"/>
        <rect x="${(width - logoSize) / 2 - 4}" y="${(width - logoSize) / 2 - 4}" width="${logoSize + 8}" height="${logoSize + 8}" fill="white" rx="4"/>
        <image x="${(width - logoSize) / 2}" y="${(width - logoSize) / 2}" width="${logoSize}" height="${logoSize}" xlink:href="data:${logoMime};base64,${logoBase64}" clip-path="url(#roundClip)"/>
        <defs>
          <clipPath id="roundClip">
            <rect x="${(width - logoSize) / 2}" y="${(width - logoSize) / 2}" width="${logoSize}" height="${logoSize}" rx="8"/>
          </clipPath>
        </defs>
      </svg>
    `;

    const svgBase64 = Buffer.from(svg).toString('base64');
    return `data:image/svg+xml;base64,${svgBase64}`;
  } catch (error) {
   return {error:error.message};
  }
};

/**
 * Generate QR code with logo and save to file
 * @param {string} text - The text/URL to encode
 * @param {string} logoPath - Path to the logo image file
 * @param {string} outputPath - Where to save the output image
 * @param {Object} options - Configuration options
 * @returns {Promise<string>} - Path to saved file
 */
const generateQRCodeWithLogoFile = async (text, logoPath, outputPath, options = {}) => {
  try {
    // For file output with logo, we'll generate and save as PNG
    // This requires converting the SVG data URL to a file
    const qrWithLogoUrl = await generateQRCodeWithLogo(text, logoPath, options);
    
    // For production use, you might want to use a library like 'sharp' or 'canvas'
    // For now, save the SVG data URL content
    const svgData = qrWithLogoUrl.replace(/^data:image\/svg\+xml;base64,/, '');
    const svgBuffer = Buffer.from(svgData, 'base64');
    
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, svgBuffer);
    return outputPath;
  } catch (error) {
    throw new Error(`Failed to save QR code with logo: ${error.message}`);
  }
};

/**
 * Helper function to determine MIME type from file extension
 * @param {string} filePath - Path to the image file
 * @returns {string} - MIME type
 */
const getImageMimeType = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp'
  };
  return mimeTypes[ext] || 'image/png';
};

module.exports = {
  generateQRCode,
  generateQRCodeFile,
  generateQRCodeBuffer,
  generateQRCodeWithLogo,
  generateQRCodeWithLogoFile
};
