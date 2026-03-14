import { useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Zap, Lock, Code, User, ArrowRight, Database } from "lucide-react";
import * as api from "../services/api";
import { projectId, publicAnonKey } from "/utils/supabase/info";

export function LoginPage() {
  const [mode, setMode] = useState<"login" | "code">("login");
  const [step, setStep] = useState(1); // 1 = username, 2 = PIN
  const [username, setUsername] = useState("");
  const [pinDots, setPinDots] = useState<number[]>([]);
  const [inviteCode, setInviteCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [initLoading, setInitLoading] = useState(false);
  const [initMessage, setInitMessage] = useState("");
  const navigate = useNavigate();

  const handleInitDatabase = async () => {
    setInitLoading(true);
    setInitMessage("");
    try {
      const response = await api.initDatabase();
      console.log("✅ Inicialização:", response);
      setInitMessage("✅ " + response.message);
      setTimeout(() => setInitMessage(""), 3000);
    } catch (error: any) {
      console.error("❌ Erro ao inicializar:", error);
      setInitMessage("❌ Erro: " + error.message);
    } finally {
      setInitLoading(false);
    }
  };

  const handleDebugDB = async () => {
    try {
      console.log("🔍 Testando conexão com banco...");
      
      // Buscar TODOS os dados
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-42377006/debug/all`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${publicAnonKey}`,
        },
      });
      
      const result = await response.json();
      console.log("📊 TODOS OS DADOS DO BANCO:", result.data);
      
      if (result.success) {
        const info = `
📊 BANCO DE DADOS KV STORE:

👤 Admin: ${result.data.admin ? "✅ EXISTE" : "❌ NÃO EXISTE"}
${result.data.admin ? `  - Username: ${result.data.admin.username}\n  - PIN: ${result.data.admin.pin}\n  - Role: ${result.data.admin.role}` : ""}

👥 Vendedores: ${result.data.vendedores?.length || 0}
👥 Clientes: ${result.data.clientes?.length || 0}
👥 Motoristas: ${result.data.motoristas?.length || 0}

🎫 Códigos Vendedor: ${result.data.codesVendedor?.length || 0}
🎫 Códigos Cliente: ${result.data.codesCliente?.length || 0}
🎫 Códigos Motorista: ${result.data.codesMotorista?.length || 0}
        `;
        alert(info);
      } else {
        alert("❌ Erro ao buscar dados: " + result.error);
      }
    } catch (error: any) {
      console.error("❌ Erro de conexão:", error);
      alert("❌ Erro de conexão: " + error.message);
    }
  };

  const handleForceInit = async () => {
    setInitLoading(true);
    setInitMessage("");
    try {
      console.log("🔄 FORÇANDO criação do admin...");
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-42377006/force-init`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${publicAnonKey}`,
        },
      });
      
      const result = await response.json();
      console.log("📊 Resultado:", result);
      
      if (result.success) {
        setInitMessage("✅ " + result.message);
        alert("✅ SUCESSO!\n\nAdmin criado:\n" + JSON.stringify(result.admin, null, 2));
      } else {
        setInitMessage("❌ Erro: " + result.error);
        alert("❌ Erro: " + result.error);
      }
    } catch (error: any) {
      console.error("❌ Erro:", error);
      setInitMessage("❌ Erro: " + error.message);
      alert("❌ Erro: " + error.message);
    } finally {
      setInitLoading(false);
    }
  };

  const handleUsernameSubmit = async () => {
    if (!username.trim()) {
      setError("Digite um nome de usuário");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await api.loginStep1(username.toLowerCase());
      
      if (response.success) {
        setUserData(response.user);
        setStep(2);
      }
    } catch (err: any) {
      setError(err.message || "Usuário não encontrado");
      
      // Se for erro de usuário não encontrado, sugerir reinicialização
      if (err.message?.includes("não encontrado") || err.message?.includes("not found")) {
        setError("Usuário não encontrado. Tente recarregar a página (F5) para inicializar o banco de dados.");
      }
      
      console.error("Erro no login step1:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePinInput = (digit: number) => {
    if (pinDots.length < 6) {
      const newPinDots = [...pinDots, digit];
      setPinDots(newPinDots);
      
      if (newPinDots.length === 6) {
        // Validar PIN quando completo
        setTimeout(() => {
          handleLogin(newPinDots.join(""));
        }, 300);
      }
    }
  };

  const handleDeletePin = () => {
    setPinDots(pinDots.slice(0, -1));
    setError("");
  };

  const handleLogin = async (pin: string) => {
    if (!userData) {
      setError("Usuário não encontrado");
      setPinDots([]);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await api.loginStep2(userData.username, pin);
      
      if (response.success) {
        // Armazenar dados do usuário no localStorage
        localStorage.setItem("currentUser", JSON.stringify({
          username: response.user.username,
          name: response.user.name,
          photo: response.user.photo,
          tipo: response.user.role, // Importante: usar 'tipo' para compatibilidade com ProtectedRoute
        }));
        
        // Navegar para o painel correto
        navigate(`/${response.user.role}`);
      }
    } catch (err: any) {
      setError(err.message || "PIN incorreto");
      setPinDots([]);
      console.error("Erro no login step2:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = async () => {
    if (!inviteCode.trim()) {
      setCodeError("Digite um código");
      return;
    }

    setLoading(true);
    setCodeError("");

    try {
      console.log("🔍 VALIDANDO CÓDIGO NO FRONTEND:", inviteCode);
      console.log("📏 Tamanho do código:", inviteCode.length);
      console.log("📄 Código com aspas:", JSON.stringify(inviteCode));
      console.log("🔤 Código trimmed:", inviteCode.trim());
      
      const response = await api.validateInviteCode(inviteCode.trim());
      
      console.log("✅ Resposta da validação:", response);
      
      if (response.success) {
        // Navegar para tela de registro com o tipo correto
        navigate(`/register/${response.type}`, { state: { inviteCode: inviteCode.trim() } });
      }
    } catch (err: any) {
      console.error("❌ Erro ao validar código:", err);
      setCodeError(err.message || "Código inválido ou já utilizado");
      console.error("Erro ao validar código:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToUsername = () => {
    setStep(1);
    setPinDots([]);
  };

  // Foto do usuário mockada baseada no username
  const getUserPhoto = () => {
    const firstLetter = username.charAt(0).toUpperCase();
    return firstLetter;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center relative overflow-hidden">
      {/* Animated Background com mais movimento */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-0 left-1/4 w-96 h-96 bg-[#00f0ff] rounded-full blur-[120px] opacity-20"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#ff00ff] rounded-full blur-[120px] opacity-20"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
            x: [0, -50, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2.5,
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#8b5cf6] rounded-full blur-[120px] opacity-20"
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.15, 0.35, 0.15],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />
        
        {/* Partículas flutuantes */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-[#00f0ff] rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md px-6"
      >
        {/* Logo */}
        <div className="text-center mb-12">
          <motion.div
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[#00f0ff] to-[#8b5cf6] mb-6"
            animate={{
              boxShadow: [
                "0 0 30px rgba(0,240,255,0.3), 0 0 60px rgba(139,92,246,0.2)",
                "0 0 50px rgba(139,92,246,0.4), 0 0 80px rgba(0,240,255,0.3)",
                "0 0 30px rgba(0,240,255,0.3), 0 0 60px rgba(139,92,246,0.2)",
              ],
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Zap className="w-10 h-10 text-white" />
          </motion.div>
          <motion.h1 
            className="text-4xl font-bold text-white mb-2"
            animate={{
              textShadow: [
                "0 0 20px rgba(0,240,255,0.5)",
                "0 0 30px rgba(255,0,255,0.5)",
                "0 0 20px rgba(0,240,255,0.5)",
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
          >
            <span className="bg-gradient-to-r from-[#00f0ff] via-[#8b5cf6] to-[#ff00ff] bg-clip-text text-transparent">
              DELIVERY TECH
            </span>
          </motion.h1>
          <p className="text-gray-400">Sistema de Gestão Avançado</p>
        </div>

        {/* Card */}
        <motion.div 
          className="bg-[#12121a] border border-[#1f1f2e] rounded-2xl p-8 shadow-2xl backdrop-blur-sm"
          animate={{
            boxShadow: [
              "0 0 20px rgba(0,240,255,0.1)",
              "0 0 30px rgba(139,92,246,0.15)",
              "0 0 20px rgba(0,240,255,0.1)",
            ],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
          }}
        >
          {/* Mode Tabs */}
          <div className="flex gap-2 mb-8">
            <motion.button
              onClick={() => {
                setMode("login");
                setStep(1);
                setPinDots([]);
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex-1 py-3 rounded-xl font-semibold transition-all duration-300 ${
                mode === "login"
                  ? "bg-gradient-to-r from-[#00f0ff] to-[#8b5cf6] text-white shadow-[0_0_20px_rgba(0,240,255,0.4)]"
                  : "bg-[#1f1f2e] text-gray-400 hover:text-white"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Lock className="w-4 h-4" />
                Acessar Conta
              </div>
            </motion.button>
            <motion.button
              onClick={() => {
                setMode("code");
                setStep(1);
                setPinDots([]);
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex-1 py-3 rounded-xl font-semibold transition-all duration-300 ${
                mode === "code"
                  ? "bg-gradient-to-r from-[#00f0ff] to-[#8b5cf6] text-white shadow-[0_0_20px_rgba(0,240,255,0.4)]"
                  : "bg-[#1f1f2e] text-gray-400 hover:text-white"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Code className="w-4 h-4" />
                Inserir Código
              </div>
            </motion.button>
          </div>

          <AnimatePresence mode="wait">
            {/* Login Form - Step 1: Username */}
            {mode === "login" && step === 1 && (
              <motion.div
                key="login-step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="text-center mb-6">
                  <motion.div
                    className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00f0ff]/20 to-[#8b5cf6]/20 border border-[#00f0ff]/30 mb-4"
                    animate={{
                      borderColor: ["rgba(0,240,255,0.3)", "rgba(139,92,246,0.3)", "rgba(0,240,255,0.3)"],
                      boxShadow: [
                        "0 0 20px rgba(0,240,255,0.2)",
                        "0 0 30px rgba(139,92,246,0.3)",
                        "0 0 20px rgba(0,240,255,0.2)",
                      ],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <User className="w-8 h-8 text-[#00f0ff]" />
                  </motion.div>
                  <h3 className="text-white font-bold text-xl">Identificação</h3>
                  <p className="text-gray-400 text-sm mt-1">Digite seu nome de usuário</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nome de Usuário
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleUsernameSubmit()}
                    className="w-full px-4 py-3 bg-[#1f1f2e] border border-[#2a2a3e] rounded-xl text-white focus:outline-none focus:border-[#00f0ff] focus:ring-2 focus:ring-[#00f0ff]/20 transition-all"
                    placeholder="Digite seu usuário"
                    autoFocus
                  />
                </div>
                {error && (
                  <p className="text-red-500 text-sm text-center mb-2">{error}</p>
                )}
                <motion.button
                  onClick={handleUsernameSubmit}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 bg-gradient-to-r from-[#00f0ff] to-[#8b5cf6] text-white font-bold rounded-xl shadow-[0_0_30px_rgba(0,240,255,0.3)] hover:shadow-[0_0_40px_rgba(0,240,255,0.5)] transition-all flex items-center justify-center gap-2"
                >
                  Continuar
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </motion.div>
            )}

            {/* Login Form - Step 2: PIN */}
            {mode === "login" && step === 2 && (
              <motion.div
                key="login-step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                {/* Foto do Usuário */}
                <div className="text-center">
                  <motion.div
                    className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-[#00f0ff] to-[#8b5cf6] mb-4 text-white text-3xl font-bold"
                    animate={{
                      boxShadow: [
                        "0 0 30px rgba(0,240,255,0.5), 0 0 60px rgba(139,92,246,0.3)",
                        "0 0 50px rgba(139,92,246,0.5), 0 0 80px rgba(0,240,255,0.4)",
                        "0 0 30px rgba(0,240,255,0.5), 0 0 60px rgba(139,92,246,0.3)",
                      ],
                      scale: [1, 1.05, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                    }}
                  >
                    {getUserPhoto()}
                  </motion.div>
                  <h3 className="text-white font-semibold text-lg">{username}</h3>
                  <p className="text-gray-400 text-sm mt-1">Digite seu PIN</p>
                </div>

                {/* PIN Dots */}
                <div className="flex justify-center gap-3">
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className={`w-4 h-4 rounded-full border-2 transition-all ${
                        pinDots[i] !== undefined
                          ? "bg-[#00f0ff] border-[#00f0ff]"
                          : "border-gray-600"
                      }`}
                      style={{
                        boxShadow: pinDots[i] !== undefined 
                          ? "0 0 10px rgba(0,240,255,0.6)" 
                          : "none"
                      }}
                    />
                  ))}
                </div>

                {/* PIN Pad */}
                <div className="grid grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <motion.button
                      key={num}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handlePinInput(num)}
                      className="aspect-square rounded-xl bg-[#1f1f2e] border border-[#2a2a3e] text-white text-2xl font-bold hover:bg-[#2a2a3e] hover:border-[#00f0ff] transition-all"
                      animate={{
                        boxShadow: [
                          "0 0 0px rgba(0,240,255,0)",
                          "0 0 15px rgba(0,240,255,0.1)",
                          "0 0 0px rgba(0,240,255,0)",
                        ],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: num * 0.1,
                      }}
                    >
                      {num}
                    </motion.button>
                  ))}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleBackToUsername}
                    className="aspect-square rounded-xl bg-[#1f1f2e] border border-[#2a2a3e] text-gray-400 text-sm font-bold hover:bg-[#2a2a3e] hover:text-white transition-all"
                  >
                    Voltar
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handlePinInput(0)}
                    className="aspect-square rounded-xl bg-[#1f1f2e] border border-[#2a2a3e] text-white text-2xl font-bold hover:bg-[#2a2a3e] hover:border-[#00f0ff] transition-all"
                  >
                    0
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleDeletePin}
                    className="aspect-square rounded-xl bg-[#ff006e]/20 border border-[#ff006e] text-[#ff006e] text-xl font-bold hover:bg-[#ff006e]/30 transition-all"
                  >
                    ←
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Code Form */}
            {mode === "code" && (
              <motion.div
                key="code"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-6">
                  <motion.div
                    className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#ff00ff]/20 to-[#8b5cf6]/20 border border-[#ff00ff]/30 mb-4"
                    animate={{
                      borderColor: ["rgba(255,0,255,0.3)", "rgba(139,92,246,0.3)", "rgba(255,0,255,0.3)"],
                      boxShadow: [
                        "0 0 20px rgba(255,0,255,0.2)",
                        "0 0 30px rgba(139,92,246,0.3)",
                        "0 0 20px rgba(255,0,255,0.2)",
                      ],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Code className="w-8 h-8 text-[#ff00ff]" />
                  </motion.div>
                  <h3 className="text-white font-bold text-xl">Código de Convite</h3>
                  <p className="text-gray-400 text-sm mt-1">Insira o código fornecido</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Código de Convite
                  </label>
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    className="w-full px-4 py-3 bg-[#1f1f2e] border border-[#2a2a3e] rounded-xl text-white text-center text-2xl font-mono tracking-widest focus:outline-none focus:border-[#ff00ff] focus:ring-2 focus:ring-[#ff00ff]/20 transition-all"
                    placeholder="X-XXXX-XXXX"
                    maxLength={12}
                    autoFocus
                  />
                </div>
                {codeError && (
                  <p className="text-red-500 text-sm text-center mb-2">{codeError}</p>
                )}
                <motion.button
                  onClick={handleCodeSubmit}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 bg-gradient-to-r from-[#ff00ff] to-[#8b5cf6] text-white font-bold rounded-xl shadow-[0_0_30px_rgba(255,0,255,0.3)] hover:shadow-[0_0_40px_rgba(255,0,255,0.5)] transition-all"
                >
                  VALIDAR CÓDIGO
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Footer */}
        <motion.div 
          className="text-center mt-8"
          animate={{
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
          }}
        >
          <p className="text-gray-500 text-sm">
            Sistema protegido com criptografia de ponta
          </p>
        </motion.div>

        {/* Botão Inicializar Banco */}
        <motion.div className="text-center mt-4 flex gap-3 justify-center">
          <motion.button
            onClick={handleInitDatabase}
            disabled={initLoading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#1f1f2e] border border-[#00f0ff] text-[#00f0ff] rounded-xl font-semibold hover:bg-[#00f0ff]/10 transition-all disabled:opacity-50"
          >
            <Database className="w-4 h-4" />
            {initLoading ? "Inicializando..." : "Inicializar Banco"}
          </motion.button>
          
          <motion.button
            onClick={handleDebugDB}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#1f1f2e] border border-[#8b5cf6] text-[#8b5cf6] rounded-xl font-semibold hover:bg-[#8b5cf6]/10 transition-all"
          >
            Ver Dados
          </motion.button>
          
          <motion.button
            onClick={handleForceInit}
            disabled={initLoading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#1f1f2e] border border-[#ff006e] text-[#ff006e] rounded-xl font-semibold hover:bg-[#ff006e]/10 transition-all disabled:opacity-50"
          >
            Forçar Inicialização
          </motion.button>
        </motion.div>
        {initMessage && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-2 text-sm text-center ${initMessage.includes("✅") ? "text-green-400" : "text-red-400"}`}
          >
            {initMessage}
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}