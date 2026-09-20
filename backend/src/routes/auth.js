const express = require("express");
const bcrypt = require("bcryptjs");
const pool = require("../db/pool");

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

module.exports = router;