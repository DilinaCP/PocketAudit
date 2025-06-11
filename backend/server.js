const express = require ('express')
const cors = require ('cors')
const receiptRouters = require ('./routes/receiptRouters')

const app = express();
const PORT = process.env.PORT||3000;

app.listen(PORT,() =>{
  console.log(`Server running on port ${PORT}`);
});

app.use(cors())

app.use('/api/receipt', receiptRouters);

app.use((req,res) => {
  res.status(404).json({message: "Router not found"});
});
