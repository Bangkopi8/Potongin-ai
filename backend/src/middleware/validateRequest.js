const { ZodError } = require('zod');

const { sendError } = require('../utils/apiResponse');

function formatIssues(issues) {
  return issues
    .map((issue) => {
      const path = issue.path.length > 0 ? `${issue.path.join('.')}: ` : '';
      return `${path}${issue.message}`;
    })
    .join('; ');
}

function validateRequest(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return sendError(
        res,
        400,
        'VALIDATION_ERROR',
        formatIssues(result.error.issues)
      );
    }

    req.validatedBody = result.data;
    return next();
  };
}

function isZodError(error) {
  return error instanceof ZodError;
}

module.exports = {
  formatIssues,
  isZodError,
  validateRequest,
};
