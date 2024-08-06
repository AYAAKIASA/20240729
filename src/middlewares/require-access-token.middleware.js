const jwt = require('jsonwebtoken');
const { prisma } = require('../utils/prisma.util');
const { UnauthorizedError } = require('./errors');

const requireAccessToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next(new UnauthorizedError('인증 정보가 없습니다.'));
  }

  const tokenParts = authHeader.split(' ');

  if (tokenParts[0] !== 'Bearer' || tokenParts.length !== 2) {
    return next(new UnauthorizedError('지원하지 않는 인증 방식입니다.'));
  }

  const token = tokenParts[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log('Decoded Token:', decoded);

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

    if (!user) {
      return next(new UnauthorizedError('인증 정보와 일치하는 사용자가 없습니다.'));
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Token verification error:', err);
    if (err.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('인증 정보가 만료되었습니다.'));
    }
    return next(new UnauthorizedError('인증 정보가 유효하지 않습니다.'));
  }
};

module.exports = requireAccessToken;