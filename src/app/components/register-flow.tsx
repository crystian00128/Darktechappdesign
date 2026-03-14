import { useState } from "react";
import { motion } from "motion/react";
import { Camera, User, Phone, Check, Eye, Lock } from "lucide-react";
import { useNavigate, useLocation } from "react-router";
import * as api from "../services/api";

interface RegisterFlowProps {
  userType: "vendedor" | "cliente" | "motorista";
  onComplete: () => void;
}

export function RegisterFlow({ userType, onComplete }: RegisterFlowProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    foto: null as string | null,
    nome: "",
    nomeLoja: "",
    whatsapp: "",
    username: "",
    pin: "",
    pinConfirm: "",
  });
  const [pinDots, setPinDots] = useState<number[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const inviteCode = (location.state as any)?.inviteCode;

  const handlePinInput = (digit: number) => {
    if (pinDots.length < 6) {
      const newPinDots = [...pinDots, digit];
      setPinDots(newPinDots);
      
      if (newPinDots.length === 6) {
        if (step === 2) {
          setFormData({ ...formData, pin: newPinDots.join("") });
          setTimeout(() => {
            setPinDots([]);
            setStep(3);
          }, 500);
        } else if (step === 3) {
          const pinConfirm = newPinDots.join("");
          setFormData({ ...formData, pinConfirm });
          
          // Validar PINs
          if (formData.pin !== pinConfirm) {
            setError("PINs não coincidem!");
            setPinDots([]);
            setTimeout(() => setError(""), 3000);
            return;
          }
          
          // CRIAR USUÁRIO NO BANCO
          setTimeout(async () => {
            await handleRegister(pinConfirm);
          }, 500);
        }
      }
    }
  };

  const handleRegister = async (pinConfirm: string) => {
    setLoading(true);
    setError("");
    
    try {
      console.log("📝 Criando usuário no banco...", {
        username: formData.username,
        role: userType,
        name: userType === "vendedor" ? formData.nomeLoja : formData.nome,
        inviteCode,
      });
      
      const response = await api.registerUser({
        username: formData.username.toLowerCase(),
        pin: formData.pin,
        name: userType === "vendedor" ? formData.nomeLoja : formData.nome,
        role: userType,
        inviteCode,
      });
      
      console.log("✅ Usuário criado:", response);
      
      // Salvar no localStorage
      localStorage.setItem("currentUser", JSON.stringify({
        username: formData.username.toLowerCase(),
        name: userType === "vendedor" ? formData.nomeLoja : formData.nome,
        photo: response.user.photo,
        tipo: userType,
      }));
      
      // Navegar
      onComplete();
      navigate(`/${userType}`);
      
    } catch (err: any) {
      console.error("❌ Erro ao criar usuário:", err);
      setError(err.message || "Erro ao criar usuário");
      setPinDots([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePin = () => {
    setPinDots(pinDots.slice(0, -1));
  };

  const handleFacialRecognition = async () => {
    setLoading(true);
    setError("");
    
    try {
      console.log("📸 Reconhecimento facial simulado para cliente...");
      
      // CRIAR CLIENTE NO BANCO
      const response = await api.registerUser({
        username: formData.username.toLowerCase(),
        pin: "000000", // Cliente usa reconhecimento facial, PIN padrão
        name: formData.username,
        role: "cliente",
        inviteCode,
      });
      
      console.log("✅ Cliente criado:", response);
      
      // Salvar no localStorage
      localStorage.setItem("currentUser", JSON.stringify({
        username: formData.username.toLowerCase(),
        name: formData.username,
        photo: response.user.photo,
        tipo: "cliente",
      }));
      
      onComplete();
      navigate("/cliente");
    } catch (err: any) {
      console.error("❌ Erro ao criar cliente:", err);
      setError(err.message || "Erro ao criar usuário");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-0 left-1/4 w-96 h-96 bg-[#00f0ff] rounded-full blur-[120px] opacity-20"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#ff00ff] rounded-full blur-[120px] opacity-20"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-[#12121a] border border-[#1f1f2e] rounded-2xl p-8">
          <div className="text-center mb-8">
            <h2 className="text-white font-bold text-2xl mb-2">
              Criar Conta {userType.charAt(0).toUpperCase() + userType.slice(1)}
            </h2>
            <p className="text-gray-400">
              Passo {userType === "cliente" ? (step === 1 ? "1" : "2") : step} de{" "}
              {userType === "cliente" ? "2" : "3"}
            </p>
          </div>

          {/* Vendedor/Motorista - Step 1: Dados Básicos */}
          {(userType === "vendedor" || userType === "motorista") && step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#00f0ff] to-[#8b5cf6] flex items-center justify-center">
                    {formData.foto ? (
                      <img
                        src={formData.foto}
                        alt="Profile"
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-12 h-12 text-white" />
                    )}
                  </div>
                  <button className="absolute bottom-0 right-0 p-2 bg-[#00f0ff] rounded-full text-black">
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {userType === "vendedor" && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nome da Loja
                  </label>
                  <input
                    type="text"
                    value={formData.nomeLoja}
                    onChange={(e) => setFormData({ ...formData, nomeLoja: e.target.value })}
                    className="w-full px-4 py-3 bg-[#1f1f2e] border border-[#2a2a3e] rounded-xl text-white focus:outline-none focus:border-[#00f0ff]"
                    placeholder="Ex: Loja Tech Center"
                  />
                </div>
              )}

              {userType === "motorista" && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="w-full px-4 py-3 bg-[#1f1f2e] border border-[#2a2a3e] rounded-xl text-white focus:outline-none focus:border-[#00f0ff]"
                    placeholder="Digite seu nome"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  WhatsApp
                </label>
                <input
                  type="tel"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  className="w-full px-4 py-3 bg-[#1f1f2e] border border-[#2a2a3e] rounded-xl text-white focus:outline-none focus:border-[#00f0ff]"
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nome de Usuário
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-4 py-3 bg-[#1f1f2e] border border-[#2a2a3e] rounded-xl text-white focus:outline-none focus:border-[#00f0ff]"
                  placeholder="Digite seu usuário"
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setStep(2)}
                className="w-full py-4 bg-gradient-to-r from-[#00f0ff] to-[#8b5cf6] text-white font-bold rounded-xl shadow-[0_0_30px_rgba(0,240,255,0.3)]"
              >
                Continuar
              </motion.button>
            </motion.div>
          )}

          {/* Cliente - Step 1: Dados Básicos */}
          {userType === "cliente" && step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nome de Usuário
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-4 py-3 bg-[#1f1f2e] border border-[#2a2a3e] rounded-xl text-white focus:outline-none focus:border-[#00f0ff]"
                  placeholder="Digite seu usuário"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  WhatsApp
                </label>
                <input
                  type="tel"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  className="w-full px-4 py-3 bg-[#1f1f2e] border border-[#2a2a3e] rounded-xl text-white focus:outline-none focus:border-[#00f0ff]"
                  placeholder="(00) 00000-0000"
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setStep(2)}
                className="w-full py-4 bg-gradient-to-r from-[#00f0ff] to-[#8b5cf6] text-white font-bold rounded-xl shadow-[0_0_30px_rgba(0,240,255,0.3)]"
              >
                Continuar
              </motion.button>
            </motion.div>
          )}

          {/* Cliente - Step 2: Reconhecimento Facial */}
          {userType === "cliente" && step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-center space-y-6"
            >
              <div className="flex justify-center mb-6">
                <motion.div
                  animate={{
                    boxShadow: [
                      "0 0 0 0 rgba(0,240,255,0.7)",
                      "0 0 0 20px rgba(0,240,255,0)",
                      "0 0 0 0 rgba(0,240,255,0)",
                    ],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                  }}
                  className="w-48 h-48 rounded-full bg-gradient-to-br from-[#00f0ff] to-[#8b5cf6] flex items-center justify-center"
                >
                  <Eye className="w-24 h-24 text-white" />
                </motion.div>
              </div>

              <div>
                <h3 className="text-white font-bold text-xl mb-2">Reconhecimento Facial</h3>
                <p className="text-gray-400">
                  Posicione seu rosto na área indicada
                </p>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleFacialRecognition}
                className="w-full py-4 bg-gradient-to-r from-[#00f0ff] to-[#8b5cf6] text-white font-bold rounded-xl shadow-[0_0_30px_rgba(0,240,255,0.3)]"
              >
                Iniciar Reconhecimento
              </motion.button>
            </motion.div>
          )}

          {/* Vendedor/Motorista - Step 2 & 3: PIN */}
          {(userType === "vendedor" || userType === "motorista") && (step === 2 || step === 3) && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00f0ff] to-[#8b5cf6] mb-4">
                  <Lock className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-white font-bold text-xl mb-2">
                  {step === 2 ? "Criar PIN" : "Confirmar PIN"}
                </h3>
                <p className="text-gray-400">
                  {step === 2
                    ? "Digite um PIN de 6 dígitos"
                    : "Digite novamente para confirmar"}
                </p>
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
                        ? "bg-[#00f0ff] border-[#00f0ff] shadow-[0_0_10px_rgba(0,240,255,0.5)]"
                        : "border-gray-600"
                    }`}
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
                  >
                    {num}
                  </motion.button>
                ))}
                <div />
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

          {/* Error Message */}
          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-500 text-sm mt-4 text-center"
            >
              {error}
            </motion.p>
          )}

          {/* Loading Indicator */}
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[#00f0ff] text-sm mt-4 text-center flex items-center justify-center gap-2"
            >
              <div className="w-4 h-4 border-2 border-[#00f0ff] border-t-transparent rounded-full animate-spin" />
              Criando usuário...
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}