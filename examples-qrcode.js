/**
 * QR Code Generation Examples
 * 
 * This file demonstrates how to use the QR code service with and without logos.
 * Run with: node examples-qrcode.js
 */

const qrcodeService = require('./src/services/qrcodeService');
const fs = require('fs');
const path = require('path');

// Create output directory if it doesn't exist
const outputDir = path.join(__dirname, 'qrcodes-output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

/**
 * Example 1: Basic QR Code as Data URL
 */
async function example1_BasicQRCode() {
  console.log('\n📱 Example 1: Basic QR Code as Data URL');
  console.log('─'.repeat(50));

  try {
    const qrDataUrl = await qrcodeService.generateQRCode(
      'https://grubbex.example.com',
      { width: 200 }
    );

    console.log('✅ QR Code generated successfully!');
    console.log('Data URL length:', qrDataUrl.length, 'characters');
    console.log('First 100 chars:', qrDataUrl.substring(0, 100) + '...');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

/**
 * Example 2: QR Code as Buffer (for file operations)
 */
async function example2_QRCodeAsBuffer() {
  console.log('\n📱 Example 2: QR Code as Buffer');
  console.log('─'.repeat(50));

  try {
    const buffer = await qrcodeService.generateQRCodeBuffer(
      'https://grubbex.example.com/delivery/order-123'
    );

    console.log('✅ QR Code buffer generated successfully!');
    console.log('Buffer size:', buffer.length, 'bytes');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

/**
 * Example 3: Generate and Save QR Code to File
 */
async function example3_SaveQRCodeToFile() {
  console.log('\n📱 Example 3: Save QR Code to File');
  console.log('─'.repeat(50));

  try {
    const filePath = path.join(outputDir, 'qrcode-basic.png');
    const result = await qrcodeService.generateQRCodeFile(
      'https://grubbex.example.com/restaurants/rest-001',
      filePath,
      { width: 300 }
    );

    console.log('✅ QR Code saved successfully!');
    console.log('📁 File path:', result);
    console.log('📊 File size:', fs.statSync(result).size, 'bytes');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

/**
 * Example 4: QR Code with Logo (Simulated)
 * 
 * Note: This example creates a simple PNG logo for demonstration.
 * In production, you would use your actual app logo.
 */
async function example4_QRCodeWithLogo() {
  console.log('\n📱 Example 4: QR Code with Logo');
  console.log('─'.repeat(50));

  try {
    // Create a simple test logo (1x1 transparent PNG)
    // In production, use your actual logo file
    const logoPath = path.join(outputDir, 'test-logo.png');
    
    // Simple PNG header (1x1 transparent pixel)
    const pngHeader = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
      0x0D, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0xCF, 0xC0, 0x00,
      0x00, 0x00, 0x03, 0x00, 0x01, 0x8D, 0x6F, 0xD8, 0x4D, 0x00, 0x00, 0x00,
      0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);

    fs.writeFileSync(logoPath, pngHeader);
    console.log('✅ Test logo created at:', logoPath);

    const qrWithLogo = await qrcodeService.generateQRCodeWithLogo(
      'https://grubbex.example.com/driver/driver-456',
      logoPath,
      {
        width: 300,
        logoSize: 80,
        errorCorrectionLevel: 'H'
      }
    );

    console.log('✅ QR Code with logo generated successfully!');
    console.log('Format: SVG with embedded logo');
    console.log('Data URL length:', qrWithLogo.length, 'characters');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

/**
 * Example 5: Multiple QR Codes in Batch
 */
async function example5_BatchQRCodeGeneration() {
  console.log('\n📱 Example 5: Batch QR Code Generation');
  console.log('─'.repeat(50));

  try {
    const orders = [
      'ORD-001',
      'ORD-002',
      'ORD-003'
    ];

    const results = [];

    for (const orderId of orders) {
      const filePath = path.join(outputDir, `qr-${orderId}.png`);
      const qrUrl = `https://grubbex.example.com/orders/${orderId}`;

      await qrcodeService.generateQRCodeFile(qrUrl, filePath, {
        width: 250
      });

      results.push({
        orderId,
        filePath,
        size: fs.statSync(filePath).size
      });

      console.log(`  ✅ Generated QR code for ${orderId}`);
    }

    console.log('\n📊 Batch Summary:');
    results.forEach(r => {
      console.log(`  • ${r.orderId}: ${r.size} bytes`);
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

/**
 * Example 6: QR Code with Custom Colors
 */
async function example6_CustomColorQRCode() {
  console.log('\n📱 Example 6: QR Code with Custom Colors');
  console.log('─'.repeat(50));

  try {
    const filePath = path.join(outputDir, 'qr-custom-colors.png');

    await qrcodeService.generateQRCodeFile(
      'https://grubbex.example.com/promo-2024',
      filePath,
      {
        width: 300,
        color: {
          dark: '#FF6B35',    // Orange
          light: '#F7F7F7'    // Light gray
        }
      }
    );

    console.log('✅ Custom color QR code generated!');
    console.log('📁 File path:', filePath);
    console.log('🎨 Colors: Dark=#FF6B35 (Orange), Light=#F7F7F7 (Gray)');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

/**
 * Main execution
 */
async function runAllExamples() {
  console.log('\n🚀 QR Code Generation Examples');
  console.log('═'.repeat(50));
  console.log('📁 Output directory:', outputDir);

  await example1_BasicQRCode();
  await example2_QRCodeAsBuffer();
  await example3_SaveQRCodeToFile();
  await example4_QRCodeWithLogo();
  await example5_BatchQRCodeGeneration();
  await example6_CustomColorQRCode();

  console.log('\n' + '═'.repeat(50));
  console.log('✅ All examples completed!');
  console.log('📁 Check the "qrcodes-output" directory for generated files.');
  console.log('\n💡 Tips:');
  console.log('   • Use the qrcodeService in your controllers/routes');
  console.log('   • For production, replace test logo with your actual logo');
  console.log('   • Use error correction level "H" when adding logos');
  console.log('   • Keep logo size at 20-30% of QR code size');
  console.log('═'.repeat(50) + '\n');
}

// Run examples
runAllExamples().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
