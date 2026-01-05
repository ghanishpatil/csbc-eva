import { motion } from 'framer-motion';

interface LoadingSkeletonProps {
  lines?: number;
  className?: string;
}

/**
 * Loading Skeleton Component
 * Shows placeholder content while loading
 */
export const LoadingSkeleton = ({ lines = 3, className = '' }: LoadingSkeletonProps) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <motion.div
          key={i}
          className="h-4 bg-cyber-bg-darker rounded-lg shimmer"
          initial={{ opacity: 0.5 }}
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: i * 0.1,
          }}
        />
      ))}
    </div>
  );
};

