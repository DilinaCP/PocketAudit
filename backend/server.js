const express = require('express');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(fileUpload());

// Routes
app.post('/api/receipts', async (req, res) => {
  try {
    if (!req.files?.receipt) {
      return res.status(400).send('No file uploaded');
    }

    // Mock processing - replace with actual OCR in production
    const mockResult = {
      merchant: "Demo Merchant",
      invoiceNo: "INV-" + Math.random().toString(36).substring(2, 8),
      date: new Date().toLocaleString(),
      items: [
        { description: "Sample Item 1", qty: 1, price: 10.50, amount: 10.50 },
        { description: "Sample Item 2", qty: 2, price: 5.25, amount: 10.50 }
      ],
      total: 21.00
    };

    res.json(mockResult);

  } catch (error) {
    console.error(error);
    res.status(500).send('Processing failed');
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});