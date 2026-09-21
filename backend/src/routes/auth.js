const express = require("express");
const bcrypt = require("bcryptjs");
const pool = require("../db/pool");
const jwt = require("jsonwebtoken");

const router = express.Router();

// Gera um número de conta simples, só para teres algo único e legível
function generateAccountNumber() {
  const random = Math.floor(10000000 + Math.random() * 90000000);
  return `WB${random}`;
}

router.post("/register", async (req, res) => {
  const { fullName, email, password } = req.body;

  // Validação básica: nunca confies só no frontend para validar
  if (!fullName || !email || !password) {
    return res.status(400).json({ error: "fullName, email e password são obrigatórios" });
  }

  // pool.connect() dá-nos UMA conexão dedicada do pool, para
  // podermos correr várias queries dentro da MESMA transação
  const client = await pool.connect();

  try {
    // BEGIN inicia a transação: as queries seguintes só ficam
    // permanentes se chegarmos ao COMMIT. Se algo falhar a meio,
    // fazemos ROLLBACK e é como se nada tivesse acontecido.
    await client.query("BEGIN");

    // Confirma que o email ainda não existe
    const existing = await client.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "Email já registado" });
    }

    // Gera o hash da password (o "10" é o custo computacional —
    // quanto maior, mais lento e mais seguro contra ataques de força bruta)
    const passwordHash = await bcrypt.hash(password, 10);

    // Insere o utilizador e já pede de volta os dados criados (RETURNING)
    const userResult = await client.query(
      "INSERT INTO users (full_name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, full_name, email",
      [fullName, email, passwordHash]
    );
    const user = userResult.rows[0];

    // Cria a conta associada a este utilizador, saldo inicial 0
    const accountNumber = generateAccountNumber();
    await client.query(
      "INSERT INTO accounts (user_id, account_number, balance) VALUES ($1, $2, $3)",
      [user.id, accountNumber, 0]
    );

    // Só aqui os dados ficam mesmo gravados de forma permanente
    await client.query("COMMIT");

    return res.status(201).json({ user, accountNumber });
  } catch (err) {
    // Se qualquer coisa acima falhar (ex: erro de rede, bug),
    // desfazemos tudo — nunca queremos um user "órfão" sem conta
    await client.query("ROLLBACK");
    console.error(err);
    return res.status(500).json({ error: "Erro ao registar utilizador" });
  } finally {
    // Devolve a conexão ao pool, sempre — mesmo se deu erro
    client.release();
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "email e password são obrigatórios" });
  }

  try {
    const result = await pool.query("SELECT id, full_name, email, password_hash FROM users WHERE email = $1", [email]);
    const user = result.rows[0];
    
     // Nota de segurança: respondemos SEMPRE com a mesma mensagem genérica
    // "Credenciais inválidas", quer o email não exista quer a password
    // esteja errada. Se disséssemos "email não encontrado" vs "password errada",
    // estaríamos a confirmar a um atacante quais emails existem no sistema.
    if (!user) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    // Gera o token: payload com userId, assinado com o segredo,
    // expira em 1h (depois disso o utilizador tem de fazer login outra vez)
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    return res.json({ token, user: { id: user.id, fullName: user.full_name, email: user.email } });
    } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao autenticar utilizador" });
  }
});    


module.exports = router;