import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SimpleTrainingPlayer } from '@/components/training/SimpleTrainingPlayer';
import { ParallaxBackground } from "@/components/common";
import { LegalFooter } from "@/components/legal";
import { useAgentTheme } from "@/hooks/useAgentTheme";
import { Brain, BookOpen, Target, Timer, Trophy, Play, ArrowLeft } from 'lucide-react';
import type { TrainingType, UserLevel, StudyDomain } from '@/types/prepacds';

interface TrainingSession {
  id: string;
  trainingType: TrainingType;
  level: UserLevel;
  domain: StudyDomain;
  content?: any;
  isActive: boolean;
  progress: number;
  score?: number;
}

const Training = () => {
  const [selectedAgent, setSelectedAgent] = useState("prepacds");
  const [isTrainingActive, setIsTrainingActive] = useState(false);
  const [trainingType, setTrainingType] = useState<TrainingType>('qcm');
  const [level, setLevel] = useState<UserLevel>('intermediaire');
  const [domain, setDomain] = useState<StudyDomain>('droit_administratif');
  const [completedSessions, setCompletedSessions] = useState<TrainingSession[]>([]);

  useAgentTheme(selectedAgent);

  const handleAgentSelect = (agentId: string) => {
    setSelectedAgent(agentId);
  };

  const handleStartTraining = () => {
    console.log('🚀 Training.tsx - Démarrage entraînement:', { trainingType, level, domain });
    setIsTrainingActive(true);
  };

  const handleTrainingComplete = (session: TrainingSession) => {
    setCompletedSessions(prev => [...prev, session]);
    setIsTrainingActive(false);
  };

  const handleTrainingExit = () => {
    setIsTrainingActive(false);
  };

  const trainingTypes = [
    { value: 'qcm', label: 'QCM - Questions à Choix Multiple', icon: Target },
    { value: 'vrai_faux', label: 'Vrai/Faux - Affirmations', icon: BookOpen },
    { value: 'cas_pratique', label: 'Cas Pratiques - Simulations', icon: Brain },
    { value: 'simulation_oral', label: 'Simulation Oral - Entretien', icon: Timer },
    { value: 'question_ouverte', label: 'Questions Ouvertes - Rédaction', icon: Trophy },
    { value: 'plan_revision', label: 'Plan de Révision - Planification', icon: BookOpen }
  ];

  const levels = [
    { value: 'debutant', label: 'Débutant', description: 'Bases et fondamentaux' },
    { value: 'intermediaire', label: 'Intermédiaire', description: 'Approfondissement' },
    { value: 'avance', label: 'Avancé', description: 'Expertise et cas complexes' }
  ];

  const domains = [
    { value: 'droit_administratif', label: 'Droit Administratif' },
    { value: 'droit_penal', label: 'Droit Pénal' },
    { value: 'management', label: 'Management' },
    { value: 'redaction_administrative', label: 'Rédaction Administrative' }
  ];

  if (isTrainingActive) {
    console.log('🎮 Training.tsx - Rendu TrainingExperiencePlayer:', { trainingType, level, domain });
    return (
      <div className="fixed inset-0 z-50 bg-background">
        <SimpleTrainingPlayer
          trainingType={trainingType}
          level={level}
          domain={domain}
          onComplete={(score, answers) => {
            const session: TrainingSession = {
              id: `session-${Date.now()}`,
              trainingType,
              level,
              domain,
              isActive: false,
              progress: 100,
              score
            };
            handleTrainingComplete(session);
          }}
          onExit={handleTrainingExit}
        />
      </div>
    );
  }

  return (
    <ParallaxBackground className="min-h-screen">
      <SidebarProvider>
        <div className="min-h-screen flex w-full theme-transition">
          <AppSidebar selectedAgent={selectedAgent} onAgentSelect={handleAgentSelect} />
          
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <header className="flex items-center justify-between p-4 border-b border-border/40 glass backdrop-blur-sm animate-fade-in">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="p-2 hover-lift neomorphism-hover" />
                <div className="flex items-center gap-3">
                  <Brain className="w-6 h-6 text-primary" />
                  <div>
                    <h1 className="text-gray-200 text-lg font-bold">Centre d'Entraînement PrepaCDS</h1>
                    <p className="text-sm text-muted-foreground">Révisions interactives avec animations</p>
                  </div>
                </div>
              </div>
              <Badge variant="secondary" className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Mode Révisions
              </Badge>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-6 space-y-6">
              {/* Configuration Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="glass neomorphism">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-primary" />
                      Configuration d'Entraînement
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Type d'entraînement */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Type d'entraînement</label>
                        <Select value={trainingType} onValueChange={(value) => setTrainingType(value as TrainingType)}>
                          <SelectTrigger className="glass">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {trainingTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                <div className="flex items-center gap-2">
                                  <type.icon className="w-4 h-4" />
                                  {type.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Niveau */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Niveau</label>
                        <Select value={level} onValueChange={(value) => setLevel(value as UserLevel)}>
                          <SelectTrigger className="glass">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {levels.map((lvl) => (
                              <SelectItem key={lvl.value} value={lvl.value}>
                                <div>
                                  <div className="font-medium">{lvl.label}</div>
                                  <div className="text-xs text-muted-foreground">{lvl.description}</div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Domaine */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Domaine d'étude</label>
                        <Select value={domain} onValueChange={(value) => setDomain(value as StudyDomain)}>
                          <SelectTrigger className="glass">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {domains.map((dom) => (
                              <SelectItem key={dom.value} value={dom.value}>
                                {dom.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Button 
                      onClick={handleStartTraining} 
                      className="w-full md:w-auto px-8 py-3 text-lg font-medium hover-lift"
                      size="lg"
                    >
                      <Play className="w-5 h-5 mr-2" />
                      Démarrer l'Entraînement
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Statistiques et Historique */}
              {completedSessions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Card className="glass neomorphism">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-primary" />
                        Historique des Sessions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {completedSessions.map((session) => (
                          <div key={session.id} className="flex items-center justify-between p-3 rounded-lg border border-border/40 glass-subtle">
                            <div className="flex items-center gap-3">
                              <Badge variant="outline">{session.trainingType}</Badge>
                              <span className="text-sm text-muted-foreground">
                                {session.level} - {session.domain}
                              </span>
                            </div>
                            {session.score && (
                              <Badge variant="secondary">
                                Score: {session.score}%
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </main>
          </div>

          <LegalFooter />
        </div>
      </SidebarProvider>
    </ParallaxBackground>
  );
};

export default Training;