const express = require('express');
const requireAccessToken = require('../middlewares/require-access-token.middleware');
const router = express.Router();

router.get('/me', requireAccessToken, (req, res) => {
  const { id, email, name, role, createdAt, updatedAt } = req.user;

  res.status(200).json({
    id,
    email,
    name,
    role,
    createdAt,
    updatedAt,
  });
});

module.exports = router;