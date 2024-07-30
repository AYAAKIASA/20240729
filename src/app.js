const express = require('express');
const dotenv = require('dotenv');
const { prisma } = require('./utils/prisma.util'); 
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello World!');
});

const authRouter = require('./routers/auth.router');
const userRouter = require('./routers/users.router');
const resumeRouter = require('./routers/resumes.router'); 

app.use('/auth', authRouter);
app.use('/users', userRouter);
app.use('/resumes', resumeRouter);

const errorHandler = require('./middlewares/error-handler.middleware');
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});