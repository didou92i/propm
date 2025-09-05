import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from "@/components/ui/badge";
import { Brain, Sparkles, Target, Zap } from 'lucide-react';

export const HeroHeader: React.FC = () => {
  const features = [
    { icon: Brain, text: "IA Adaptative" },
    { icon: Target, text: "Objectifs Personnalisés" },
    { icon: Sparkles, text: "Suivi Intelligent" },
    { icon: Zap, text: "Apprentissage Rapide" }
  ];

  return (
    <div className="text-center space-y-8">
      {/* Logo ProPM */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ duration: 1, type: "spring", stiffness: 100 }}
        className="mx-auto w-24 h-24 rounded-2xl shadow-2xl flex items-center justify-center overflow-hidden"
      >
        <img 
          src="/redacpro-avatar.png" 
          alt="ProPM Logo" 
          className="w-full h-full object-cover rounded-2xl"
        />
      </motion.div>

      {/* Titre avec effet typewriter */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.3 }}
        className="space-y-4"
      >
        <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
          Prépa CDS Premium
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
          Transformez votre préparation avec notre plateforme d'entraînement intelligente
        </p>
      </motion.div>

      {/* Badges de fonctionnalités */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="flex flex-wrap justify-center gap-3"
      >
        {features.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
          >
            <Badge variant="secondary" className="glass px-4 py-2 bg-background/50 border border-white/10">
              <feature.icon className="h-4 w-4 mr-2 text-primary" />
              {feature.text}
            </Badge>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};