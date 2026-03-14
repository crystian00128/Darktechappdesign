import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { SidebarLayout } from "../components/sidebar-layout";
import { motion, AnimatePresence } from "motion/react";
import * as api from "../services/api";
import { StatCard } from "../components/stat-card";
import {
  LayoutDashboard,
  MessageSquare,
  Package,
  FileText,
  Ticket,
  Wallet,
  Truck,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Copy,
  Check,
  Power,
  Video,
  Phone,
  Mic,
  Paperclip,
  Send,
  Camera,
  Image,
  Plus,
  X,
  Users,
} from "lucide-react";
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
  PieChart,
  Pie,
  Cell,
} from "recharts";

export function VendedorPanel() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isOnline, setIsOnline] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [showProductModal, setShowProductModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
  });
  const [generatedCodesCliente, setGeneratedCodesCliente] = useState<Array<{
    code: string;
    type: string;
    used: boolean;
    generatedAt: string;
  }>>([]);
  const [generatedCodesMotorista, setGeneratedCodesMotorista] = useState<Array<{
    code: string;
    type: string;
    used: boolean;
    generatedAt: string;
  }>>([]);

  // DADOS REAIS DO BANCO
  const [clientes, setClientes] = useState<any[]>([]);
  const [motoristas, setMotoristas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Dados vazios (por enquanto)
  const produtos: any[] = [];
  const salesData: any[] = [];
  const pieData: any[] = [];

  const COLORS = ["#ff00ff", "#00f0ff", "#00ff41"];

  // Carregar dados ao montar componente
  useEffect(() => {
    loadMyUsers();
  }, []);

  const loadMyUsers = async () => {
    try {
      setLoading(true);
      const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
      console.log("📥 Carregando usuários criados por:", currentUser.username);
      
      const response = await api.getUsersCreatedBy(currentUser.username);
      console.log("✅ Usuários carregados:", response.users);
      
      if (response.success) {
        const users = response.users || [];
        setClientes(users.filter((u: any) => u.role === "cliente"));
        setMotoristas(users.filter((u: any) => u.role === "motorista"));
      }
    } catch (error: any) {
      console.error("❌ Erro ao carregar usuários:", error);
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    { icon: <LayoutDashboard className="w-5 h-5" />, label: "Dashboard", id: "dashboard" },
    { icon: <MessageSquare className="w-5 h-5" />, label: "Chat", id: "chat" },
    { icon: <Package className="w-5 h-5" />, label: "Produtos", id: "produtos" },
    { icon: <FileText className="w-5 h-5" />, label: "Relatórios", id: "relatorios" },
    { icon: <Ticket className="w-5 h-5" />, label: "Códigos de Convite", id: "convite" },
    { icon: <Wallet className="w-5 h-5" />, label: "Recebimentos", id: "recebimentos" },
    { icon: <Truck className="w-5 h-5" />, label: "Taxa Motorista", id: "taxa-motorista" },
  ];

  // Função para gerar código via API
  const handleGenerateCode = async (type: "cliente" | "motorista") => {
    try {
      const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
      console.log("🎫 Gerando código via API...", { type, generatedBy: currentUser.username });
      
      const response = await api.generateInviteCode(type, currentUser.username);
      console.log("✅ Código gerado:", response);
      
      if (response.success) {
        const newCode = response.code;
        copyToClipboard(newCode.code);
        
        if (type === "cliente") {
          setGeneratedCodesCliente([
            ...generatedCodesCliente,
            { code: newCode.code, type: "cliente", used: false, generatedAt: new Date().toLocaleDateString() },
          ]);
        } else {
          setGeneratedCodesMotorista([
            ...generatedCodesMotorista,
            { code: newCode.code, type: "motorista", used: false, generatedAt: new Date().toLocaleDateString() },
          ]);
        }
      }
    } catch (error: any) {
      console.error("❌ Erro ao gerar código:", error);
      alert("Erro ao gerar código: " + error.message);
    }
  };

  const copyToClipboard = (text: string) => {
    // Usar método fallback que funciona em todos os ambientes
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      const successful = document.execCommand('copy');
      if (successful) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
    
    document.body.removeChild(textArea);
  };

  const handleAddProduct = () => {
    // TODO: Implementar adição de produto
    setShowProductModal(false);
    setNewProduct({ name: "", description: "", price: "" });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Online/Offline Toggle - Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#12121a] border-b border-[#1f1f2e] px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <h1 className="text-white font-bold text-xl">Painel Vendedor</h1>
            {isOnline && (
              <motion.div
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="flex items-center gap-2 px-3 py-1 bg-[#00ff41]/20 rounded-full"
              >
                <div className="w-2 h-2 bg-[#00ff41] rounded-full" />
                <span className="text-[#00ff41] text-sm font-medium">Loja Aberta</span>
              </motion.div>
            )}
          </div>
          <motion.button
            onClick={() => setIsOnline(!isOnline)}
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
        </div>
      </div>

      <div className="pt-20">
        <SidebarLayout
          menuItems={menuItems}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          title="Vendedor"
        >
          {/* Dashboard */}
          {activeTab === "dashboard" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="Vendas Hoje"
                  value="R$ 0"
                  icon={<DollarSign className="w-6 h-6" />}
                  color="cyan"
                  trend={{ value: 0, isPositive: true }}
                />
                <StatCard
                  title="Total Mês"
                  value="R$ 0"
                  icon={<ShoppingBag className="w-6 h-6" />}
                  color="green"
                  trend={{ value: 0, isPositive: true }}
                />
                <StatCard
                  title="Clientes"
                  value={String(clientes.length)}
                  icon={<Users className="w-6 h-6" />}
                  color="purple"
                  trend={{ value: 0, isPositive: true }}
                />
                <StatCard
                  title="Motoristas"
                  value={String(motoristas.length)}
                  icon={<Truck className="w-6 h-6" />}
                  color="pink"
                  trend={{ value: 0, isPositive: true }}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#12121a] border border-[#1f1f2e] rounded-2xl p-6">
                  <h3 className="text-white font-bold text-lg mb-6">Vendas da Semana</h3>
                  {salesData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={salesData}>
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
                        <Bar key="vendas-bar-vendedor" dataKey="vendas" fill="#00f0ff" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-gray-500">
                      Nenhum dado disponível
                    </div>
                  )}
                </div>

                <div className="bg-[#12121a] border border-[#1f1f2e] rounded-2xl p-6">
                  <h3 className="text-white font-bold text-lg mb-6">Distribuição de Valores</h3>
                  {pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) =>
                            `${name} ${(percent * 100).toFixed(0)}%`
                          }
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-gray-500">
                      Nenhum dado disponível
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Chat */}
          {activeTab === "chat" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-[calc(100vh-200px)]"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
                {/* Lista de Contatos */}
                <div className="bg-[#12121a] border border-[#1f1f2e] rounded-2xl p-4 overflow-y-auto">
                  <h3 className="text-white font-bold text-lg mb-4">Clientes</h3>
                  <div className="space-y-2 mb-6">
                    {clientes.length > 0 ? (
                      clientes.map((cliente) => (
                        <button
                          key={cliente.username || cliente.id}
                          onClick={() => setSelectedChat(cliente.username)}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                            selectedChat === cliente.username
                              ? "bg-[#00f0ff]/10 border border-[#00f0ff]"
                              : "hover:bg-[#1f1f2e]"
                          }`}
                        >
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white border-2 border-gray-500"
                            style={{
                              background: "linear-gradient(135deg, #00f0ff 0%, #8b5cf6 100%)",
                            }}
                          >
                            {cliente.photo || (cliente.name ? cliente.name.charAt(0).toUpperCase() : "C")}
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-white font-semibold">{cliente.name || "Cliente"}</p>
                            <p className="text-gray-400 text-sm truncate">@{cliente.username || "unknown"}</p>
                          </div>
                        </button>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm text-center py-4">
                        Nenhum cliente cadastrado
                      </p>
                    )}
                  </div>

                  <h3 className="text-white font-bold text-lg mb-4">Motoristas</h3>
                  <div className="space-y-2">
                    {motoristas.length > 0 ? (
                      motoristas.map((motorista) => (
                        <button
                          key={motorista.username || motorista.id}
                          onClick={() => setSelectedChat(motorista.username)}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                            selectedChat === motorista.username
                              ? "bg-[#00f0ff]/10 border border-[#00f0ff]"
                              : "hover:bg-[#1f1f2e]"
                          }`}
                        >
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white border-2 border-gray-500"
                            style={{
                              background: "linear-gradient(135deg, #ff00ff 0%, #8b5cf6 100%)",
                            }}
                          >
                            {motorista.photo || (motorista.name ? motorista.name.charAt(0).toUpperCase() : "M")}
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-white font-semibold">{motorista.name || "Motorista"}</p>
                            <p className="text-gray-400 text-sm truncate">@{motorista.username || "unknown"}</p>
                          </div>
                        </button>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm text-center py-4">
                        Nenhum motorista cadastrado
                      </p>
                    )}
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
                            JS
                          </div>
                          <div>
                            <p className="text-white font-semibold">João Silva</p>
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
                            <p className="text-white">Olá! Gostaria de ver os produtos.</p>
                            <p className="text-gray-500 text-xs mt-1">10:30</p>
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <div className="bg-gradient-to-r from-[#00f0ff] to-[#8b5cf6] rounded-2xl rounded-tr-sm p-3 max-w-[70%]">
                            <p className="text-white">Claro! Vou enviar agora.</p>
                            <p className="text-white/70 text-xs mt-1">10:31</p>
                          </div>
                        </div>
                      </div>

                      {/* Input de Mensagem */}
                      <div className="p-4 border-t border-[#1f1f2e]">
                        <div className="flex items-center gap-2">
                          <button className="p-2 rounded-lg hover:bg-[#1f1f2e] text-[#00f0ff] transition-colors">
                            <Paperclip className="w-5 h-5" />
                          </button>
                          <button className="p-2 rounded-lg hover:bg-[#1f1f2e] text-[#00f0ff] transition-colors">
                            <Camera className="w-5 h-5" />
                          </button>
                          <button className="p-2 rounded-lg hover:bg-[#1f1f2e] text-[#00f0ff] transition-colors">
                            <Image className="w-5 h-5" />
                          </button>
                          <button className="p-2 rounded-lg hover:bg-[#1f1f2e] text-[#ff00ff] transition-colors">
                            <Package className="w-5 h-5" />
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
                      Selecione um contato para iniciar uma conversa
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Produtos */}
          {activeTab === "produtos" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-white font-bold text-2xl">Meus Produtos</h2>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowProductModal(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#00f0ff] to-[#8b5cf6] text-white font-semibold rounded-xl shadow-[0_0_30px_rgba(0,240,255,0.3)]"
                >
                  <Plus className="w-5 h-5" />
                  Novo Produto
                </motion.button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {produtos.map((produto) => (
                  <div
                    key={produto.id}
                    className="bg-[#12121a] border border-[#1f1f2e] rounded-2xl p-6 hover:border-[#00f0ff] transition-all"
                  >
                    <div className="w-full h-40 bg-gradient-to-br from-[#00f0ff]/20 to-[#8b5cf6]/20 rounded-xl mb-4 flex items-center justify-center">
                      <Package className="w-16 h-16 text-[#00f0ff]" />
                    </div>
                    <h3 className="text-white font-bold text-lg mb-2">{produto.nome}</h3>
                    <p className="text-gray-400 text-sm mb-4">{produto.descricao}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-[#00ff41] font-bold text-2xl">
                        R$ {produto.preco.toFixed(2)}
                      </p>
                      <button className="px-4 py-2 bg-[#1f1f2e] text-[#00f0ff] rounded-lg hover:bg-[#00f0ff]/10 transition-colors">
                        Editar
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Modal de Novo Produto */}
              {showProductModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-[#12121a] border border-[#1f1f2e] rounded-2xl p-8 max-w-md w-full"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-white font-bold text-xl">Novo Produto</h3>
                      <button
                        onClick={() => setShowProductModal(false)}
                        className="p-2 hover:bg-[#1f1f2e] rounded-lg text-gray-400 hover:text-white transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Nome do Produto
                        </label>
                        <input
                          type="text"
                          value={newProduct.name}
                          onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                          className="w-full px-4 py-3 bg-[#1f1f2e] border border-[#2a2a3e] rounded-xl text-white focus:outline-none focus:border-[#00f0ff]"
                          placeholder="Ex: Produto Premium"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Descrição
                        </label>
                        <textarea
                          value={newProduct.description}
                          onChange={(e) =>
                            setNewProduct({ ...newProduct, description: e.target.value })
                          }
                          className="w-full px-4 py-3 bg-[#1f1f2e] border border-[#2a2a3e] rounded-xl text-white focus:outline-none focus:border-[#00f0ff] resize-none"
                          rows={3}
                          placeholder="Descrição detalhada do produto"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Valor (R$)
                        </label>
                        <input
                          type="number"
                          value={newProduct.price}
                          onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                          className="w-full px-4 py-3 bg-[#1f1f2e] border border-[#2a2a3e] rounded-xl text-white focus:outline-none focus:border-[#00f0ff]"
                          placeholder="0,00"
                          step="0.01"
                        />
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleAddProduct}
                        className="w-full py-4 bg-gradient-to-r from-[#00f0ff] to-[#8b5cf6] text-white font-bold rounded-xl shadow-[0_0_30px_rgba(0,240,255,0.3)]"
                      >
                        Adicionar Produto
                      </motion.button>
                    </div>
                  </motion.div>
                </div>
              )}
            </motion.div>
          )}

          {/* Relatórios */}
          {activeTab === "relatorios" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard
                  title="Valor Total"
                  value="R$ 48,200"
                  icon={<DollarSign className="w-6 h-6" />}
                  color="cyan"
                />
                <StatCard
                  title="Taxa Admin"
                  value="R$ 7,230"
                  icon={<TrendingUp className="w-6 h-6" />}
                  color="pink"
                />
                <StatCard
                  title="Taxa Motorista"
                  value="R$ 3,860"
                  icon={<Truck className="w-6 h-6" />}
                  color="purple"
                />
                <StatCard
                  title="Valor Líquido"
                  value="R$ 37,110"
                  icon={<Wallet className="w-6 h-6" />}
                  color="green"
                />
              </div>

              <div className="bg-[#12121a] border border-[#1f1f2e] rounded-2xl p-6">
                <h3 className="text-white font-bold text-lg mb-6">Histórico de Vendas</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={salesData}>
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
                      key="vendas-line-vendedor"
                      type="monotone"
                      dataKey="vendas"
                      stroke="#00f0ff"
                      strokeWidth={3}
                      dot={{ fill: "#00f0ff", r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {/* Códigos de Convite */}
          {activeTab === "convite" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#12121a] border border-[#1f1f2e] rounded-2xl p-8">
                  <h2 className="text-white font-bold text-xl mb-6">Código para Cliente</h2>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleGenerateCode("cliente")}
                    className="w-full py-4 bg-gradient-to-r from-[#00f0ff] to-[#8b5cf6] text-white font-bold rounded-xl shadow-[0_0_30px_rgba(0,240,255,0.3)] flex items-center justify-center gap-2"
                  >
                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    Gerar Código Cliente
                  </motion.button>
                </div>

                <div className="bg-[#12121a] border border-[#1f1f2e] rounded-2xl p-8">
                  <h2 className="text-white font-bold text-xl mb-6">Código para Motorista</h2>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleGenerateCode("motorista")}
                    className="w-full py-4 bg-gradient-to-r from-[#ff00ff] to-[#8b5cf6] text-white font-bold rounded-xl shadow-[0_0_30px_rgba(255,0,255,0.3)] flex items-center justify-center gap-2"
                  >
                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    Gerar Código Motorista
                  </motion.button>
                </div>
              </div>

              <div className="bg-[#12121a] border border-[#1f1f2e] rounded-2xl p-6">
                <h3 className="text-white font-bold text-lg mb-4">Códigos Gerados</h3>
                <div className="space-y-3">
                  {[
                    ...generatedCodesCliente,
                    ...generatedCodesMotorista,
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-4 bg-[#1f1f2e] rounded-xl"
                    >
                      <div>
                        <p className="text-white font-semibold">{item.type === "cliente" ? "Código Cliente" : "Código Motorista"}</p>
                        <p className="text-gray-400 text-sm">{item.generatedAt}</p>
                      </div>
                      <p className="text-[#00ff41] font-bold text-lg">
                        {item.code}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Recebimentos */}
          {activeTab === "recebimentos" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="bg-[#12121a] border border-[#1f1f2e] rounded-2xl p-8">
                <h2 className="text-white font-bold text-xl mb-6">Endereço de Recebimento</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Endereço da Carteira DEPIX
                    </label>
                    <input
                      type="text"
                      placeholder="0x..."
                      className="w-full px-4 py-3 bg-[#1f1f2e] border border-[#2a2a3e] rounded-xl text-white focus:outline-none focus:border-[#00f0ff]"
                    />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-4 bg-gradient-to-r from-[#00f0ff] to-[#8b5cf6] text-white font-bold rounded-xl"
                  >
                    Salvar Endereço
                  </motion.button>
                </div>
              </div>

              <div className="bg-[#12121a] border border-[#1f1f2e] rounded-2xl p-6">
                <h3 className="text-white font-bold text-lg mb-4">Histórico de Recebimentos</h3>
                <div className="space-y-3">
                  {[
                    { valor: 15000, data: "10/03/2026" },
                    { valor: 12500, data: "03/03/2026" },
                    { valor: 18200, data: "25/02/2026" },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-4 bg-[#1f1f2e] rounded-xl"
                    >
                      <div>
                        <p className="text-white font-semibold">Recebimento Admin</p>
                        <p className="text-gray-400 text-sm">{item.data}</p>
                      </div>
                      <p className="text-[#00ff41] font-bold text-lg">
                        R$ {item.valor.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Taxa Motorista */}
          {activeTab === "taxa-motorista" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="bg-[#12121a] border border-[#1f1f2e] rounded-2xl p-6">
                <h2 className="text-white font-bold text-xl mb-6">Configuração de Comissões</h2>
                {motoristas.length > 0 ? (
                  <div className="space-y-4">
                    {motoristas.map((motorista) => (
                      <div
                        key={motorista.username}
                        className="p-5 bg-[#1f1f2e] rounded-xl space-y-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#ff00ff] to-[#8b5cf6] flex items-center justify-center text-white font-bold">
                            {motorista.photo}
                          </div>
                          <div>
                            <h3 className="text-white font-semibold">{motorista.name}</h3>
                            <p className="text-gray-400 text-sm">@{motorista.username}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Taxa Fixa por Entrega (R$)
                            </label>
                            <input
                              type="number"
                              defaultValue="5.00"
                              step="0.01"
                              className="w-full px-4 py-2 bg-[#12121a] border border-[#2a2a3e] rounded-lg text-white focus:outline-none focus:border-[#00f0ff]"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Porcentagem da Venda (%)
                            </label>
                            <input
                              type="number"
                              defaultValue="8"
                              min="0"
                              max="100"
                              className="w-full px-4 py-2 bg-[#12121a] border border-[#2a2a3e] rounded-lg text-white focus:outline-none focus:border-[#00f0ff]"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    Nenhum motorista cadastrado
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </SidebarLayout>
      </div>
    </div>
  );
}