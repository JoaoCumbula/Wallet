import { Navigate } from "react-router-dom";
import { useAuth } from "../api/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user } = useAuth();

  // Se não há utilizador no contexto, manda para /login
  // "replace" evita que o botão "voltar" do browser volte para a página protegida
  if (!user) return <Navigate to="/login" replace />;

  return children;
}