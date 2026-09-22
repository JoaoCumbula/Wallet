import { api } from "./api/client";

export default function App() {
  async function testLogin() {
    try {
      const data = await api.login({ email: "joao@teste.com", password: "senha123" });
      console.log("Login funcionou:", data);
    } catch (err) {
      console.error("Erro no login:", err.message);
    }
  }

  return (
    <div>
      <h1>MVP Wallet</h1>
      <button onClick={testLogin}>Testar login</button>
    </div>
  );
}