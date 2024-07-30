const requireRoles = (roles) => (req, res, next) => {
    const { user } = req;
  
    console.log('User in Role Middleware:', user); 
  
    if (!user) {
      return res.status(401).json({ message: '인증 정보가 없습니다.' });
    }
  
    if (roles.includes(user.role)) {
      return next();
    }
  
    return res.status(403).json({ message: '접근 권한이 없습니다.' });
  };
  
  module.exports = requireRoles;  