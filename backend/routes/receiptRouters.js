const express = require('express');
const router = express.Router();
const { processReceipt } = require('../ocrProcessor');

router.post('/process', async (req, res) => {
  try {
    if (!req.files?.receipt) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const receipt = req.files.receipt;
    const result = await processReceipt(receipt.data);
    
    res.json({
      merchant: result.merchant,
      address: result.address,
      invoiceNo: result.invoiceNo,
      date: result.date,
      cashier: result.cashier,
      items: result.items,
      subtotal: result.subtotal,
      total: result.total,
      paymentMethod: result.paymentMethod
    });

  } catch (error) {
    console.error('Processing error:', error);
    res.status(500).json({ error: 'Receipt processing failed' });
  }
});

module.exports = router;