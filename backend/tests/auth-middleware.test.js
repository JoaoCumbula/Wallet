const request = require("supertest");
const app = require("../src/index");

describe("Middleware de autenticação", () => {
  it("deve rejeitar acesso sem token", async () => {
    const res = await request(app).get("/api/accounts/me");
    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe("Token de autenticação não fornecido");
  });

  it("deve rejeitar token inválido", async () => {
    const res = await request(app)
      .get("/api/accounts/me")
      .set("Authorization", "Bearer token-invalido-qualquer");

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe("Token de autenticação inválido");
  });
});