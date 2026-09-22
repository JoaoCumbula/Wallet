const request = require('supertest');
const app = require('../src/index'); // Importa a app Express

describe('GET /api/health', () => {
    // "it" (ou "test") define um caso de teste individual
  it('should return status ok', async () => {
    const res = await request(app).get('/api/health');
    // "expect" faz a verificação (assertion) — se falhar, o teste falha
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('status', 'ok');
  });
});