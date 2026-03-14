import { useEffect } from "react";
import { useNavigate } from "react-router";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredType?: "admin" | "vendedor" | "cliente" | "motorista";
}

export function ProtectedRoute({ children, requiredType }: ProtectedRouteProps) {
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = localStorage.getItem("currentUser");
    
    if (!currentUser) {
      // Não está autenticado, redireciona para login
      navigate("/");
      return;
    }

    try {
      const user = JSON.parse(currentUser);
      
      // Verifica se o tipo do usuário corresponde ao tipo necessário da rota
      if (requiredType && user.tipo !== requiredType) {
        // Usuário não tem permissão para esta rota
        navigate("/");
        return;
      }
    } catch (error) {
      // Erro ao parsear usuário, redireciona para login
      localStorage.removeItem("currentUser");
      navigate("/");
    }
  }, [navigate, requiredType]);

  return <>{children}</>;
}
