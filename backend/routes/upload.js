const express = require('express');
const fileUpload = require('express-fileupload');
const { PythonShell } = require('python-shell');

const router = express.Router();
router.use(fileUpload());

router.post('/process', (req, res) => {
  if (!req.files?.receipt) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const receipt = req.files.receipt;
  receipt.mv(`./uploads/${receipt.name}`, (err) => {
    if (err) return res.status(500).send(err);

    const options = {
      mode: 'text',
      pythonPath: 'python3',
      args: [`./uploads/${receipt.name}`]
    };

    PythonShell.run('../ml-service/process_receipt.py', options, (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(JSON.parse(results[0]));
    });
  });
});