import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SimpleTrainingPlayer } from '@/components/training/SimpleTrainingPlayer';
import { TrainingHero } from '@/components/training/TrainingHero';
import { PerformanceDashboard } from '@/components/training/PerformanceDashboard';
import { ParallaxBackground } from "@/components/common";
import { LegalFooter } from "@/components/legal";
import { useAgentTheme } from "@/hooks/useAgentTheme";
import { Brain, BookOpen, Target, Timer, Trophy, Play, ArrowLeft, Settings, BarChart } from 'lucide-react';
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
  const [showConfiguration, setShowConfiguration] = useState(false);
  const [trainingType, setTrainingType] = useState<TrainingType>('qcm');
  const [level, setLevel] = useState<UserLevel>('intermediaire');
  const [domain, setDomain] = useState<StudyDomain>('droit_administratif');
  const [completedSessions, setCompletedSessions] = useState<TrainingSession[]>([]);

  useAgentTheme(selectedAgent);

  const handleAgentSelect = (agentId: string) => {
    setSelectedAgent(agentId);
  };

  const handleStartTraining = () => {
    if (!showConfiguration) {
      setShowConfiguration(true);
    } else {
      console.log('🚀 Training.tsx - Démarrage entraînement:', { trainingType, level, domain });
      setIsTrainingActive(true);
    }
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
    { value: 'cas_pratique', label: 'Cas Pratiques - Simulations', icon: Brain }
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-accent/5">
      <SidebarProvider>
        <div className="min-h-screen flex w-full theme-transition">
          <AppSidebar selectedAgent={selectedAgent} onAgentSelect={handleAgentSelect} />
          
          <div className="flex-1 flex flex-col">
            {/* Modern Header */}
            <header className="flex items-center justify-between p-4 border-b border-border/20 backdrop-blur-xl bg-background/80 sticky top-0 z-40">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="p-2 hover-lift glass" />
                <div className="flex items-center gap-3">
                  <motion.div
                    className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow"
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  >
                    <Brain className="w-5 h-5 text-primary-foreground" />
                  </motion.div>
                  <div>
                    <h1 className="text-foreground text-lg font-bold gradient-text">
                      Centre d'Excellence PrepaCDS
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      Entraînement IA avec Analytics Avancées
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant={showConfiguration ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowConfiguration(!showConfiguration)}
                  className="glass"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Configuration
                </Button>
                <Badge variant="secondary" className="flex items-center gap-2 glass">
                  <motion.div
                    className="w-2 h-2 rounded-full bg-green-500"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  Système Actif
                </Badge>
              </div>
            </header>

            {/* Hero Section */}
            {!showConfiguration && (
              <TrainingHero onStartTraining={handleStartTraining} />
            )}

            {/* Configuration Section */}
            {showConfiguration && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="flex-1 p-6 space-y-6"
              >
                <div className="max-w-4xl mx-auto space-y-8">
                  {/* Configuration Card */}
                  <Card className="glass neomorphism interactive-card">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-xl">
                        <Target className="w-6 h-6 text-primary" />
                        Configuration Avancée d'Entraînement
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Type d'entraînement */}
                        <motion.div 
                          className="space-y-3"
                          whileHover={{ scale: 1.02 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-primary" />
                            Type d'entraînement
                          </label>
                          <Select value={trainingType} onValueChange={(value) => setTrainingType(value as TrainingType)}>
                            <SelectTrigger className="glass hover-lift">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {trainingTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  <div className="flex items-center gap-3 py-1">
                                    <div className="p-1 rounded bg-primary/10">
                                      <type.icon className="w-3 h-3 text-primary" />
                                    </div>
                                    <span className="font-medium">{type.label}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </motion.div>

                        {/* Niveau */}
                        <motion.div 
                          className="space-y-3"
                          whileHover={{ scale: 1.02 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-primary" />
                            Niveau de Difficulté
                          </label>
                          <Select value={level} onValueChange={(value) => setLevel(value as UserLevel)}>
                            <SelectTrigger className="glass hover-lift">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {levels.map((lvl) => (
                                <SelectItem key={lvl.value} value={lvl.value}>
                                  <div className="py-1">
                                    <div className="font-medium">{lvl.label}</div>
                                    <div className="text-xs text-muted-foreground">{lvl.description}</div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </motion.div>

                        {/* Domaine */}
                        <motion.div 
                          className="space-y-3"
                          whileHover={{ scale: 1.02 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <Brain className="w-4 h-4 text-primary" />
                            Domaine d'Étude
                          </label>
                          <Select value={domain} onValueChange={(value) => setDomain(value as StudyDomain)}>
                            <SelectTrigger className="glass hover-lift">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {domains.map((dom) => (
                                <SelectItem key={dom.value} value={dom.value}>
                                  <span className="font-medium">{dom.label}</span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </motion.div>
                      </div>

                      {/* Selected Configuration Display */}
                      <motion.div
                        className="p-6 rounded-2xl glass-subtle border-2 border-primary/20"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                      >
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <Settings className="w-5 h-5 text-primary" />
                          Configuration Sélectionnée
                        </h3>
                        <div className="flex flex-wrap gap-3">
                          <Badge variant="outline" className="px-3 py-1 text-sm glass">
                            {trainingTypes.find(t => t.value === trainingType)?.label}
                          </Badge>
                          <Badge variant="outline" className="px-3 py-1 text-sm glass">
                            {levels.find(l => l.value === level)?.label}
                          </Badge>
                          <Badge variant="outline" className="px-3 py-1 text-sm glass">
                            {domains.find(d => d.value === domain)?.label}
                          </Badge>
                        </div>
                      </motion.div>

                      <motion.div 
                        className="flex gap-4 justify-center"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                      >
                        <Button
                          variant="outline"
                          onClick={() => setShowConfiguration(false)}
                          className="px-6 py-3 glass hover-lift"
                        >
                          <ArrowLeft className="w-4 h-4 mr-2" />
                          Retour
                        </Button>
                        <Button 
                          onClick={handleStartTraining} 
                          className="px-8 py-3 text-lg font-semibold gradient-primary hover-lift shadow-glow transform-3d"
                          size="lg"
                        >
                          <Play className="w-5 h-5 mr-2" />
                          Lancer l'Entraînement
                        </Button>
                      </motion.div>
                    </CardContent>
                  </Card>

                  {/* Performance Dashboard */}
                  <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.7 }}
                  >
                    <PerformanceDashboard completedSessions={completedSessions} />
                  </motion.div>
                </div>
              </motion.div>
            )}
          </div>

          <LegalFooter />
        </div>
      </SidebarProvider>
    </div>
  );
};

export default Training;