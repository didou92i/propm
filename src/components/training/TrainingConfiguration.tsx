import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Target, BookOpen, Trophy, Brain, Settings, ArrowLeft, Play } from 'lucide-react';
import { TRAINING_TYPES, USER_LEVELS, STUDY_DOMAINS } from '@/config/training';
import type { TrainingConfig } from '@/types/training';
import type { TrainingType, UserLevel, StudyDomain } from '@/types/prepacds';

interface TrainingConfigurationProps {
  configuration: TrainingConfig;
  onConfigurationChange: (config: TrainingConfig) => void;
  onStartTraining: () => void;
  onBack: () => void;
}

export const TrainingConfiguration: React.FC<TrainingConfigurationProps> = ({
  configuration,
  onConfigurationChange,
  onStartTraining,
  onBack
}) => {
  const handleTrainingTypeChange = (value: string) => {
    onConfigurationChange({
      ...configuration,
      trainingType: value as TrainingType
    });
  };

  const handleLevelChange = (value: string) => {
    onConfigurationChange({
      ...configuration,
      level: value as UserLevel
    });
  };

  const handleDomainChange = (value: string) => {
    onConfigurationChange({
      ...configuration,
      domain: value as StudyDomain
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="p-6 space-y-6"
    >
      <div className="max-w-4xl mx-auto space-y-8">
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
                <Select value={configuration.trainingType} onValueChange={handleTrainingTypeChange}>
                  <SelectTrigger className="glass hover-lift">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRAINING_TYPES.map((type) => (
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
                <Select value={configuration.level} onValueChange={handleLevelChange}>
                  <SelectTrigger className="glass hover-lift">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {USER_LEVELS.map((lvl) => (
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
                <Select value={configuration.domain} onValueChange={handleDomainChange}>
                  <SelectTrigger className="glass hover-lift">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STUDY_DOMAINS.map((dom) => (
                      <SelectItem key={dom.value} value={dom.value}>
                        <span className="font-medium">{dom.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </motion.div>
            </div>

            {/* Configuration sélectionnée */}
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
                  {TRAINING_TYPES.find(t => t.value === configuration.trainingType)?.label}
                </Badge>
                <Badge variant="outline" className="px-3 py-1 text-sm glass">
                  {USER_LEVELS.find(l => l.value === configuration.level)?.label}
                </Badge>
                <Badge variant="outline" className="px-3 py-1 text-sm glass">
                  {STUDY_DOMAINS.find(d => d.value === configuration.domain)?.label}
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
                onClick={onBack}
                className="px-6 py-3 glass hover-lift"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
              <Button 
                onClick={onStartTraining} 
                className="px-8 py-3 text-lg font-semibold gradient-primary hover-lift shadow-glow transform-3d"
                size="lg"
              >
                <Play className="w-5 h-5 mr-2" />
                Lancer l'Entraînement
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};