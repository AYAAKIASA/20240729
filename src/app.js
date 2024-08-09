const express = require('express');
const dotenv = require('dotenv');
const { prisma } = require('./utils/prisma.util');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const routers = require('./routers');
app.use('/', routers);

const errorHandler = require('./middlewares/error-handler.middleware');
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});