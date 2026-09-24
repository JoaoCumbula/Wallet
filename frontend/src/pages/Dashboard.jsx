import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../api/AuthContext";

export default function Dashboard() {
  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState("");
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        // Promise.all corre as duas chamadas em paralelo,
        // em vez de esperar uma terminar para começar a outra
        const [accountData, txData] = await Promise.all([
          api.getAccount(),
          api.getTransactions(),
        ]);
        setAccount(accountData);
        setTransactions(txData);
      } catch (err) {
        setError(err.message);
      }
    }
    load();
  }, []); // array vazio [] significa: corre só UMA vez, quando o componente monta

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h1>Olá, {user?.fullName}</h1>
        <button onClick={handleLogout}>Sair</button>
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {account && (
        <div style={{ background: "#0f4c81", color: "white", padding: 16, borderRadius: 8 }}>
          <p>Nº de conta: {account.account_number}</p>
          <p style={{ fontSize: 28, fontWeight: "bold" }}>
            {Number(account.balance).toFixed(2)} MT
          </p>
        </div>
      )}

      <p>
        <Link to="/transfer">Nova transferência</Link>
      </p>

      <h2>Últimas transações</h2>
      <ul>
        {transactions.map((tx) => {
          // Determina se esta transação foi enviada ou recebida
          // por esta conta, para mostrar sinal +/- corretamente
          const isOutgoing = account && tx.from_account_id === account.id;
          return (
            <li key={tx.id}>
              {isOutgoing ? `Para ${tx.to_account_number}` : `De ${tx.from_account_number}`}
              {" — "}
              <strong style={{ color: isOutgoing ? "red" : "green" }}>
                {isOutgoing ? "-" : "+"}
                {Number(tx.amount).toFixed(2)} MT
              </strong>
            </li>
          );
        })}
        {transactions.length === 0 && <li>Sem transações ainda.</li>}
      </ul>
    </div>
  );
}