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
                className="space-y-4"
                whileHover={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <label className="text-sm font-bold text-foreground flex items-center gap-3">
                  <div className="select-icon-container">
                    <BookOpen className="w-4 h-4 text-primary" />
                  </div>
                  Type d'entraînement
                </label>
                <Select value={configuration.trainingType} onValueChange={handleTrainingTypeChange}>
                  <SelectTrigger className="select-category-training">
                    <div className="flex items-center gap-3">
                      <div className="select-icon-container">
                        {(() => {
                          const selectedType = TRAINING_TYPES.find(t => t.value === configuration.trainingType);
                          return selectedType ? <selectedType.icon className="w-4 h-4 text-primary" /> : null;
                        })()}
                      </div>
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {TRAINING_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-3 py-1">
                          <div className="select-icon-container">
                            <type.icon className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <div className="font-semibold">{type.label}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </motion.div>

              {/* Niveau */}
              <motion.div 
                className="space-y-4"
                whileHover={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <label className="text-sm font-bold text-foreground flex items-center gap-3">
                  <div className="select-icon-container">
                    <Trophy className="w-4 h-4 text-primary" />
                  </div>
                  Niveau de Difficulté
                </label>
                <Select value={configuration.level} onValueChange={handleLevelChange}>
                  <SelectTrigger className="select-category-level">
                    <div className="flex items-center gap-3">
                      <div className="select-icon-container">
                        <Trophy className="w-4 h-4 text-primary" />
                      </div>
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {USER_LEVELS.map((lvl) => (
                      <SelectItem key={lvl.value} value={lvl.value}>
                        <div className="py-1">
                          <div className="font-semibold">{lvl.label}</div>
                          <div className="text-sm text-muted-foreground opacity-80">{lvl.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </motion.div>

              {/* Domaine */}
              <motion.div 
                className="space-y-4"
                whileHover={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <label className="text-sm font-bold text-foreground flex items-center gap-3">
                  <div className="select-icon-container">
                    <Brain className="w-4 h-4 text-primary" />
                  </div>
                  Domaine d'Étude
                </label>
                <Select value={configuration.domain} onValueChange={handleDomainChange}>
                  <SelectTrigger className="select-category-domain">
                    <div className="flex items-center gap-3">
                      <div className="select-icon-container">
                        <Brain className="w-4 h-4 text-primary" />
                      </div>
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {STUDY_DOMAINS.map((dom) => (
                      <SelectItem key={dom.value} value={dom.value}>
                        <div className="py-1">
                          <div className="font-semibold">{dom.label}</div>
                        </div>
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