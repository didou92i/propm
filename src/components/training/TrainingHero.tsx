import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { Brain, BookOpen, Target, Trophy, Zap, Star } from 'lucide-react';

interface TrainingHeroProps {
  onStartTraining: () => void;
}

export const TrainingHero: React.FC<TrainingHeroProps> = ({ onStartTraining }) => {
  const [particleCount, setParticleCount] = useState(0);
  const [statsCounter, setStatsCounter] = useState({ sessions: 0, students: 0, success: 0 });

  useEffect(() => {
    // Animated counters
    const animateCounter = (target: number, key: keyof typeof statsCounter) => {
      let current = 0;
      const increment = target / 100;
      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          current = target;
          clearInterval(timer);
        }
        setStatsCounter(prev => ({ ...prev, [key]: Math.floor(current) }));
      }, 30);
    };

    animateCounter(1247, 'sessions');
    animateCounter(89, 'students');
    animateCounter(94, 'success');

    // Particle animation counter
    const particleTimer = setInterval(() => {
      setParticleCount(prev => (prev + 1) % 100);
    }, 100);

    return () => clearInterval(particleTimer);
  }, []);

  return (
    <div className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/10 to-secondary/20 animate-gradient-shift" />
        
        {/* Floating Particles */}
        {Array.from({ length: 50 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-primary/30 rounded-full"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              scale: 0,
            }}
            animate={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 4 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}

        {/* Geometric Shapes */}
        <div className="absolute top-20 left-20">
          <motion.div
            className="w-16 h-16 border-2 border-primary/30 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />
        </div>
        
        <div className="absolute bottom-32 right-32">
          <motion.div
            className="w-12 h-12 bg-accent/20 rotate-45"
            animate={{ rotate: [45, 225, 45] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
        </div>
      </div>

      {/* Hero Content */}
      <div className="relative z-10 text-center max-w-6xl mx-auto px-6">
        
        {/* Logo ProPM */}
        <motion.div
          className="mb-8 relative group"
          initial={{ opacity: 0, scale: 0.8, rotateY: -180 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          transition={{ duration: 1.2, ease: [0.68, -0.55, 0.265, 1.55] }}
        >
          <div className="relative">
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
            
            {/* Logo Image */}
            <motion.img
              src="/lovable-uploads/42cdc339-200d-4d90-a524-fec562ad5786.png"
              alt="ProPM Logo"
              className="w-80 h-auto mx-auto relative z-10 drop-shadow-2xl"
              animate={{ 
                rotate: [0, 2, -2, 0],
                scale: [1, 1.02, 1]
              }}
              transition={{ 
                duration: 6, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
              whileHover={{ 
                scale: 1.1,
                transition: { duration: 0.3 }
              }}
            />
            
            {/* Backdrop Blur Ring */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 backdrop-blur-sm" />
          </div>
        </motion.div>

        {/* Main Title with Typewriter Effect */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mb-6"
        >
          <h1 className="text-6xl md:text-8xl font-bold mb-4 gradient-text">
            <motion.span
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
            >
              Centre
            </motion.span>{" "}
            <motion.span
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.9 }}
              className="text-primary"
            >
              d'Excellence
            </motion.span>
          </h1>
          
          <motion.div
            className="text-xl md:text-2xl text-muted-foreground font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.1 }}
          >
            Entraînement PrepaCDS avec IA Avancée
          </motion.div>
        </motion.div>

        {/* Statistics Cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.3 }}
        >
          {[
            { 
              icon: Trophy, 
              value: statsCounter.sessions, 
              label: "Sessions Complétées", 
              color: "text-yellow-500",
              suffix: "+"
            },
            { 
              icon: Star, 
              value: statsCounter.students, 
              label: "Étudiants Actifs", 
              color: "text-blue-500",
              suffix: ""
            },
            { 
              icon: Zap, 
              value: statsCounter.success, 
              label: "Taux de Réussite", 
              color: "text-green-500",
              suffix: "%"
            },
          ].map((stat, index) => (
            <motion.div
              key={index}
              className="glass neomorphism p-6 rounded-2xl backdrop-blur-xl hover-lift"
              whileHover={{ scale: 1.05, y: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="flex items-center justify-center mb-3">
                <div className={`p-3 rounded-full bg-background/50 ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
              <div className="text-3xl font-bold text-foreground mb-1">
                {stat.value}{stat.suffix}
              </div>
              <div className="text-sm text-muted-foreground">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Features Badges */}
        <motion.div
          className="flex flex-wrap justify-center gap-3 mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.5 }}
        >
          {[
            "IA Adaptative",
            "Animations Interactives", 
            "Suivi Personnalisé",
            "Gamification",
            "Temps Réel"
          ].map((feature, index) => (
            <motion.div
              key={feature}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 1.7 + index * 0.1 }}
            >
              <Badge 
                variant="secondary" 
                className="px-4 py-2 text-sm font-medium glass hover-glow cursor-pointer"
              >
                {feature}
              </Badge>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.8 }}
        >
          <Button
            onClick={onStartTraining}
            size="lg"
            className="px-12 py-4 text-lg font-semibold rounded-2xl gradient-primary hover-lift shadow-glow transform-3d"
          >
            <motion.div
              className="flex items-center gap-3"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Brain className="w-6 h-6" />
              Commencer l'Entraînement
              <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                →
              </motion.div>
            </motion.div>
          </Button>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 2 }}
      >
        <motion.div
          className="w-6 h-10 border-2 border-primary/50 rounded-full flex justify-center"
          animate={{ borderColor: ["hsl(var(--primary) / 0.3)", "hsl(var(--primary) / 0.8)", "hsl(var(--primary) / 0.3)"] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <motion.div
            className="w-1 h-3 bg-primary rounded-full mt-2"
            animate={{ y: [0, 12, 0], opacity: [1, 0, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>
      </motion.div>
    </div>
  );
};