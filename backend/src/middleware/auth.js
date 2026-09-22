const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
    // Antes líamos req.headers.authorization; agora o cookie-parser
  // já nos dá isto pronto em req.cookies
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: "Token de autenticação não fornecido" });
  }

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