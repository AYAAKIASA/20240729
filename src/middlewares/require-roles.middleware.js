const { ForbiddenError, UnauthorizedError } = require('./errors');

const requireRoles = (roles) => (req, res, next) => {
  const { user } = req;

  console.log('User in Role Middleware:', user);
  console.log('Required Roles:', roles);

  if (!user) {
    console.error('User object is missing or undefined');
    return next(new UnauthorizedError('인증 정보가 없습니다.'));
  }

  if (!user.role) {
    console.error('User role is missing or undefined');
    return next(new UnauthorizedError('사용자 역할 정보가 없습니다.'));
  }

  if (roles.includes(user.role)) {
    return next();
  }

  console.error('User role is not authorized:', user.role);
  return next(new ForbiddenError('접근 권한이 없습니다.'));
};

module.exports = requireRoles;