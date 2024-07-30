const errorHandler = (err, req, res, next) => {
    console.error(err);
  
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        status: 400,
        message: err.message,
      });
    }
  
    return res.status(500).json({
      status: 500,
      message: '예상치 못한 에러가 발생했습니다. 관리자에게 문의해 주세요.',
    });
  };
  
  module.exports = errorHandler;  