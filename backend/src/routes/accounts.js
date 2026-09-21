const express = require("express");
const pool = require("../db/pool");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// Aplica o middleware a todas as rotas definidas neste ficheiro.
// A partir daqui para baixo nao preciso repetir em cada roda
router.use(authMiddleware);

router.get("/me", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT id, account_number, balance FROM accounts WHERE user_id = $1",
            [req.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Conta não encontrada" });
        }

        const account = result.rows[0];
        res.json({ account });
    } catch (err) {
        console.error("Erro ao obter a conta:", err);
        res.status(500).json({ error: "Erro interno do servidor" });
    }
});

module.exports = router;