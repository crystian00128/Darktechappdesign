import { ReactNode, useState } from "react";
import { motion } from "motion/react";
import { LogOut, Menu, X } from "lucide-react";
import { useNavigate } from "react-router";

interface MenuItem {
  icon: ReactNode;
  label: string;
  id: string;
}

interface SidebarLayoutProps {
  children: ReactNode;
  menuItems: MenuItem[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  title: string;
  headerAction?: ReactNode;
}

export function SidebarLayout({
  children,
  menuItems,
  activeTab,
  onTabChange,
  title,
  headerAction,
}: SidebarLayoutProps) {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-0 left-0 w-96 h-96 bg-[#00f0ff] rounded-full blur-[150px] opacity-10"
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-0 right-0 w-96 h-96 bg-[#ff00ff] rounded-full blur-[150px] opacity-10"
          animate={{
            x: [0, -100, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: sidebarOpen ? 280 : 80,
        }}
        className="relative bg-[#12121a] border-r border-[#1f1f2e] flex flex-col transition-all duration-300"
      >
        {/* Logo */}
        <div className="p-6 border-b border-[#1f1f2e]">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00f0ff] to-[#8b5cf6] flex items-center justify-center">
                  <span className="text-white font-bold text-lg">D</span>
                </div>
                <div>
                  <h2 className="text-white font-bold text-sm">{title}</h2>
                  <p className="text-gray-500 text-xs">Sistema Tech</p>
                </div>
              </motion.div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-[#1f1f2e] text-gray-400 hover:text-white transition-colors"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <motion.button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              whileHover={{ x: 5 }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === item.id
                  ? "bg-gradient-to-r from-[#00f0ff]/20 to-[#8b5cf6]/20 text-[#00f0ff] border border-[#00f0ff]/30 shadow-[0_0_20px_rgba(0,240,255,0.2)]"
                  : "text-gray-400 hover:text-white hover:bg-[#1f1f2e]"
              }`}
            >
              <div className="w-5 h-5 flex-shrink-0">{item.icon}</div>
              {sidebarOpen && (
                <span className="font-medium text-sm">{item.label}</span>
              )}
            </motion.button>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-[#1f1f2e]">
          <motion.button
            onClick={() => navigate("/")}
            whileHover={{ x: 5 }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#ff006e] hover:bg-[#ff006e]/10 transition-all"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="font-medium text-sm">Sair</span>}
          </motion.button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="relative bg-[#12121a] border-b border-[#1f1f2e] px-8 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{title}</h1>
            <p className="text-gray-500 text-sm mt-1">
              Painel de Controle Avançado
            </p>
          </div>
          {headerAction}
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}
