import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, Play, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { TrainingExperiencePlayer } from '@/components/training/TrainingExperiencePlayer';
import { toast } from 'sonner';
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

export function TrainingBuilder() {
  const [selectedTrainingType, setSelectedTrainingType] = useState<TrainingType>('qcm');
  const [selectedLevel, setSelectedLevel] = useState<UserLevel>('intermediaire');
  const [selectedDomain, setSelectedDomain] = useState<StudyDomain>('droit_administratif');
  const [showTraining, setShowTraining] = useState(false);
  const [trainingContent, setTrainingContent] = useState<any>(null);

  const handleStartTraining = () => {
    const mockContent = {
      trainingType: selectedTrainingType,
      level: selectedLevel,
      domain: selectedDomain
    };
    setTrainingContent(mockContent);
    setShowTraining(true);
  };

  const handleTrainingComplete = (session: TrainingSession) => {
    toast.success("Entraînement terminé !", {
      description: `Score: ${session.score || 0}%`
    });
    setShowTraining(false);
  };

  const handleTrainingExit = () => {
    setShowTraining(false);
  };

  if (showTraining && trainingContent) {
    return (
      <div className="h-full">
        <TrainingExperiencePlayer 
          trainingType={trainingContent.trainingType}
          level={trainingContent.level}
          domain={trainingContent.domain}
          initialContent={trainingContent}
          onComplete={handleTrainingComplete}
          onExit={handleTrainingExit}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center mb-4">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold">Générateur d'Entraînement</CardTitle>
            <p className="text-muted-foreground">
              Créez des sessions d'entraînement personnalisées pour votre préparation aux concours
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Type d'entraînement</label>
                <Select value={selectedTrainingType} onValueChange={(value: TrainingType) => setSelectedTrainingType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="qcm">QCM</SelectItem>
                    <SelectItem value="vrai_faux">Vrai/Faux</SelectItem>
                    <SelectItem value="cas_pratique">Cas Pratique</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Niveau</label>
                <Select value={selectedLevel} onValueChange={(value: UserLevel) => setSelectedLevel(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="debutant">Débutant</SelectItem>
                    <SelectItem value="intermediaire">Intermédiaire</SelectItem>
                    <SelectItem value="avance">Avancé</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Domaine</label>
                <Select value={selectedDomain} onValueChange={(value: StudyDomain) => setSelectedDomain(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="droit_administratif">Droit Administratif</SelectItem>
                    <SelectItem value="droit_penal">Droit Pénal</SelectItem>
                    <SelectItem value="management">Management</SelectItem>
                    <SelectItem value="redaction_administrative">Rédaction Administrative</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">
                <Settings className="h-3 w-3 mr-1" />
                {selectedTrainingType}
              </Badge>
              <Badge variant="outline">{selectedLevel}</Badge>
              <Badge variant="outline">{selectedDomain}</Badge>
            </div>

            <Button 
              onClick={handleStartTraining}
              size="lg" 
              className="w-full"
            >
              <Play className="h-4 w-4 mr-2" />
              Commencer l'entraînement
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}