import { motion } from 'framer-motion';

interface AnimatedBackgroundProps {
  variant?: 'default' | 'hero' | 'features' | 'pricing';
}

const AnimatedBackground = ({ variant = 'default' }: AnimatedBackgroundProps) => {
  const getVariantConfig = () => {
    switch (variant) {
      case 'hero':
        return {
          particles: 8,
          colors: ['bg-blue-200/20', 'bg-purple-200/20', 'bg-indigo-200/20'],
          sizes: ['w-20 h-20', 'w-32 h-32', 'w-16 h-16'],
        };
      case 'features':
        return {
          particles: 6,
          colors: ['bg-green-200/15', 'bg-blue-200/15', 'bg-purple-200/15'],
          sizes: ['w-24 h-24', 'w-18 h-18', 'w-28 h-28'],
        };
      case 'pricing':
        return {
          particles: 5,
          colors: ['bg-yellow-200/15', 'bg-pink-200/15', 'bg-indigo-200/15'],
          sizes: ['w-22 h-22', 'w-26 h-26', 'w-20 h-20'],
        };
      default:
        return {
          particles: 4,
          colors: ['bg-gray-200/10', 'bg-blue-200/10'],
          sizes: ['w-16 h-16', 'w-24 h-24'],
        };
    }
  };

  const config = getVariantConfig();

  const generateParticles = () => {
    const particles = [];
    for (let i = 0; i < config.particles; i++) {
      const color = config.colors[i % config.colors.length];
      const size = config.sizes[i % config.sizes.length];
      const delay = i * 0.5;
      
      particles.push(
        <motion.div
          key={i}
          className={`absolute ${color} ${size} rounded-full blur-xl`}
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            x: [0, Math.random() * 200 - 100, 0],
            y: [0, Math.random() * 200 - 100, 0],
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 8 + Math.random() * 4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: delay,
          }}
        />
      );
    }
    return particles;
  };

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-blue-50/30 to-purple-50/30" />
      
      {/* Animated particles */}
      {generateParticles()}
      
      {/* Geometric shapes */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400/40 rounded-full"
        animate={{
          scale: [1, 2, 1],
          opacity: [0.4, 0.8, 0.4],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      <motion.div
        className="absolute top-3/4 right-1/4 w-1 h-1 bg-purple-400/40 rounded-full"
        animate={{
          scale: [1, 3, 1],
          opacity: [0.3, 0.7, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      />
      
      <motion.div
        className="absolute top-1/2 right-1/3 w-3 h-3 bg-indigo-400/30 rounded-full"
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.2, 0.6, 0.2],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
      />
    </div>
  );
};

export default AnimatedBackground;
