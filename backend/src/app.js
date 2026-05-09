const express = require('express');
const cors = require('cors');

const { formatIssues, isZodError } = require('./middleware/validateRequest');
const { sendError, sendSuccess } = require('./utils/apiResponse');
const photoUploadRoutes = require('./routes/photoUploadRoutes');
const mockRoutes = require('./routes/mockRoutes');

const app = express();

app.use(cors());
app.use(express.json({ limit: '12mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} ${ms}ms - ${req.ip}`);
  });
  next();
});

app.get('/', (_req, res) => {
  sendSuccess(
    res,
    {
      service: 'potongin-ai-backend',
      version: 'v1',
      docsPath: '/health',
    },
    'Potongin AI backend is running.'
  );
});

app.use(photoUploadRoutes);
app.use(mockRoutes);

app.use((_req, res) => {
  sendError(res, 404, 'NOT_FOUND', 'Requested route was not found.');
});

app.use((err, _req, res, _next) => {
  console.error(err);

  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'Request body must be valid JSON.');
  }

  if (isZodError(err)) {
    return sendError(res, 400, 'VALIDATION_ERROR', formatIssues(err.issues));
  }

  sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Something went wrong on the server.');
});

module.exports = app;
