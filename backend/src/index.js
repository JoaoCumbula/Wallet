// Carrega variáveis de ambiente do .env (ex: PORT) para process.env
require("dotenv").config();

// Framework HTTP: gere rotas, pedidos e respostas
const express = require("express");

// Importa as rotas de autenticação
const authRoutes = require("./routes/auth");

// Middleware que permite pedidos vindos de outra origem (o nosso frontend)
const cors = require("cors");

// Cria a instância principal da aplicação Express
const app = express();

// Ativa CORS para todos os pedidos
app.use(cors());

// Faz parsing automático de bodies em JSON, disponíveis em req.body
app.use(express.json());

// Rota de "health check" — usada para confirmar que a API está viva
// (útil também em CI/CD e monitorização)
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/", (req, res) => {
  res.json({ status: "MVP Wallet API — ver /api/health" });
});

const pool = require("./db/pool");
app.get("/api/db-check", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");
        res.json({ status: "ok", dbTime: result.rows[0].now });
    } catch (err) {
        console.error("Erro ao verificar a base de dados:", err);
        res.status(500).json({ status: "error", message: "Erro ao verificar a base de dados" });
    }
});

// Usa a porta definida no .env, ou 4000 como valor por defeito
const PORT = process.env.PORT || 4000;

// Regista as rotas de autenticação sob o prefixo /api/auth
app.use("/api/auth", authRoutes);

// Outras rotas (ex: /api/transactions, /api/users) podem ser registadas aqui
const accountRoutes = require("./routes/accounts");
app.use("/api/accounts", accountRoutes);

// Arranca o servidor e fica à escuta de pedidos nessa porta
app.listen(PORT, () => {
  console.log(`API a correr em http://localhost:${PORT}`);
});