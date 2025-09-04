import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, TrendingUp, Target, Play } from 'lucide-react';

interface EmptyTrainingStateProps {
  onStartTraining: () => void;
}

export const EmptyTrainingState: React.FC<EmptyTrainingStateProps> = ({ onStartTraining }) => {
  return (
    <Card className="glass neomorphism">
      <CardContent className="p-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          {/* Icon Animation */}
          <motion.div 
            className="flex justify-center"
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <div className="w-16 h-16 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
              <Brain className="w-8 h-8 text-primary-foreground" />
            </div>
          </motion.div>

          {/* Content */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold gradient-text">
              Commencez votre parcours d'entraînement
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Vous n'avez pas encore d'historique d'entraînement. Lancez votre première session 
              pour débloquer les statistiques, badges et le suivi personnalisé.
            </p>
          </div>

          {/* Features Preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
            {[
              {
                icon: TrendingUp,
                title: 'Progression Suivie',
                description: 'Visualisez votre évolution'
              },
              {
                icon: Target,
                title: 'Objectifs Adaptatifs',
                description: 'Contenu personnalisé'
              },
              {
                icon: Brain,
                title: 'IA Pédagogique',
                description: 'Apprentissage optimisé'
              }
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                className="p-4 rounded-lg glass-subtle border border-primary/20"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <feature.icon className="w-4 h-4 text-primary" />
                </div>
                <h4 className="font-semibold text-sm mb-1">{feature.title}</h4>
                <p className="text-xs text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>

          {/* Call to Action */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Button 
              onClick={onStartTraining}
              className="gradient-primary hover-lift shadow-glow px-8 py-3 text-lg font-semibold"
              size="lg"
            >
              <Play className="w-5 h-5 mr-2" />
              Commencer l'Entraînement
            </Button>
          </motion.div>

          {/* Additional Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="text-xs text-muted-foreground"
          >
            🔒 Vos données sont sécurisées et privées
          </motion.div>
        </motion.div>
      </CardContent>
    </Card>
  );
};