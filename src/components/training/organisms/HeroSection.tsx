import React from 'react';
import { motion } from 'framer-motion';
import { HeroHeader } from '../molecules/HeroHeader';
import { HeroStats } from '../molecules/HeroStats';
import { HeroActions } from '../molecules/HeroActions';
import { ParallaxBackground } from '@/components/common/ParallaxBackground';

interface HeroSectionProps {
  onStartTraining: () => void;
  onShowConfiguration: () => void;
  isLoading?: boolean;
  hasSessionData?: boolean;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onStartTraining,
  onShowConfiguration,
  isLoading = false,
  hasSessionData = false
}) => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background animé */}
      <ParallaxBackground>
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      </ParallaxBackground>
      
      {/* Contenu principal */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-20">
        <div className="space-y-16">
          {/* En-tête du hero */}
          <HeroHeader />
          
          {/* Statistiques */}
          <HeroStats />
          
          {/* Actions principales */}
          <HeroActions
            onStartTraining={onStartTraining}
            onShowConfiguration={onShowConfiguration}
            isLoading={isLoading}
            hasSessionData={hasSessionData}
          />
        </div>
      </div>

      {/* Indicateur de scroll */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-6 h-10 border-2 border-primary/30 rounded-full flex justify-center"
        >
          <motion.div
            animate={{ y: [0, 16, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-1 h-3 bg-primary/50 rounded-full mt-2"
          />
        </motion.div>
      </motion.div>
    </section>
  );
};