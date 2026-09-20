const { Pool } = require("pg");

// Um "pool" é um conjunto de ligações à base de dados que podem ser reutilizadas
// em vez de abrir e fechar uma ligação a cada pedido. Isto melhora o desempenho.
// isto é muito mais eficiente para uma API que recebe muitos pedidos.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Se algo correr mal numa conexao ociosa do pool, e melhor
// falhar alto (crash) do que tentar continuar a correr com uma base de dados possivelmente corrompida.
pool.on('error', (err, client) => {
  console.error('Erro inesperado numa ligação ociosa do pool', err);
  process.exit(-1);
});

module.exports = pool;