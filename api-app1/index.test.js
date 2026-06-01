const request = require('supertest');
const fs = require('fs');
const path = require('path');

// Import the app without starting the server
const app = require('./index');

const LOG_DIR = path.join(__dirname, 'log');
const LOG_FILE = path.join(LOG_DIR, 'app.log');

describe('GET /api/health', () => {
  test('returns 200 with status ok and uptime', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('uptime');
    expect(typeof res.body.uptime).toBe('number');
    expect(res.body.uptime).toBeGreaterThan(0);
  });

  test('writes an info log entry', async () => {
    const before = fs.existsSync(LOG_FILE) ? fs.readFileSync(LOG_FILE, 'utf8') : '';
    await request(app).get('/api/health');
    const after = fs.readFileSync(LOG_FILE, 'utf8');

    expect(after).not.toBe(before);
    expect(after).toContain('[INFO]');
    expect(after).toContain('Health check performed');
  });
});

describe('GET /api/message', () => {
  test('accepts and logs an info message', async () => {
    const res = await request(app)
      .get('/api/message')
      .query({ msg: 'Info message test', type: 'info' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      received: true,
      level: 'info',
      message: 'Info message test',
    });

    const logContent = fs.readFileSync(LOG_FILE, 'utf8');
    expect(logContent).toContain('[INFO]');
    expect(logContent).toContain('Info message test');
  });

  test('accepts and logs a warn message', async () => {
    const res = await request(app)
      .get('/api/message')
      .query({ msg: 'Warn message test', type: 'warn' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      received: true,
      level: 'warn',
      message: 'Warn message test',
    });

    const logContent = fs.readFileSync(LOG_FILE, 'utf8');
    expect(logContent).toContain('[WARN]');
    expect(logContent).toContain('Warn message test');
  });

  test('accepts and logs an error message', async () => {
    const res = await request(app)
      .get('/api/message')
      .query({ msg: 'Error message test', type: 'error' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      received: true,
      level: 'error',
      message: 'Error message test',
    });

    const logContent = fs.readFileSync(LOG_FILE, 'utf8');
    expect(logContent).toContain('[ERROR]');
    expect(logContent).toContain('Error message test');
  });

  test('returns 400 when msg is missing', async () => {
    const res = await request(app)
      .get('/api/message')
      .query({ type: 'info' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toContain('required');
  });

  test('returns 400 when type is missing', async () => {
    const res = await request(app)
      .get('/api/message')
      .query({ msg: 'No type' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toContain('required');
  });

  test('returns 400 when type is invalid', async () => {
    const res = await request(app)
      .get('/api/message')
      .query({ msg: 'Bad type', type: 'debug' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toContain('Type must be one of');
  });

  test('logs a warning for invalid requests', async () => {
    const before = fs.readFileSync(LOG_FILE, 'utf8');

    await request(app).get('/api/message').query({ type: 'info' });

    const after = fs.readFileSync(LOG_FILE, 'utf8');
    const newLines = after.slice(before.length);
    expect(newLines).toContain('[WARN]');
    expect(newLines).toContain('missing query params');
  });
});