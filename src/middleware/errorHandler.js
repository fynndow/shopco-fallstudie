function errorHandler(err, _req, res, _next) {
  const status = err.statusCode || 500;
  const body = { error: err.code || 'INTERNAL_ERROR' };
  if (err.message && err.code) body.message = err.message;
  if (status >= 500 && process.env.DEBUG_ERRORS === '1') {
    console.error('[errorHandler]', err);
  }
  res.status(status).json(body);
}

class AppError extends Error {
  constructor(code, message, statusCode = 400) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
  }
}

module.exports = { errorHandler, AppError };
