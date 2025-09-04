import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, LogIn, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface ProtectedTrainingRouteProps {
  children: React.ReactNode;
}

export const ProtectedTrainingRoute: React.FC<ProtectedTrainingRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-accent/5 flex items-center justify-center">
        <Card className="glass neomorphism p-8">
          <div className="flex items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <div>
              <h3 className="text-lg font-semibold">Vérification de l'authentification...</h3>
              <p className="text-muted-foreground">Patientez un moment</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-accent/5 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-md w-full"
        >
          <Card className="glass neomorphism text-center">
            <CardHeader>
              <motion.div 
                className="flex justify-center mb-4"
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <div className="w-16 h-16 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
                  <Brain className="w-8 h-8 text-primary-foreground" />
                </div>
              </motion.div>
              <CardTitle className="text-2xl gradient-text">
                Accès Protégé
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <p className="text-muted-foreground">
                  Vous devez être connecté pour accéder à la plateforme d'entraînement personnalisé.
                </p>
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <h4 className="font-semibold text-primary mb-2">Fonctionnalités disponibles :</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Suivi personnalisé de vos performances</li>
                    <li>• Historique complet de vos sessions</li>
                    <li>• Badges et récompenses débloqués</li>
                    <li>• Progression adaptée à votre niveau</li>
                  </ul>
                </div>
              </div>
              
              <Button 
                onClick={() => navigate('/auth')}
                className="w-full gradient-primary hover-lift shadow-glow"
                size="lg"
              >
                <LogIn className="w-5 h-5 mr-2" />
                Se connecter pour continuer
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
};