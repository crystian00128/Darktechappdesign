import { ReactNode } from "react";
import { motion } from "motion/react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  color: "cyan" | "purple" | "pink" | "green";
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const colorClasses = {
  cyan: {
    bg: "from-[#00f0ff]/20 to-[#00f0ff]/5",
    border: "border-[#00f0ff]/30",
    shadow: "shadow-[0_0_20px_rgba(0,240,255,0.2)]",
    icon: "bg-[#00f0ff]/20 text-[#00f0ff]",
    text: "text-[#00f0ff]",
  },
  purple: {
    bg: "from-[#8b5cf6]/20 to-[#8b5cf6]/5",
    border: "border-[#8b5cf6]/30",
    shadow: "shadow-[0_0_20px_rgba(139,92,246,0.2)]",
    icon: "bg-[#8b5cf6]/20 text-[#8b5cf6]",
    text: "text-[#8b5cf6]",
  },
  pink: {
    bg: "from-[#ff00ff]/20 to-[#ff00ff]/5",
    border: "border-[#ff00ff]/30",
    shadow: "shadow-[0_0_20px_rgba(255,0,255,0.2)]",
    icon: "bg-[#ff00ff]/20 text-[#ff00ff]",
    text: "text-[#ff00ff]",
  },
  green: {
    bg: "from-[#00ff41]/20 to-[#00ff41]/5",
    border: "border-[#00ff41]/30",
    shadow: "shadow-[0_0_20px_rgba(0,255,65,0.2)]",
    icon: "bg-[#00ff41]/20 text-[#00ff41]",
    text: "text-[#00ff41]",
  },
};

export function StatCard({ title, value, icon, color, trend }: StatCardProps) {
  const colors = colorClasses[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className={`relative bg-gradient-to-br ${colors.bg} border ${colors.border} rounded-2xl p-6 ${colors.shadow} backdrop-blur-sm`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-gray-400 text-sm font-medium mb-2">{title}</p>
          <h3 className="text-3xl font-bold text-white mb-1">{value}</h3>
          {trend && (
            <div className="flex items-center gap-1">
              <span
                className={`text-sm font-medium ${
                  trend.isPositive ? "text-[#00ff41]" : "text-[#ff006e]"
                }`}
              >
                {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
              </span>
              <span className="text-gray-500 text-xs">vs. mês anterior</span>
            </div>
          )}
        </div>
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className={`${colors.icon} p-3 rounded-xl`}
        >
          {icon}
        </motion.div>
      </div>
    </motion.div>
  );
}
