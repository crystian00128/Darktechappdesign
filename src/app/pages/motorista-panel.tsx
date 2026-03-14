import { useState } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router";
import {
  Power,
  MessageSquare,
  FileText,
  Video,
  Phone,
  Mic,
  Send,
  Camera,
  Image,
  MapPin,
  Check,
  Bell,
  DollarSign,
  TrendingUp,
  Package,
  X,
  LogOut,
} from "lucide-react";
import { StatCard } from "../components/stat-card";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export function MotoristaPanel() {
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "relatorios">("chat");
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [showNotification, setShowNotification] = useState(false);
  const [showDeliveryConfirm, setShowDeliveryConfirm] = useState(false);

  // Dados reais - vazio inicialmente
  const vendedor = null;
  const clientesTemporarios: any[] = [];
  const deliveryData: any[] = [];
  const comissoes: any[] = [];

  const handleAcceptDelivery = () => {
    setShowNotification(false);
    // TODO: Implementar lógica de aceitar entrega
  };

  const handleConfirmDelivery = () => {
    setShowDeliveryConfirm(false);
    // TODO: Implementar lógica de confirmar entrega
    // Remover cliente temporário da lista
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-0 right-1/4 w-96 h-96 bg-[#ff00ff] rounded-full blur-[120px] opacity-20"
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
          className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#00f0ff] rounded-full blur-[120px] opacity-20"
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

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Fixed Header with Online/Offline Toggle */}
        <div className="bg-[#12121a] border-b border-[#1f1f2e] px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-white font-bold text-2xl bg-gradient-to-r from-[#ff00ff] to-[#00f0ff] bg-clip-text text-transparent">
                Painel Motorista
              </h1>
              {isOnline && (
                <motion.div
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="flex items-center gap-2 px-3 py-1 bg-[#00ff41]/20 rounded-full"
                >
                  <div className="w-2 h-2 bg-[#00ff41] rounded-full" />
                  <span className="text-[#00ff41] text-sm font-medium">Disponível</span>
                </motion.div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <motion.button
                onClick={() => {
                  setIsOnline(!isOnline);
                  if (!isOnline) {
                    setTimeout(() => setShowNotification(true), 2000);
                  }
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                  isOnline
                    ? "bg-gradient-to-r from-[#00ff41] to-[#00f0ff] text-black shadow-[0_0_30px_rgba(0,255,65,0.5)]"
                    : "bg-[#1f1f2e] text-gray-400 hover:text-white"
                }`}
              >
                <Power className="w-5 h-5" />
                {isOnline ? "ONLINE" : "OFFLINE"}
              </motion.button>
              <motion.button
                onClick={() => navigate("/")}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#ff006e]/20 text-[#ff006e] hover:bg-[#ff006e]/30 transition-all font-semibold"
              >
                <LogOut className="w-5 h-5" />
                Sair
              </motion.button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-[#12121a] border-b border-[#1f1f2e] px-6">
          <div className="max-w-7xl mx-auto flex gap-2">
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex items-center gap-2 px-6 py-4 font-semibold transition-all ${
                activeTab === "chat"
                  ? "text-[#ff00ff] border-b-2 border-[#ff00ff]"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <MessageSquare className="w-5 h-5" />
              Chat
            </button>
            <button
              onClick={() => setActiveTab("relatorios")}
              className={`flex items-center gap-2 px-6 py-4 font-semibold transition-all ${
                activeTab === "relatorios"
                  ? "text-[#ff00ff] border-b-2 border-[#ff00ff]"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <FileText className="w-5 h-5" />
              Relatórios
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Chat Tab */}
            {activeTab === "chat" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-[calc(100vh-250px)]"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
                  {/* Lista de Contatos */}
                  <div className="bg-[#12121a] border border-[#1f1f2e] rounded-2xl p-4 overflow-y-auto">
                    <h3 className="text-white font-bold text-lg mb-4">Vendedor</h3>
                    {vendedor && (
                      <button
                        onClick={() => setSelectedChat("vendedor")}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all mb-6 ${
                          selectedChat === "vendedor"
                            ? "bg-[#ff00ff]/10 border border-[#ff00ff]"
                            : "hover:bg-[#1f1f2e]"
                        }`}
                      >
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white border-2 ${
                            vendedor.online
                              ? "border-[#00ff41] shadow-[0_0_20px_rgba(0,255,65,0.5)]"
                              : "border-gray-500"
                          }`}
                          style={{
                            background: "linear-gradient(135deg, #ff00ff 0%, #8b5cf6 100%)",
                          }}
                        >
                          {vendedor.foto}
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-white font-semibold">{vendedor.nome}</p>
                          <p className="text-gray-400 text-sm truncate">{vendedor.lastMessage}</p>
                        </div>
                      </button>
                    )}

                    <h3 className="text-white font-bold text-lg mb-4">Clientes (Temporário)</h3>
                    <div className="space-y-2">
                      {clientesTemporarios.map((cliente) => (
                        <div key={cliente.id} className="space-y-2">
                          <button
                            onClick={() => setSelectedChat(`cliente-${cliente.id}`)}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                              selectedChat === `cliente-${cliente.id}`
                                ? "bg-[#00f0ff]/10 border border-[#00f0ff]"
                                : "hover:bg-[#1f1f2e]"
                            }`}
                          >
                            <div
                              className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white border-2 border-[#00f0ff] shadow-[0_0_20px_rgba(0,240,255,0.5)]"
                              style={{
                                background: "linear-gradient(135deg, #00f0ff 0%, #00ff41 100%)",
                              }}
                            >
                              {cliente.foto}
                            </div>
                            <div className="flex-1 text-left">
                              <p className="text-white font-semibold">{cliente.nome}</p>
                              <p className="text-gray-400 text-sm truncate">{cliente.endereco}</p>
                            </div>
                          </button>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setShowDeliveryConfirm(true)}
                            className="w-full py-2 bg-gradient-to-r from-[#00ff41] to-[#00f0ff] text-black font-semibold rounded-lg flex items-center justify-center gap-2"
                          >
                            <Check className="w-4 h-4" />
                            Confirmar Entrega
                          </motion.button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Área de Chat */}
                  <div className="md:col-span-2 bg-[#12121a] border border-[#1f1f2e] rounded-2xl flex flex-col">
                    {selectedChat ? (
                      <>
                        {/* Header do Chat */}
                        <div className="flex items-center justify-between p-4 border-b border-[#1f1f2e]">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ff00ff] to-[#8b5cf6] flex items-center justify-center text-white font-bold">
                              {selectedChat === "vendedor" ? "LT" : "JS"}
                            </div>
                            <div>
                              <p className="text-white font-semibold">
                                {selectedChat === "vendedor" ? "Loja Tech Center" : "João Silva"}
                              </p>
                              <p className="text-[#00ff41] text-xs">Online</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button className="p-2 rounded-lg hover:bg-[#1f1f2e] text-[#ff00ff] transition-colors">
                              <Video className="w-5 h-5" />
                            </button>
                            <button className="p-2 rounded-lg hover:bg-[#1f1f2e] text-[#ff00ff] transition-colors">
                              <Phone className="w-5 h-5" />
                            </button>
                          </div>
                        </div>

                        {/* Mensagens */}
                        <div className="flex-1 p-4 overflow-y-auto space-y-4">
                          {selectedChat === "vendedor" ? (
                            <>
                              <div className="flex justify-start">
                                <div className="bg-[#1f1f2e] rounded-2xl rounded-tl-sm p-3 max-w-[70%]">
                                  <p className="text-white">
                                    Olá! Tem um novo pedido para entrega.
                                  </p>
                                  <p className="text-gray-500 text-xs mt-1">10:00</p>
                                </div>
                              </div>
                              <div className="flex justify-end">
                                <div className="bg-gradient-to-r from-[#ff00ff] to-[#8b5cf6] rounded-2xl rounded-tr-sm p-3 max-w-[70%]">
                                  <p className="text-white">Perfeito! Já estou a caminho.</p>
                                  <p className="text-white/70 text-xs mt-1">10:01</p>
                                </div>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex justify-start">
                                <div className="bg-[#1f1f2e] rounded-2xl rounded-tl-sm p-3 max-w-[70%]">
                                  <p className="text-white">Olá! Estou aguardando a entrega.</p>
                                  <p className="text-gray-500 text-xs mt-1">10:30</p>
                                </div>
                              </div>
                              <div className="flex justify-end">
                                <div className="bg-gradient-to-r from-[#ff00ff] to-[#8b5cf6] rounded-2xl rounded-tr-sm p-3 max-w-[70%]">
                                  <p className="text-white">
                                    Estou a 5 minutos do seu endereço!
                                  </p>
                                  <p className="text-white/70 text-xs mt-1">10:31</p>
                                </div>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Input de Mensagem */}
                        <div className="p-4 border-t border-[#1f1f2e]">
                          <div className="flex items-center gap-2">
                            <button className="p-2 rounded-lg hover:bg-[#1f1f2e] text-[#ff00ff] transition-colors">
                              <Camera className="w-5 h-5" />
                            </button>
                            <button className="p-2 rounded-lg hover:bg-[#1f1f2e] text-[#ff00ff] transition-colors">
                              <Image className="w-5 h-5" />
                            </button>
                            {selectedChat !== "vendedor" && (
                              <button className="p-2 rounded-lg hover:bg-[#1f1f2e] text-[#00f0ff] transition-colors">
                                <MapPin className="w-5 h-5" />
                              </button>
                            )}
                            <input
                              type="text"
                              value={message}
                              onChange={(e) => setMessage(e.target.value)}
                              placeholder="Digite sua mensagem..."
                              className="flex-1 px-4 py-2 bg-[#1f1f2e] border border-[#2a2a3e] rounded-xl text-white focus:outline-none focus:border-[#ff00ff]"
                            />
                            <button className="p-2 rounded-lg hover:bg-[#1f1f2e] text-[#ff00ff] transition-colors">
                              <Mic className="w-5 h-5" />
                            </button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="p-3 bg-gradient-to-r from-[#ff00ff] to-[#8b5cf6] rounded-xl text-white"
                            >
                              <Send className="w-5 h-5" />
                            </motion.button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 flex items-center justify-center text-gray-500">
                        Selecione um contato para iniciar uma conversa
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Relatórios Tab */}
            {activeTab === "relatorios" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <StatCard
                    title="Comissão Total"
                    value="R$ 0"
                    icon={<DollarSign className="w-6 h-6" />}
                    color="green"
                  />
                  <StatCard
                    title="Entregas Mês"
                    value="0"
                    icon={<Package className="w-6 h-6" />}
                    color="cyan"
                  />
                  <StatCard
                    title="A Receber"
                    value="R$ 0"
                    icon={<TrendingUp className="w-6 h-6" />}
                    color="pink"
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-[#12121a] border border-[#1f1f2e] rounded-2xl p-6">
                    <h3 className="text-white font-bold text-lg mb-6">Entregas da Semana</h3>
                    {deliveryData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={deliveryData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1f1f2e" />
                          <XAxis dataKey="name" stroke="#9ca3af" />
                          <YAxis stroke="#9ca3af" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#12121a",
                              border: "1px solid #1f1f2e",
                              borderRadius: "8px",
                            }}
                          />
                          <Bar key="entregas-bar-motorista" dataKey="entregas" fill="#ff00ff" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-gray-500">
                        Nenhum dado disponível
                      </div>
                    )}
                  </div>

                  <div className="bg-[#12121a] border border-[#1f1f2e] rounded-2xl p-6">
                    <h3 className="text-white font-bold text-lg mb-6">Comissões da Semana</h3>
                    {deliveryData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={deliveryData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1f1f2e" />
                          <XAxis dataKey="name" stroke="#9ca3af" />
                          <YAxis stroke="#9ca3af" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#12121a",
                              border: "1px solid #1f1f2e",
                              borderRadius: "8px",
                            }}
                          />
                          <Line
                            key="valor-line-motorista"
                            type="monotone"
                            dataKey="valor"
                            stroke="#00ff41"
                            strokeWidth={3}
                            dot={{ fill: "#00ff41", r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-gray-500">
                        Nenhum dado disponível
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-[#12121a] border border-[#1f1f2e] rounded-2xl p-6">
                  <h3 className="text-white font-bold text-lg mb-6">Histórico de Comissões</h3>
                  <div className="space-y-3">
                    {comissoes.map((item, i) => (
                      <div
                        key={i}
                        className="p-4 bg-[#1f1f2e] rounded-xl"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-white font-semibold">{item.data}</p>
                            <p className="text-gray-400 text-sm">{item.entregas} entregas</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {item.pago ? (
                              <span className="px-3 py-1 bg-[#00ff41]/20 text-[#00ff41] rounded-full text-sm font-medium">
                                Pago
                              </span>
                            ) : (
                              <span className="px-3 py-1 bg-[#ff00ff]/20 text-[#ff00ff] rounded-full text-sm font-medium">
                                Pendente
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-400">Taxa Fixa</p>
                            <p className="text-white font-semibold">
                              R$ {item.taxaFixa.toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400">% Vendas</p>
                            <p className="text-white font-semibold">
                              R$ {item.taxaPercentual.toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400">Total</p>
                            <p className="text-[#00ff41] font-bold text-lg">
                              R$ {item.total.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Notificação de Novo Pedido */}
      {showNotification && isOnline && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed top-4 right-4 z-50 bg-[#12121a] border border-[#00f0ff] rounded-2xl p-6 max-w-md shadow-[0_0_40px_rgba(0,240,255,0.5)]"
        >
          <div className="flex items-start gap-4">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="p-3 bg-[#00f0ff]/20 rounded-xl"
            >
              <Bell className="w-6 h-6 text-[#00f0ff]" />
            </motion.div>
            <div className="flex-1">
              <h4 className="text-white font-bold text-lg mb-2">Novo Pedido!</h4>
              <p className="text-gray-400 text-sm mb-1">Cliente: João Silva</p>
              <p className="text-gray-400 text-sm mb-1">Produto: Produto Premium</p>
              <p className="text-[#00ff41] font-bold mb-4">Comissão: R$ 18,00</p>
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAcceptDelivery}
                  className="flex-1 py-2 bg-gradient-to-r from-[#00ff41] to-[#00f0ff] text-black font-semibold rounded-lg"
                >
                  Aceitar
                </motion.button>
                <button
                  onClick={() => setShowNotification(false)}
                  className="px-4 py-2 bg-[#1f1f2e] text-gray-400 rounded-lg hover:text-white transition-colors"
                >
                  Recusar
                </button>
              </div>
            </div>
            <button
              onClick={() => setShowNotification(false)}
              className="p-1 hover:bg-[#1f1f2e] rounded-lg text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Modal de Confirmação de Entrega */}
      {showDeliveryConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#12121a] border border-[#1f1f2e] rounded-2xl p-8 max-w-md w-full"
          >
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00ff41] to-[#00f0ff] mb-4">
                <Check className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-white font-bold text-xl mb-2">Confirmar Entrega</h3>
              <p className="text-gray-400">
                Tem certeza que deseja confirmar a entrega deste pedido?
              </p>
            </div>

            <div className="bg-[#1f1f2e] rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">Cliente:</span>
                <span className="text-white font-semibold">João Silva</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">Produto:</span>
                <span className="text-white font-semibold">Produto Premium</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Sua Comissão:</span>
                <span className="text-[#00ff41] font-bold text-lg">R$ 18,00</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeliveryConfirm(false)}
                className="flex-1 py-3 bg-[#1f1f2e] text-gray-400 rounded-xl hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleConfirmDelivery}
                className="flex-1 py-3 bg-gradient-to-r from-[#00ff41] to-[#00f0ff] text-black font-bold rounded-xl"
              >
                Confirmar
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}