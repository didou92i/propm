import React from 'react';
import { motion } from 'framer-motion';
import { Play, Star, Users, Trophy, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ParallaxBackground } from '@/components/common/ParallaxBackground';

interface TrainingWelcomeProps {
  onStart: () => void;
}

export const TrainingWelcome: React.FC<TrainingWelcomeProps> = ({ onStart }) => {
  const stats = [
    { icon: BookOpen, label: "Exercices", value: "500+" },
    { icon: Users, label: "Étudiants", value: "2.5K+" },
    { icon: Trophy, label: "Réussite", value: "95%" },
  ];

  const domains = [
    "Droit Administratif",
    "Sécurité Publique", 
    "Procédure Pénale",
    "Management",
    "Éthique & Déontologie"
  ];

  return (
    <ParallaxBackground className="min-h-screen flex items-center justify-center">
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        
        {/* Logo Promp.fr animé */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            type: "spring", 
            stiffness: 260, 
            damping: 20, 
            duration: 1.2 
          }}
          className="mb-8"
        >
          <div className="relative inline-block">
            <motion.div
              animate={{ 
                boxShadow: [
                  "0 0 20px hsl(var(--primary)/0.3)",
                  "0 0 40px hsl(var(--primary)/0.6)",
                  "0 0 20px hsl(var(--primary)/0.3)"
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="bg-background/80 backdrop-blur-sm border border-primary/20 rounded-2xl p-8"
            >
              <img 
                src="/lovable-uploads/ac2af908-24d7-4f55-a75f-56c182fe8971.png" 
                alt="Propm.fr Logo" 
                className="h-32 w-32 object-contain"
              />
              <div className="text-lg text-muted-foreground mt-2 font-medium">
                Formation CDS Premium
              </div>
            </motion.div>
            
            {/* Particules flottantes autour du logo */}
            {Array.from({ length: 8 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-primary/40 rounded-full"
                animate={{
                  x: [0, Math.cos(i * Math.PI / 4) * 60],
                  y: [0, Math.sin(i * Math.PI / 4) * 60],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
                style={{
                  left: '50%',
                  top: '50%',
                }}
              />
            ))}
          </div>
        </motion.div>

        {/* Titre avec effet typewriter */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="mb-6"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Préparez votre{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Concours CDS
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Formation interactive avec IA, exercices personnalisés et suivi de progression en temps réel
          </p>
        </motion.div>

        {/* Statistiques */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="flex flex-wrap justify-center gap-6 mb-8"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.05 }}
              className="bg-background/60 backdrop-blur-sm border border-border/50 rounded-lg p-4 min-w-[120px]"
            >
              <stat.icon className="h-6 w-6 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Domaines d'étude */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.8 }}
          className="mb-10"
        >
          <h3 className="text-lg font-semibold text-foreground mb-4">Domaines d'étude disponibles</h3>
          <div className="flex flex-wrap justify-center gap-3">
            {domains.map((domain, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.3 + index * 0.1 }}
                whileHover={{ scale: 1.05 }}
              >
                <Badge variant="secondary" className="text-sm px-3 py-1">
                  <Star className="h-3 w-3 mr-1" />
                  {domain}
                </Badge>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Bouton principal */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.8 }}
          className="relative"
        >
          <Button
            onClick={onStart}
            size="lg"
            className="px-12 py-4 text-lg font-semibold bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            <Play className="h-6 w-6 mr-2" />
            Commencer Mon Entraînement
          </Button>
          
          {/* Effet ripple autour du bouton */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute inset-0 border-2 border-primary/30 rounded-lg -z-10"
          />
        </motion.div>

        {/* Indicateur de scroll */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex justify-center"
          >
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1 h-3 bg-muted-foreground/50 rounded-full mt-2"
            />
          </motion.div>
        </motion.div>
      </div>
    </ParallaxBackground>
  );
};