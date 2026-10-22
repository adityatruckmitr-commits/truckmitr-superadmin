import { motion } from 'framer-motion';

const GlassCard = ({ children, className = '', hover = true, gradient = false }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={hover ? { scale: 1.02, y: -5 } : {}}
      className={`
        relative overflow-hidden rounded-2xl
        ${gradient 
          ? 'bg-gradient-to-br from-white/90 via-white/80 to-white/70' 
          : 'bg-white/80'
        }
        backdrop-blur-xl
        border border-white/20
        shadow-[0_8px_32px_0_rgba(31,38,135,0.15)]
        hover:shadow-[0_8px_48px_0_rgba(31,38,135,0.25)]
        transition-all duration-300
        ${className}
      `}
    >
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 opacity-0 hover:opacity-100 transition-opacity duration-500" />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
      
      {/* Shine effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
    </motion.div>
  );
};

export default GlassCard;
