const jwt = require('jsonwebtoken');
const { prisma } = require('../utils/prisma.util');
const { UnauthorizedError } = require('./errors');

const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

const requireRefreshToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('지원하지 않는 인증 방식입니다.'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, JWT_REFRESH_SECRET);
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });

    if (!user) {
      return next(new UnauthorizedError('인증 정보와 일치하는 사용자가 없습니다.'));
    }

    const refreshToken = await prisma.refreshToken.findUnique({ where: { userId: user.id } });

    if (!refreshToken || refreshToken.token !== token) {
      return next(new UnauthorizedError('폐기 된 인증 정보입니다.'));
    }

    if (refreshToken.expiresAt < new Date()) {
      return next(new UnauthorizedError('인증 정보가 만료되었습니다.'));
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Refresh token verification error:', error);
    return next(new UnauthorizedError('인증 정보가 유효하지 않습니다.'));
  }
};

module.exports = requireRefreshToken;