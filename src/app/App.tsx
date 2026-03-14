import { RouterProvider } from "react-router";
import { router } from "./routes";
import { useEffect } from "react";
import * as api from "./services/api";

export default function App() {
  useEffect(() => {
    // Inicializar banco de dados com admin ao carregar app
    const initDB = async () => {
      try {
        console.log("🔄 Tentando inicializar banco de dados...");
        const response = await api.initDatabase();
        console.log("✅ Banco inicializado:", response.message);
        console.log("🔑 Login Admin: username='admin', PIN='414243'");
      } catch (error) {
        console.error("❌ Erro ao inicializar banco:", error);
        console.log("⚠️ Use o botão 'Inicializar Banco' na tela de login");
      }
    };

    initDB();
  }, []);

  return <RouterProvider router={router} />;
}