const express = require('express');
const multer = require('multer');
const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');
const cors = require('cors');
const app = express();
const router = express.Router();
const upload = multer({ dest: 'uploads/' });

const OCR_SPACE_API_KEY = 'K83657809388957';

router.use(cors({
  origin: 'http://localhost:3000', 
}));

router.post('/api/uploadReceipt', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const formData = new FormData();
    formData.append('apikey', OCR_SPACE_API_KEY);
    formData.append('language', 'eng');
    formData.append('isTable', 'true');
    formData.append('file', fs.createReadStream(req.file.path));

    const response = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    // Clean up the uploaded file after processing
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('Failed to delete temp file:', err);
    });

    if (data.IsErroredOnProcessing) {
      return res.status(500).json({ error: data.ErrorMessage || 'OCR processing error' });
    }

    const parsedText = data.ParsedResults?.[0]?.ParsedText || '';

    return res.json({ text: parsedText });
  } catch (error) {
    console.error('Error in /api/upload-receipt:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

app.use('/', router);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`PocketAudit backend listening on port ${PORT}`);
});
