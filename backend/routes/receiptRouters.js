const express = require ('express')
const router = express.Router();


//Get all receipts for the authenticated user 
router.get('/',(req, res) =>{
    res.send('Hello User')
});

module.exports = router;