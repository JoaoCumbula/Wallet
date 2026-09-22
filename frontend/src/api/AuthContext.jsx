import { createContext, useContext, useState } from "react";
import { api } from "./client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  // Guardamos só os dados do utilizador (não sensíveis) no localStorage,
  // para a UI saber quem está logado ao recarregar a página.
  // O cookie do token é gerido só pelo browser, nunca por nós.
  function login(userData) {
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  }

  async function logout() {
    await api.logout(); // pede ao backend para limpar o cookie httpOnly
    localStorage.removeItem("user");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}