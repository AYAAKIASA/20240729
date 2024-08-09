const express = require('express');
const requireAccessToken = require('../middlewares/require-access-token.middleware');
const { prisma } = require('../utils/prisma.util');
const router = express.Router();

// 사용자 조회
router.get('/me', requireAccessToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    const { id, email, name, role, createdAt, updatedAt } = user;

    res.status(200).json({
      message: '사용자 정보 조회 성공',
      user: {
        id,
        email,
        name,
        role,
        createdAt,
        updatedAt,
      },
    });
  } catch (error) {
    console.error('사용자 조회 오류:', error);
    res.status(500).json({ message: '사용자 조회에 실패했습니다.' });
  }
});

module.exports = router;