const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure log directory exists
const LOG_DIR = path.join(__dirname, 'log');
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Middleware to parse JSON bodies
app.use(express.json());

/**
 * Helper: write a log entry to the log file.
 * @param {string} level - "info", "warn", or "error"
 * @param {string} message - the log message
 */
function writeLog(level, message) {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
  const logFile = path.join(LOG_DIR, 'app.log');
  fs.appendFileSync(logFile, logLine, 'utf8');
}

// GET /api/health
app.get('/api/health', (_req, res) => {
  writeLog('info', 'Health check performed');
  res.json({ status: 'ok', uptime: process.uptime() });
});

// GET /api/message?type=info&msg=Hello
app.get('/api/message', (req, res) => {
  const type = req.query.type;
  const msg = req.query.msg;

  if (!msg || !type) {
    writeLog('warn', 'Message endpoint called with missing query params');
    return res.status(400).json({ error: 'Both "type" and "msg" query parameters are required' });
  }

  const allowedTypes = ['info', 'warn', 'error'];
  if (!allowedTypes.includes(type)) {
    writeLog('warn', `Invalid log type received: "${type}"`);
    return res.status(400).json({ error: `Type must be one of: ${allowedTypes.join(', ')}` });
  }

  writeLog(type, msg);
  res.json({ received: true, level: type, message: msg });
});

// Start server (only if run directly, not when imported for tests)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    writeLog('info', `Server started on port ${PORT}`);
  });
}

module.exports = app;
