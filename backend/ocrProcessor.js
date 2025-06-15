// backend/ocrProcessor.js
const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

async function processReceipt(imageBuffer) {
  try {
    // Preprocess image
    const processedImage = await sharp(imageBuffer)
      .greyscale()
      .normalize()
      .sharpen()
      .toBuffer();

    // Perform OCR
    const { data: { text } } = await Tesseract.recognize(
      processedImage,
      'eng',
      { logger: m => console.log(m.status) }
    );

    return parseReceipt(text);
  } catch (error) {
    console.error('OCR Processing Error:', error);
    throw error;
  }
}

function parseReceipt(text) {
  const lines = text.split('\n').filter(line => line.trim() !== '');
  
  // Extract merchant info (first non-empty line)
  const merchant = lines[0]?.trim() || 'Unknown Merchant';
  
  // Extract address (next few lines until empty line or invoice info)
  let addressLines = [];
  for (let i = 1; i < Math.min(5, lines.length); i++) {
    if (lines[i].includes('Invoice No') || lines[i].trim() === '') break;
    addressLines.push(lines[i].trim());
  }
  const address = addressLines.join(', ');

  // Extract invoice details
  const extractDetail = (pattern) => {
    const line = lines.find(l => l.includes(pattern));
    return line?.split(':').slice(1).join(':').trim() || 'N/A';
  };

  // Extract items
  const items = [];
  let inItemsSection = false;

  for (const line of lines) {
    if (line.includes('Description') && line.includes('Qty')) {
      inItemsSection = true;
      continue;
    }

    if (inItemsSection) {
      if (line.includes('TOTAL:')) break;

      // Match item pattern: description, qty, price, amount
      const itemMatch = line.match(/(.+?)\s+(\d+)\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})/);
      if (itemMatch) {
        items.push({
          description: itemMatch[1].trim(),
          qty: parseInt(itemMatch[2]),
          price: parseFloat(itemMatch[3].replace(',', '')),
          amount: parseFloat(itemMatch[4].replace(',', ''))
        });
      }
    }
  }

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum);
  const totalLine = lines.find(line => line.includes('TOTAL:'));
  const total = totalLine ? 
    parseFloat(totalLine.replace('TOTAL:', '').trim().replace(/[^\d.]/g, '')) : 
    subtotal;

  return {
    merchant,
    address,
    invoiceNo: extractDetail('Invoice No'),
    date: extractDetail('Date'),
    cashier: extractDetail('Cashier'),
    items,
    subtotal,
    total,
    paymentMethod: lines.find(line => line.match(/VISA|CARD|CASH/i))?.trim() || 'Unknown'
  };
}

module.exports = { processReceipt };