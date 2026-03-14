import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { SidebarLayout } from "../components/sidebar-layout";
import { StatCard } from "../components/stat-card";
import {
  LayoutDashboard,
  Users,
  Ticket,
  Percent,
  Shield,
  Key,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  LogOut,
} from "lucide-react";
import { motion } from "motion/react";
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
import * as api from "../services/api";

export function AdminPanel() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [copied, setCopied] = useState(false);
  const [expandedVendor, setExpandedVendor] = useState<string | null>(null);
  const [generatedCodes, setGeneratedCodes] = useState<Array<{
    code: string;
    type: string;
    used: boolean;
    generatedAt: string;
  }>>([]);
  const [loading, setLoading] = useState(false);
  const [vendedores, setVendedores] = useState<any[]>([]);
  const [salesData] = useState<any[]>([]);

  // Helper para renderizar avatar com segurança
  const renderAvatar = (user: any) => {
    if (user?.photo) return user.photo;
    if (user?.name && typeof user.name === 'string' && user.name.length > 0) {
      return user.name.charAt(0).toUpperCase();
    }
    return "V";
  };

  // Carregar vendedores ao montar componente
  useEffect(() => {
    loadVendedores();
  }, []);

  const loadVendedores = async () => {
    try {
      console.log("📥 Carregando vendedores...");
      const response = await api.getUsers("vendedor");
      console.log("✅ Vendedores carregados:", response.users);
      setVendedores(response.users || []);
    } catch (error: any) {
      console.error("❌ Erro ao carregar vendedores:", error);
    }
  };

  const menuItems = [
    { icon: <LayoutDashboard className="w-5 h-5" />, label: "Dashboard", id: "dashboard" },
    { icon: <Users className="w-5 h-5" />, label: "Usuários", id: "usuarios" },
    { icon: <Ticket className="w-5 h-5" />, label: "Código de Convite", id: "convite" },
    { icon: <Percent className="w-5 h-5" />, label: "Taxa Admin", id: "taxa" },
    { icon: <Shield className="w-5 h-5" />, label: "Segurança", id: "seguranca" },
    { icon: <Key className="w-5 h-5" />, label: "API", id: "api" },
    { icon: <TrendingUp className="w-5 h-5" />, label: "Faturamento", id: "faturamento" },
    { icon: <LogOut className="w-5 h-5" />, label: "Sair", id: "sair" },
  ];

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

  const fallbackCopyToClipboard = (text: string) => {
    // Método removido - não é mais necessário
    copyToClipboard(text);
  };

  useEffect(() => {
    const fetchCodes = async () => {
      try {
        const response = await api.getInviteCodes("vendedor");
        if (response.success) {
          setGeneratedCodes(response.codes.map((code: any) => ({
            code: code.code,
            type: code.type,
            used: code.used,
            generatedAt: new Date(code.generatedAt).toLocaleDateString(),
          })));
        }
      } catch (error) {
        console.error("Erro ao buscar códigos:", error);
      }
    };

    if (activeTab === "convite") {
      fetchCodes();
    }
  }, [activeTab]);

  const handleGenerateCode = async () => {
    setLoading(true);
    try {
      const response = await api.generateInviteCode("vendedor", "admin");
      
      if (response.success) {
        const newCode = response.code;
        copyToClipboard(newCode.code);
        
        // Adicionar à lista
        setGeneratedCodes([
          {
            code: newCode.code,
            type: newCode.type,
            used: newCode.used,
            generatedAt: new Date(newCode.generatedAt).toLocaleDateString(),
          },
          ...generatedCodes,
        ]);
      }
    } catch (error) {
      console.error("Erro ao gerar código:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    // Limpar localStorage e redirecionar para login
    localStorage.removeItem("currentUser");
    navigate("/");
  };

  return (
    <SidebarLayout
      menuItems={menuItems}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      title="Painel Admin"
    >
      {/* Dashboard */}
      {activeTab === "dashboard" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-8"
        >
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Vendedores"
              value="0"
              icon={<Users className="w-6 h-6" />}
              color="cyan"
              trend={{ value: 0, isPositive: true }}
            />
            <StatCard
              title="Faturamento Total"
              value="R$ 0"
              icon={<DollarSign className="w-6 h-6" />}
              color="green"
              trend={{ value: 0, isPositive: true }}
            />
            <StatCard
              title="Vendas Hoje"
              value="0"
              icon={<ShoppingBag className="w-6 h-6" />}
              color="purple"
              trend={{ value: 0, isPositive: true }}
            />
            <StatCard
              title="Taxa Recebida"
              value="R$ 0"
              icon={<TrendingUp className="w-6 h-6" />}
              color="pink"
              trend={{ value: 0, isPositive: true }}
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#12121a] border border-[#1f1f2e] rounded-2xl p-6">
              <h3 className="text-white font-bold text-lg mb-6">Vendas Mensais</h3>
              {salesData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
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
                      key="vendas-line"
                      type="monotone"
                      dataKey="vendas"
                      stroke="#00f0ff"
                      strokeWidth={3}
                      dot={{ fill: "#00f0ff", r: 5 }}
                    />
                    <Line
                      key="admin-line"
                      type="monotone"
                      dataKey="admin"
                      stroke="#8b5cf6"
                      strokeWidth={3}
                      dot={{ fill: "#8b5cf6", r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  Nenhum dado disponível
                </div>
              )}
            </div>

            <div className="bg-[#12121a] border border-[#1f1f2e] rounded-2xl p-6">
              <h3 className="text-white font-bold text-lg mb-6">Comparativo de Vendedores</h3>
              {vendedores.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={vendedores}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f1f2e" />
                    <XAxis dataKey="nome" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#12121a",
                        border: "1px solid #1f1f2e",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar key="vendas-bar-admin" dataKey="vendas" fill="#00f0ff" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  Nenhum vendedor cadastrado
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Usuários */}
      {activeTab === "usuarios" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          <div className="bg-[#12121a] border border-[#1f1f2e] rounded-2xl p-6">
            <h2 className="text-white font-bold text-xl mb-6">Hierarquia de Vendedores</h2>
            <div className="space-y-4">
              {vendedores.map((vendedor) => (
                <div key={vendedor.id} className="border border-[#1f1f2e] rounded-xl overflow-hidden">
                  <button
                    onClick={() =>
                      setExpandedVendor(expandedVendor === vendedor.id ? null : vendedor.id)
                    }
                    className="w-full flex items-center justify-between p-4 hover:bg-[#1f1f2e]/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00f0ff] to-[#8b5cf6] flex items-center justify-center">
                        <span className="text-white font-bold">
                          {renderAvatar(vendedor)}
                        </span>
                      </div>
                      <div className="text-left">
                        <h3 className="text-white font-semibold">{vendedor.nome || vendedor.name || "Vendedor"}</h3>
                        <p className="text-gray-400 text-sm">
                          {vendedor.clientes || 0} clientes • {vendedor.motoristas || 0} motoristas
                        </p>
                      </div>
                    </div>
                    {expandedVendor === vendedor.id ? (
                      <ChevronUp className="w-5 h-5 text-[#00f0ff]" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  {expandedVendor === vendedor.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      className="bg-[#1f1f2e]/30 p-4 space-y-3"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Clientes Cadastrados:</span>
                        <span className="text-[#00f0ff] font-semibold">{vendedor.clientes}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Motoristas Cadastrados:</span>
                        <span className="text-[#00f0ff] font-semibold">{vendedor.motoristas}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Vendas Totais:</span>
                        <span className="text-[#00ff41] font-semibold">
                          R$ {(vendedor.vendas || 0).toLocaleString()}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Código de Convite */}
      {activeTab === "convite" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          <div className="bg-[#12121a] border border-[#1f1f2e] rounded-2xl p-8">
            <h2 className="text-white font-bold text-xl mb-6">Gerar Código de Convite</h2>
            <p className="text-gray-400 mb-6">
              Gere códigos únicos para permitir que novos vendedores se cadastrem na plataforma.
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGenerateCode}
              className="w-full py-4 bg-gradient-to-r from-[#00f0ff] to-[#8b5cf6] text-white font-bold rounded-xl shadow-[0_0_30px_rgba(0,240,255,0.3)] hover:shadow-[0_0_40px_rgba(0,240,255,0.5)] transition-all flex items-center justify-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5" />
                  Código Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  Gerar e Copiar Código
                </>
              )}
            </motion.button>
          </div>

          <div className="bg-[#12121a] border border-[#1f1f2e] rounded-2xl p-6">
            <h3 className="text-white font-bold text-lg mb-4">Códigos Recentes</h3>
            <div className="space-y-3">
              {generatedCodes.map((codeObj, i) => (
                <div
                  key={`${codeObj.code}-${i}`}
                  className="flex items-center justify-between p-4 bg-[#1f1f2e] rounded-xl"
                >
                  <span className="text-white font-mono text-lg">{codeObj.code}</span>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm ${codeObj.used ? "text-[#ff006e]" : "text-[#00ff41]"}`}>
                      {codeObj.used ? "Usado" : "Ativo"}
                    </span>
                    <button
                      onClick={() => copyToClipboard(codeObj.code)}
                      className="p-2 rounded-lg hover:bg-[#00f0ff]/10 text-[#00f0ff] transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Taxa Admin */}
      {activeTab === "taxa" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          <div className="bg-[#12121a] border border-[#1f1f2e] rounded-2xl p-6">
            <h2 className="text-white font-bold text-xl mb-6">Configuração de Taxas</h2>
            <div className="space-y-4">
              {vendedores.map((vendedor) => (
                <div
                  key={vendedor.id}
                  className="flex items-center justify-between p-4 bg-[#1f1f2e] rounded-xl"
                >
                  <div>
                    <h3 className="text-white font-semibold">{vendedor.nome || vendedor.name || "Vendedor"}</h3>
                    <p className="text-gray-400 text-sm">
                      Faturamento: R$ {(vendedor.vendas || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-[#00f0ff] font-bold text-lg">{vendedor.taxa || 0}%</p>
                      <p className="text-gray-400 text-xs">Taxa Admin</p>
                    </div>
                    <input
                      type="number"
                      value={vendedor.taxa || 0}
                      readOnly
                      className="w-20 px-3 py-2 bg-[#12121a] border border-[#2a2a3e] rounded-lg text-white text-center focus:outline-none focus:border-[#00f0ff]"
                      min="0"
                      max="100"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Segurança */}
      {activeTab === "seguranca" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          <div className="bg-[#12121a] border border-[#1f1f2e] rounded-2xl p-6">
            <h2 className="text-white font-bold text-xl mb-6">Gerenciamento de Segurança</h2>
            <p className="text-gray-400 mb-6">
              Gerencie senhas e permissões de todos os usuários da plataforma.
            </p>
            <div className="space-y-4">
              {vendedores.map((vendedor) => (
                <div
                  key={vendedor.id}
                  className="p-4 bg-[#1f1f2e] rounded-xl flex items-center justify-between"
                >
                  <div>
                    <h3 className="text-white font-semibold">{vendedor.nome || vendedor.name || "Vendedor"}</h3>
                    <p className="text-gray-400 text-sm">
                      {(vendedor.clientes || 0) + (vendedor.motoristas || 0)} usuários vinculados
                    </p>
                  </div>
                  <button className="px-4 py-2 bg-[#ff006e]/20 text-[#ff006e] rounded-lg hover:bg-[#ff006e]/30 transition-colors font-medium">
                    Trocar Senha
                  </button>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* API */}
      {activeTab === "api" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          <div className="bg-[#12121a] border border-[#1f1f2e] rounded-2xl p-8">
            <h2 className="text-white font-bold text-xl mb-6">Configuração API PIXWAVE</h2>
            <p className="text-gray-400 mb-6">
              Configure a API KEY da PIXWAVE para recebimento de pagamentos em DEPIX.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  API KEY PIXWAVE
                </label>
                <input
                  type="password"
                  placeholder="Digite sua API KEY"
                  className="w-full px-4 py-3 bg-[#1f1f2e] border border-[#2a2a3e] rounded-xl text-white focus:outline-none focus:border-[#00f0ff] focus:ring-2 focus:ring-[#00f0ff]/20 transition-all"
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 bg-gradient-to-r from-[#00f0ff] to-[#8b5cf6] text-white font-bold rounded-xl shadow-[0_0_30px_rgba(0,240,255,0.3)]"
              >
                Salvar Configuração
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Faturamento */}
      {activeTab === "faturamento" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <StatCard
              title="Vendas Hoje"
              value="R$ 24,500"
              icon={<DollarSign className="w-6 h-6" />}
              color="cyan"
            />
            <StatCard
              title="A Repassar Hoje"
              value="R$ 3,200"
              icon={<TrendingUp className="w-6 h-6" />}
              color="purple"
            />
            <StatCard
              title="Total Mês"
              value="R$ 542K"
              icon={<ShoppingBag className="w-6 h-6" />}
              color="green"
            />
          </div>

          <div className="bg-[#12121a] border border-[#1f1f2e] rounded-2xl p-6">
            <h2 className="text-white font-bold text-xl mb-6">Detalhamento por Vendedor</h2>
            <div className="space-y-4">
              {vendedores.length > 0 ? (
                vendedores.map((vendedor) => (
                  <div
                    key={vendedor.username || vendedor.id}
                    className="p-5 bg-[#1f1f2e] rounded-xl space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white border-2 border-gray-500"
                          style={{
                            background: "linear-gradient(135deg, #00f0ff 0%, #8b5cf6 100%)",
                          }}
                        >
                          {renderAvatar(vendedor)}
                        </div>
                        <div>
                          <h3 className="text-white font-semibold text-lg">{vendedor.name || "Vendedor"}</h3>
                          <p className="text-gray-400 text-sm">@{vendedor.username || "unknown"}</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-[#00ff41]/20 text-[#00ff41] rounded-full text-sm font-medium">
                        Ativo
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-gray-400 text-sm">Valor Vendido</p>
                        <p className="text-white font-bold">R$ 0,00</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Taxa Admin (15%)</p>
                        <p className="text-[#ff00ff] font-bold">R$ 0,00</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">A Repassar</p>
                        <p className="text-[#00f0ff] font-bold">R$ 0,00</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">
                  Nenhum vendedor cadastrado
                </p>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Sair */}
      {activeTab === "sair" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          <div className="bg-[#12121a] border border-[#1f1f2e] rounded-2xl p-6">
            <h2 className="text-white font-bold text-xl mb-6">Sair da Plataforma</h2>
            <p className="text-gray-400 mb-6">
              Você está prestes a sair da plataforma. Deseja continuar?
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLogout}
              className="w-full py-4 bg-gradient-to-r from-[#ff006e] to-[#ff006e] text-white font-bold rounded-xl shadow-[0_0_30px_rgba(255,0,110,0.3)] hover:shadow-[0_0_40px_rgba(255,0,110,0.5)] transition-all flex items-center justify-center gap-2"
            >
              <LogOut className="w-5 h-5" />
              Sair
            </motion.button>
          </div>
        </motion.div>
      )}
    </SidebarLayout>
  );
}