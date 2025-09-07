import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, Award, BookOpen, TrendingUp, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface TrainingEvaluation {
  score: number;
  isCorrect: boolean;
  feedback: string;
  strongPoints: string[];
  improvementAreas: string[];
  recommendations: string[];
  detailedAnalysis: string;
}

interface TrainingResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  evaluation: TrainingEvaluation;
  totalTime: number;
  caseTitle: string;
  onRestart?: () => void;
  onNewTraining?: () => void;
}

export function TrainingResultsModal({
  isOpen,
  onClose,
  evaluation,
  totalTime,
  caseTitle,
  onRestart,
  onNewTraining
}: TrainingResultsModalProps) {
  const getScoreColor = (score: number) => {
    if (score >= 16) return 'text-green-600';
    if (score >= 12) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 16) return { label: 'Excellent', variant: 'default' as const, color: 'bg-green-100 text-green-800' };
    if (score >= 12) return { label: 'Bien', variant: 'secondary' as const, color: 'bg-orange-100 text-orange-800' };
    return { label: 'À améliorer', variant: 'outline' as const, color: 'bg-red-100 text-red-800' };
  };

  const scoreBadge = getScoreBadge(evaluation.score);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-prepacds-primary flex items-center gap-2">
            <Award className="h-6 w-6" />
            Résultats de l'Évaluation
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Score principal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-prepacds-primary/20">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center gap-4 mb-4">
                  <div className={`text-4xl font-bold ${getScoreColor(evaluation.score)}`}>
                    {evaluation.score}/20
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    {evaluation.isCorrect ? (
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    ) : (
                      <XCircle className="h-8 w-8 text-red-600" />
                    )}
                    <Badge className={scoreBadge.color}>
                      {scoreBadge.label}
                    </Badge>
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-2">{caseTitle}</h3>
                <p className="text-sm text-muted-foreground">
                  Exercice complété en {Math.round(totalTime)} minutes
                </p>
                <Progress 
                  value={(evaluation.score / 20) * 100} 
                  className="mt-4"
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Feedback détaillé */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-prepacds-primary" />
                  Analyse Détaillée
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/30 p-4 rounded-lg">
                  <p className="text-sm leading-relaxed">{evaluation.feedback}</p>
                </div>
                
                {evaluation.detailedAnalysis && (
                  <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                    <h4 className="font-semibold text-sm mb-2 text-primary">Analyse Approfondie :</h4>
                    <p className="text-sm leading-relaxed">{evaluation.detailedAnalysis}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Points forts */}
            {evaluation.strongPoints.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <Card className="border-green-200">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-green-700">
                      <CheckCircle className="h-5 w-5" />
                      Points Forts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {evaluation.strongPoints.map((point, index) => (
                        <li key={index} className="text-sm flex items-start gap-2">
                          <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <div className="w-2 h-2 rounded-full bg-green-600"></div>
                          </div>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Axes d'amélioration */}
            {evaluation.improvementAreas.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
              >
                <Card className="border-orange-200">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-orange-700">
                      <TrendingUp className="h-5 w-5" />
                      Axes d'Amélioration
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {evaluation.improvementAreas.map((area, index) => (
                        <li key={index} className="text-sm flex items-start gap-2">
                          <div className="w-4 h-4 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <div className="w-2 h-2 rounded-full bg-orange-600"></div>
                          </div>
                          {area}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>

          {/* Recommandations */}
          {evaluation.recommendations.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              <Card className="border-prepacds-primary/20">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-prepacds-primary">
                    <ArrowRight className="h-5 w-5" />
                    Recommandations Personnalisées
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {evaluation.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm flex items-start gap-3 p-3 bg-prepacds-primary/5 rounded-lg">
                        <div className="w-6 h-6 rounded-full bg-prepacds-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-prepacds-primary">{index + 1}</span>
                        </div>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
            className="flex gap-3 pt-4 border-t"
          >
            <Button variant="outline" onClick={onClose} className="flex-1">
              Fermer
            </Button>
            {onRestart && (
              <Button variant="secondary" onClick={onRestart} className="flex-1">
                Recommencer
              </Button>
            )}
            {onNewTraining && (
              <Button onClick={onNewTraining} className="flex-1">
                Nouvel Exercice
              </Button>
            )}
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}