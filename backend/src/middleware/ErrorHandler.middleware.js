/**
 * Centralized error handling middleware.
 * Ensures consistent JSON error formatting and suppresses stack traces in production.
 */
export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  const errors = err.errors || [];

  const response = {
    success: false,
    statusCode,
    message,
    error: {
      code: err.code || (statusCode === 404 ? "NOT_FOUND" : statusCode === 401 ? "UNAUTHORIZED" : "SERVER_ERROR"),
      details: errors.length > 0 ? errors : undefined,
    },
  };

  if (process.env.DEBUG_ERRORS === "true" && statusCode >= 500 && err.stack) {
    response.stack = err.stack;
  }

  return res.status(statusCode).json(response);
};

export default errorHandler;
