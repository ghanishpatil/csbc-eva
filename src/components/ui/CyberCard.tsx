import { ReactNode } from 'react';

interface CyberCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
}

export const CyberCard: React.FC<CyberCardProps> = ({ 
  children, 
  className = '', 
  hover = true,
  glow = false 
}) => {
  return (
    <div className={`
      cyber-card 
      ${hover ? 'hover:border-cyber-border-light hover:-translate-y-1' : ''} 
      ${glow ? 'shadow-cyber-glow' : ''}
      ${className}
      relative
      overflow-hidden
      group
    `}>
      {/* Subtle animated gradient overlay */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyber-neon-blue/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>

      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyber-neon-blue/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyber-neon-blue/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-cyber-neon-blue/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyber-neon-blue/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    </div>
  );
};
