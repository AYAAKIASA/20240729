const {
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  InternalServerError,
} = require('./errors');

const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  if (err instanceof ValidationError) {
    return res.status(err.statusCode).json({ status: err.statusCode, message: err.message });
  }

  if (err instanceof UnauthorizedError) {
    return res.status(err.statusCode).json({ status: err.statusCode, message: err.message });
  }

  if (err instanceof ForbiddenError) {
    return res.status(err.statusCode).json({ status: err.statusCode, message: err.message });
  }

  if (err instanceof NotFoundError) {
    return res.status(err.statusCode).json({ status: err.statusCode, message: err.message });
  }

  if (err instanceof InternalServerError) {
    return res.status(err.statusCode).json({ status: err.statusCode, message: err.message });
  }

  return res.status(500).json({
    status: 500,
    message: '예상치 못한 에러가 발생했습니다. 관리자에게 문의해 주세요.',
  });
};

module.exports = errorHandler;