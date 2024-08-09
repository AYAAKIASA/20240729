const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { prisma } = require('../utils/prisma.util');
const requireAccessToken = require('../middlewares/require-access-token.middleware');

const router = express.Router();
const saltRounds = 10;

// 회원가입
router.post('/signup', async (req, res) => {
  const { email, password, confirmPassword, name } = req.body;

  if (!email || !password || !confirmPassword || !name) {
    return res.status(400).json({ message: '모든 필드를 입력해 주세요.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: '이메일 형식이 올바르지 않습니다.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: '비밀번호는 6자리 이상이어야 합니다.' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: '입력한 두 비밀번호가 일치하지 않습니다.' });
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return res.status(400).json({ message: '이미 가입된 사용자입니다.' });
  }

  const hashedPassword = await bcrypt.hash(password, saltRounds);
  const newUser = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
    },
  });

  res.status(201).json({
    id: newUser.id,
    email: newUser.email,
    name: newUser.name,
    role: newUser.role,
    createdAt: newUser.createdAt,
    updatedAt: newUser.updatedAt,
  });
});

// 로그인
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: '모든 필드를 입력해 주세요.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: '이메일 형식이 올바르지 않습니다.' });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(400).json({ message: '인증 정보가 유효하지 않습니다.' });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(400).json({ message: '인증 정보가 유효하지 않습니다.' });
  }

  const accessToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '12h' });
  const refreshToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

  await prisma.refreshToken.upsert({
    where: { token: refreshToken },
    update: { expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    create: { token: refreshToken, userId: user.id, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
  });

  res.status(200).json({ accessToken, refreshToken });
});

// 토큰 재발급
router.post('/refresh-token', async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(400).json({ message: 'Authorization 헤더에 Bearer 토큰이 필요합니다.' });
  }

  const refreshToken = authHeader.split(' ')[1];
  if (!refreshToken) {
    return res.status(400).json({ message: 'RefreshToken이 필요합니다.' });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const storedToken = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!storedToken || storedToken.token !== refreshToken) {
      return res.status(401).json({ message: '유효하지 않은 RefreshToken입니다.' });
    }

    if (new Date() > storedToken.expiresAt) {
      return res.status(401).json({ message: 'RefreshToken이 만료되었습니다.' });
    }

    const newAccessToken = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '12h' });
    const newRefreshToken = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

    await prisma.refreshToken.update({
      where: { token: refreshToken },
      data: {
        token: newRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    res.status(200).json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (error) {
    res.status(401).json({ message: 'RefreshToken 검증 실패' });
  }
});

// 회원탈퇴
router.delete('/delete-account', requireAccessToken, async (req, res) => {
  const { user } = req;

  try {
    await prisma.resumeLog.deleteMany({
      where: { resume: { userId: user.id } },
    });

    await prisma.resume.deleteMany({
      where: { userId: user.id },
    });

    await prisma.accessToken.deleteMany({
      where: { userId: user.id },
    });

    await prisma.refreshToken.deleteMany({
      where: { userId: user.id },
    });

    await prisma.user.delete({
      where: { id: user.id },
    });

    res.status(200).json({ message: '회원탈퇴가 완료되었습니다.' });
  } catch (error) {
    console.error('회원탈퇴 오류:', error);
    res.status(500).json({ message: '회원탈퇴 중 오류가 발생했습니다.' });
  }
});

module.exports = router;