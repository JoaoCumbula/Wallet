const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
    // O token vem no cabeçalho, no formato: "Authorization: Bearer eyJ..."
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token de autenticação não fornecido" });
  }

  const token = authHeader.split(" ")[1]; // Espera-se o formato "Bearer <token>"

  try {
     // jwt.verify confirma a assinatura com o mesmo JWT_SECRET
    // usado para criar o token. Se alguém alterar o payload
    // sem ter o secret, a verificação falha aqui.
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    req.userId = payload.userId; // Adiciona os dados do utilizador ao pedido
    return next(); // Continua para a próxima função de middleware ou rota
  } catch (err) {
    return res.status(401).json({ error: "Token de autenticação inválido" });
  }
}

module.exports = authMiddleware;