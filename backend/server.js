const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const upload = multer({ dest: 'uploads/' });

const OCR_SPACE_API_KEY = 'K83657809388957'; 

app.use(cors({ origin: 'http://localhost:3000' }));

app.post('/api/uploadReceipt', upload.single('file'), async (req, res) => {
  try {
     console.log('--- New Upload Request ---');
    console.log('Received file:', req.file);
    if (!req.file) {
        console.log('❌ No file received');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = path.resolve(req.file.path);
    console.log('Resolved file path:', filePath);
    const formData = new FormData();

    formData.append('apikey', OCR_SPACE_API_KEY);
    formData.append('language', 'eng');
    formData.append('file', fs.createReadStream(filePath));

    const response = await axios.post('https://api.ocr.space/parse/image', formData, {
      headers: formData.getHeaders(),
    });

    const data = response.data;

    fs.unlink(filePath, () => {});

    if (data.IsErroredOnProcessing || !data.ParsedResults?.[0]) {
      return res.status(500).json({
        error: data.ErrorMessage?.[0] || 'OCR failed',
      });
    }

    return res.json({ text: data.ParsedResults[0].ParsedText });

  } catch (err) {
    console.error('Error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

app.listen(4000, () => {
  console.log('PocketAudit backend running on http://localhost:4000');
});
