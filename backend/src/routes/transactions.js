const express = require("express");
const pool = require("../db/pool");
const authMiddleware = require("../middleware/auth");

const router = express.Router();
router.use(authMiddleware);

router.post("/transfer", async (req, res) => {
  const { toAccountNumber, amount } = req.body;
  const numericAmount = Number(amount);

  if (!toAccountNumber || !numericAmount || numericAmount <= 0) {
    return res.status(400).json({ error: "toAccountNumber e amount (> 0) são obrigatórios" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // FOR UPDATE bloqueia esta linha: qualquer outra transação que
    // tente fazer SELECT ... FOR UPDATE na mesma conta tem de ESPERAR
    // até este COMMIT ou ROLLBACK terminar
    const fromResult = await client.query(
      "SELECT * FROM accounts WHERE user_id = $1 FOR UPDATE",
      [req.userId]
    );
    const fromAccount = fromResult.rows[0];

    if (!fromAccount) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Conta de origem não encontrada" });
    }

    const toResult = await client.query(
      "SELECT * FROM accounts WHERE account_number = $1 FOR UPDATE",
      [toAccountNumber]
    );
    const toAccount = toResult.rows[0];

    if (!toAccount) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Conta de destino não encontrada" });
    }

    if (toAccount.id === fromAccount.id) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Não podes transferir para a própria conta" });
    }

    // Esta verificação agora é SEGURA, porque a linha está bloqueada
    // desde o SELECT ... FOR UPDATE — nenhum outro pedido pode ter
    // alterado o saldo entretanto
    if (Number(fromAccount.balance) < numericAmount) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Saldo insuficiente" });
    }

    await client.query("UPDATE accounts SET balance = balance - $1 WHERE id = $2", [
      numericAmount,
      fromAccount.id,
    ]);
    await client.query("UPDATE accounts SET balance = balance + $1 WHERE id = $2", [
      numericAmount,
      toAccount.id,
    ]);

    const txResult = await client.query(
      `INSERT INTO transactions (from_account_id, to_account_id, amount, type)
       VALUES ($1, $2, $3, 'transfer') RETURNING *`,
      [fromAccount.id, toAccount.id, numericAmount]
    );

    await client.query("COMMIT");

    return res.status(201).json({ transaction: txResult.rows[0] });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    return res.status(500).json({ error: "Erro ao processar transferência" });
  } finally {
    client.release();
  }
});

router.get("/", async (req, res) => {
  try {
    const accountResult = await pool.query("SeLECT id FROM accounts WHERE user_id = $1", [req.userId]);
    const account = accountResult.rows[0];

    if (!account) {
      return res.status(404).json({ error: "Conta não encontrada" });
    }

    // LEFT JOIN traz o número de conta de quem enviou e de quem recebeu,
    // em vez de devolveres só os IDs internos (from_account_id, to_account_id)
    // — mais útil para o frontend mostrar diretamente
    const historyResult = await pool.query(
      `SELECT t.*,
              FROM_ACCOUNT.account_number AS from_account_number,
              TO_ACCOUNT.account_number AS to_account_number
       FROM transactions t
       LEFT JOIN accounts FROM_ACCOUNT ON t.from_account_id = FROM_ACCOUNT.id
       LEFT JOIN accounts TO_ACCOUNT ON t.to_account_id = TO_ACCOUNT.id
       WHERE t.from_account_id = $1 OR t.to_account_id = $2
       ORDER BY t.created_at DESC`,
      [account.id, account.id]
    );

    return res.json({ history: historyResult.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao buscar histórico de transações" });
  }
});

module.exports = router;