const express = require('express');
const authRouter = require('./auth.router');
const resumesRouter = require('./resumes.router');
const usersRouter = require('./users.router');

const router = express.Router();

router.use('/auth', authRouter);
router.use('/resumes', resumesRouter);
router.use('/users', usersRouter);

module.exports = router;