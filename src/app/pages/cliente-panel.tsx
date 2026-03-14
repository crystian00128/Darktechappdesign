import { useState } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router";
import {
  MessageSquare,
  Plus,
  ShoppingBag,
  Video,
  Phone,
  Mic,
  Send,
  Camera,
  Image,
  MapPin,
  QrCode,
  Check,
  Loader,
  Package,
  Truck,
  X,
  LogOut,
} from "lucide-react";

export function ClientePanel() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"chat" | "adicionar" | "pedidos">("chat");
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"waiting" | "success" | null>(null);

  const vendedores = [
    { id: "1", nome: "Loja Tech Center", online: true, lastMessage: "Produto enviado!", foto: "LT" },
    { id: "2", nome: "Express Market", online: false, lastMessage: "Obrigado!", foto: "EM" },
    { id: "3", nome: "Digital Store", online: true, lastMessage: "Disponível agora", foto: "DS" },
  ];

  const pedidos = [
    {
      id: "1",
      vendedor: "Loja Tech Center",
      produto: "Produto Premium",
      valor: 150.00,
      status: "motorista-aceito",
      motorista: "Carlos Moto",
    },
    {
      id: "2",
      vendedor: "Express Market",
      produto: "Produto Standard",
      valor: 89.90,
      status: "entregue",
    },
  ];

  const handlePayment = () => {
    setPaymentStatus("waiting");
    setTimeout(() => {
      setPaymentStatus("success");
      setTimeout(() => {
        setShowPaymentModal(false);
        setPaymentStatus(null);
      }, 2000);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
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

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <div className="bg-[#12121a] border-b border-[#1f1f2e] px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <h1 className="text-white font-bold text-2xl bg-gradient-to-r from-[#00f0ff] to-[#ff00ff] bg-clip-text text-transparent">
              Painel Cliente
            </h1>
            <motion.button
              onClick={() => navigate("/")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#ff006e]/20 text-[#ff006e] hover:bg-[#ff006e]/30 transition-all font-semibold"
            >
              <LogOut className="w-5 h-5" />
              Sair
            </motion.button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-[#12121a] border-b border-[#1f1f2e] px-6">
          <div className="max-w-7xl mx-auto flex gap-2">
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex items-center gap-2 px-6 py-4 font-semibold transition-all ${
                activeTab === "chat"
                  ? "text-[#00f0ff] border-b-2 border-[#00f0ff]"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <MessageSquare className="w-5 h-5" />
              Chat
            </button>
            <button
              onClick={() => setActiveTab("adicionar")}
              className={`flex items-center gap-2 px-6 py-4 font-semibold transition-all ${
                activeTab === "adicionar"
                  ? "text-[#00f0ff] border-b-2 border-[#00f0ff]"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Plus className="w-5 h-5" />
              Adicionar Vendedor
            </button>
            <button
              onClick={() => setActiveTab("pedidos")}
              className={`flex items-center gap-2 px-6 py-4 font-semibold transition-all ${
                activeTab === "pedidos"
                  ? "text-[#00f0ff] border-b-2 border-[#00f0ff]"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <ShoppingBag className="w-5 h-5" />
              Pedidos
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
                  {/* Lista de Vendedores */}
                  <div className="bg-[#12121a] border border-[#1f1f2e] rounded-2xl p-4 overflow-y-auto">
                    <h3 className="text-white font-bold text-lg mb-4">Meus Vendedores</h3>
                    <div className="space-y-2">
                      {vendedores.map((vendedor) => (
                        <button
                          key={vendedor.id}
                          onClick={() => setSelectedChat(vendedor.id)}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                            selectedChat === vendedor.id
                              ? "bg-[#00f0ff]/10 border border-[#00f0ff]"
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
                              background: "linear-gradient(135deg, #00f0ff 0%, #8b5cf6 100%)",
                            }}
                          >
                            {vendedor.foto}
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-white font-semibold">{vendedor.nome}</p>
                            <p className="text-gray-400 text-sm truncate">
                              {vendedor.lastMessage}
                            </p>
                          </div>
                          {vendedor.online && (
                            <motion.div
                              animate={{ opacity: [1, 0.3, 1] }}
                              transition={{ duration: 2, repeat: Infinity }}
                              className="w-2 h-2 bg-[#00ff41] rounded-full"
                            />
                          )}
                        </button>
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
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00f0ff] to-[#8b5cf6] flex items-center justify-center text-white font-bold">
                              LT
                            </div>
                            <div>
                              <p className="text-white font-semibold">Loja Tech Center</p>
                              <p className="text-[#00ff41] text-xs">Online</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button className="p-2 rounded-lg hover:bg-[#1f1f2e] text-[#00f0ff] transition-colors">
                              <Video className="w-5 h-5" />
                            </button>
                            <button className="p-2 rounded-lg hover:bg-[#1f1f2e] text-[#00f0ff] transition-colors">
                              <Phone className="w-5 h-5" />
                            </button>
                          </div>
                        </div>

                        {/* Mensagens */}
                        <div className="flex-1 p-4 overflow-y-auto space-y-4">
                          <div className="flex justify-start">
                            <div className="bg-[#1f1f2e] rounded-2xl rounded-tl-sm p-3 max-w-[70%]">
                              <p className="text-white">Olá! Temos novos produtos disponíveis.</p>
                              <p className="text-gray-500 text-xs mt-1">10:30</p>
                            </div>
                          </div>
                          <div className="flex justify-end">
                            <div className="bg-gradient-to-r from-[#00f0ff] to-[#8b5cf6] rounded-2xl rounded-tr-sm p-3 max-w-[70%]">
                              <p className="text-white">Interessante! Pode me mostrar?</p>
                              <p className="text-white/70 text-xs mt-1">10:31</p>
                            </div>
                          </div>

                          {/* Produto Enviado pelo Vendedor */}
                          <div className="flex justify-start">
                            <div className="bg-[#1f1f2e] rounded-2xl rounded-tl-sm p-4 max-w-[70%]">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="w-16 h-16 bg-gradient-to-br from-[#00f0ff]/20 to-[#8b5cf6]/20 rounded-lg flex items-center justify-center">
                                  <Package className="w-8 h-8 text-[#00f0ff]" />
                                </div>
                                <div>
                                  <p className="text-white font-semibold">Produto Premium</p>
                                  <p className="text-[#00ff41] font-bold text-lg">R$ 150,00</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button className="p-2 bg-[#12121a] rounded-lg text-white">-</button>
                                <input
                                  type="number"
                                  defaultValue="1"
                                  className="w-16 px-2 py-1 bg-[#12121a] border border-[#2a2a3e] rounded-lg text-white text-center"
                                />
                                <button className="p-2 bg-[#12121a] rounded-lg text-white">
                                  <Plus className="w-4 h-4" />
                                </button>
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => setShowPaymentModal(true)}
                                  className="flex-1 py-2 bg-gradient-to-r from-[#00f0ff] to-[#8b5cf6] rounded-lg text-white font-semibold"
                                >
                                  Pagar R$ 150,00
                                </motion.button>
                              </div>
                              <p className="text-gray-500 text-xs mt-2">10:32</p>
                            </div>
                          </div>
                        </div>

                        {/* Input de Mensagem */}
                        <div className="p-4 border-t border-[#1f1f2e]">
                          <div className="flex items-center gap-2">
                            <button className="p-2 rounded-lg hover:bg-[#1f1f2e] text-[#00f0ff] transition-colors">
                              <Camera className="w-5 h-5" />
                            </button>
                            <button className="p-2 rounded-lg hover:bg-[#1f1f2e] text-[#00f0ff] transition-colors">
                              <Image className="w-5 h-5" />
                            </button>
                            <button className="p-2 rounded-lg hover:bg-[#1f1f2e] text-[#ff00ff] transition-colors">
                              <MapPin className="w-5 h-5" />
                            </button>
                            <input
                              type="text"
                              value={message}
                              onChange={(e) => setMessage(e.target.value)}
                              placeholder="Digite sua mensagem..."
                              className="flex-1 px-4 py-2 bg-[#1f1f2e] border border-[#2a2a3e] rounded-xl text-white focus:outline-none focus:border-[#00f0ff]"
                            />
                            <button className="p-2 rounded-lg hover:bg-[#1f1f2e] text-[#00f0ff] transition-colors">
                              <Mic className="w-5 h-5" />
                            </button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="p-3 bg-gradient-to-r from-[#00f0ff] to-[#8b5cf6] rounded-xl text-white"
                            >
                              <Send className="w-5 h-5" />
                            </motion.button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 flex items-center justify-center text-gray-500">
                        Selecione um vendedor para iniciar uma conversa
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Adicionar Vendedor Tab */}
            {activeTab === "adicionar" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="max-w-2xl mx-auto"
              >
                <div className="bg-[#12121a] border border-[#1f1f2e] rounded-2xl p-8">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00f0ff] to-[#8b5cf6] mb-4">
                      <Plus className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-white font-bold text-2xl mb-2">Adicionar Novo Vendedor</h2>
                    <p className="text-gray-400">
                      Insira o código de convite fornecido pelo vendedor
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Código de Convite
                      </label>
                      <input
                        type="text"
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                        className="w-full px-4 py-3 bg-[#1f1f2e] border border-[#2a2a3e] rounded-xl text-white text-center text-2xl font-mono tracking-widest focus:outline-none focus:border-[#00f0ff] focus:ring-2 focus:ring-[#00f0ff]/20 transition-all"
                        placeholder="XXXX-XXXX"
                        maxLength={9}
                      />
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full py-4 bg-gradient-to-r from-[#00f0ff] to-[#8b5cf6] text-white font-bold rounded-xl shadow-[0_0_30px_rgba(0,240,255,0.3)] hover:shadow-[0_0_40px_rgba(0,240,255,0.5)] transition-all"
                    >
                      Adicionar Vendedor
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Pedidos Tab */}
            {activeTab === "pedidos" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <h2 className="text-white font-bold text-2xl">Meus Pedidos</h2>
                <div className="space-y-4">
                  {pedidos.map((pedido) => (
                    <div
                      key={pedido.id}
                      className="bg-[#12121a] border border-[#1f1f2e] rounded-2xl p-6"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-white font-bold text-lg">{pedido.produto}</h3>
                          <p className="text-gray-400">{pedido.vendedor}</p>
                        </div>
                        <p className="text-[#00ff41] font-bold text-xl">
                          R$ {pedido.valor.toFixed(2)}
                        </p>
                      </div>

                      {/* Status do Pedido */}
                      <div className="space-y-3">
                        {pedido.status === "motorista-aceito" && (
                          <>
                            <motion.div
                              initial={{ scale: 0.9 }}
                              animate={{ scale: 1 }}
                              className="flex items-center gap-3 p-4 bg-[#00ff41]/10 border border-[#00ff41] rounded-xl"
                            >
                              <Check className="w-6 h-6 text-[#00ff41]" />
                              <div className="flex-1">
                                <p className="text-[#00ff41] font-semibold">
                                  Parabéns! Recebemos seu pagamento
                                </p>
                                <p className="text-gray-400 text-sm">Pedido confirmado</p>
                              </div>
                            </motion.div>

                            <motion.div
                              initial={{ scale: 0.9 }}
                              animate={{ scale: 1 }}
                              className="flex items-center gap-3 p-4 bg-[#00f0ff]/10 border border-[#00f0ff] rounded-xl"
                            >
                              <Truck className="w-6 h-6 text-[#00f0ff]" />
                              <div className="flex-1">
                                <p className="text-[#00f0ff] font-semibold">
                                  Motorista aceitou seu pedido
                                </p>
                                <p className="text-gray-400 text-sm">{pedido.motorista}</p>
                              </div>
                            </motion.div>

                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className="w-full py-3 bg-gradient-to-r from-[#00f0ff] to-[#8b5cf6] text-white font-semibold rounded-xl flex items-center justify-center gap-2"
                            >
                              <MessageSquare className="w-5 h-5" />
                              Chat com Motorista
                            </motion.button>
                          </>
                        )}

                        {pedido.status === "entregue" && (
                          <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            className="flex items-center gap-3 p-4 bg-[#8b5cf6]/10 border border-[#8b5cf6] rounded-xl"
                          >
                            <Check className="w-6 h-6 text-[#8b5cf6]" />
                            <div>
                              <p className="text-[#8b5cf6] font-semibold">Pedido Entregue</p>
                              <p className="text-gray-400 text-sm">Obrigado pela preferência!</p>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Pagamento PIX */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#12121a] border border-[#1f1f2e] rounded-2xl p-8 max-w-md w-full"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white font-bold text-xl">Pagamento PIX</h3>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setPaymentStatus(null);
                }}
                className="p-2 hover:bg-[#1f1f2e] rounded-lg text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!paymentStatus && (
              <div className="text-center space-y-6">
                <div className="w-64 h-64 mx-auto bg-white rounded-2xl p-4 flex items-center justify-center">
                  <QrCode className="w-full h-full text-black" />
                </div>
                <div>
                  <p className="text-white font-bold text-2xl mb-2">R$ 150,00</p>
                  <p className="text-gray-400 text-sm">Escaneie o QR Code para pagar</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handlePayment}
                  className="w-full py-4 bg-gradient-to-r from-[#00f0ff] to-[#8b5cf6] text-white font-bold rounded-xl"
                >
                  Simular Pagamento
                </motion.button>
              </div>
            )}

            {paymentStatus === "waiting" && (
              <div className="text-center py-8">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="inline-block mb-4"
                >
                  <Loader className="w-16 h-16 text-[#00f0ff]" />
                </motion.div>
                <p className="text-white font-semibold text-lg">Aguardando Pagamento...</p>
                <p className="text-gray-400 text-sm mt-2">Confirme o pagamento no seu app</p>
              </div>
            )}

            {paymentStatus === "success" && (
              <div className="text-center py-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#00ff41]/20 mb-4"
                >
                  <Check className="w-10 h-10 text-[#00ff41]" />
                </motion.div>
                <p className="text-[#00ff41] font-bold text-xl">Pagamento Efetuado com Sucesso!</p>
                <p className="text-gray-400 text-sm mt-2">R$ 150,00</p>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}