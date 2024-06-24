const express = require('express');
const cors = require('cors');
const connectDB = require('./db');
const rootRouter = require('./routes/index');
const User = require('./models/User');

const app = express();
const PORT = 3000;

connectDB();

app.use(cors());
app.use(express.json());
app.use('/api/v1', rootRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
