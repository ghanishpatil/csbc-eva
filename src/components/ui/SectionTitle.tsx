import { LucideIcon } from 'lucide-react';

interface SectionTitleProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({ icon: Icon, title, subtitle, action }) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-cyber-neon-blue/20 rounded-lg flex items-center justify-center relative group">
          <div className="absolute inset-0 bg-cyber-neon-blue/10 rounded-lg blur-lg group-hover:blur-xl transition-all duration-300"></div>
          <Icon className="w-6 h-6 text-cyber-neon-blue relative z-10 group-hover:scale-110 transition-transform duration-300" />
        </div>
        <div>
          <h2 className="text-2xl md:text-3xl font-cyber font-bold text-cyber-text-primary">
            {title}
          </h2>
          {subtitle && (
            <p className="text-cyber-text-secondary text-sm mt-1">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action && (
        <div>
          {action}
        </div>
      )}
    </div>
  );
};
