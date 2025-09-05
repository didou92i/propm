import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { QuickStats } from '../molecules/QuickStats';
import { PerformanceChart } from '../molecules/PerformanceChart';
import { AchievementsList } from '../molecules/AchievementsList';
import { ActivityCalendar } from '../ActivityCalendar';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActionButton } from '../atoms/ActionButton';
import { Trophy, Star, Target, Zap, Medal, Crown, BookOpen, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

import type { TrainingSessionData } from '@/hooks/useTrainingSession';

interface TrainingDashboardProps {
  sessionData: TrainingSessionData | null;
  onStartTraining?: () => Promise<void>;
}

export const TrainingDashboard: React.FC<TrainingDashboardProps> = ({ 
  sessionData,
  onStartTraining
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const navigate = useNavigate();

  // Transformation des données pour les graphiques
  const transformDataForChart = (data: any, period: string) => {
    if (!data?.recentActivity) return [];
    
    const now = new Date();
    const days = period === 'week' ? 7 : period === 'month' ? 30 : 365;
    
    return Array.from({ length: days }, (_, i) => {
      const date = new Date(now.getTime() - (days - 1 - i) * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const activity = data.recentActivity.find((a: any) => a.date === dateStr);
      
      return {
        date: date.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
        score: activity?.averageScore || 0
      };
    });
  };

  // Données pour le graphique de distribution par domaine
  const domainData = sessionData?.sessionsByDomain ? 
    Object.entries(sessionData.sessionsByDomain).map(([domain, count]) => ({
      name: domain,
      value: count,
      fill: `hsl(${Math.random() * 360}, 70%, 50%)`
    })) : [];

  // Calcul des succès
  const calculateAchievements = (data: any) => {
    if (!data) return [];

    const achievements = [
      {
        id: 'first-session',
        name: 'Premier Pas',
        description: 'Compléter votre première session',
        icon: Star,
        unlocked: data.totalSessions > 0
      },
      {
        id: 'score-master',
        name: 'Maître du Score',
        description: 'Obtenir un score moyen supérieur à 80%',
        icon: Trophy,
        unlocked: data.averageScore >= 80
      },
      {
        id: 'streak-warrior',
        name: 'Guerrier Régulier',
        description: 'Maintenir une série de 7 jours',
        icon: Zap,
        unlocked: data.streakDays >= 7,
        progress: data.streakDays,
        maxProgress: 7
      },
      {
        id: 'session-veteran',
        name: 'Vétéran',
        description: 'Compléter 10 sessions',
        icon: Medal,
        unlocked: data.totalSessions >= 10,
        progress: Math.min(data.totalSessions, 10),
        maxProgress: 10
      },
      {
        id: 'time-dedication',
        name: 'Dédication',
        description: 'Passer 5 heures à s\'entraîner',
        icon: Target,
        unlocked: data.totalTimeMinutes >= 300,
        progress: Math.min(data.totalTimeMinutes, 300),
        maxProgress: 300
      },
      {
        id: 'perfectionist',
        name: 'Perfectionniste',
        description: 'Obtenir un score parfait de 100%',
        icon: Crown,
        unlocked: data.averageScore === 100
      }
    ];

    return achievements;
  };

  const performanceData = transformDataForChart(sessionData, selectedPeriod);
  const achievements = calculateAchievements(sessionData);

  // Dashboard principal avec données
  return (
    <div className="space-y-8">
      {/* En-tête avec action rapide */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex justify-between items-center mb-6"
      >
        <div>
          <h2 className="text-2xl font-bold gradient-text">Tableau de Bord</h2>
          <p className="text-muted-foreground mt-1">
            Suivez vos progrès et vos performances
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard')}
            className="flex items-center space-x-2 px-4 py-2"
          >
            <BarChart3 className="h-4 w-4" />
            <span>Dashboard Complet</span>
          </Button>
          
          {onStartTraining && (
            <ActionButton
              variant="outline"
              onClick={onStartTraining}
              icon={<BookOpen className="h-4 w-4" />}
              className="px-6 py-2"
            >
              Nouvel Entraînement
            </ActionButton>
          )}
        </div>
      </motion.div>

      {/* Statistiques rapides */}
      <QuickStats sessionData={sessionData} />

      {/* Graphiques et métriques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Graphique de performance */}
        <div className="lg:col-span-2">
          <PerformanceChart
            data={performanceData}
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
          />
        </div>

        {/* Distribution par domaine */}
        {domainData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <Card className="glass neomorphism border border-white/10 backdrop-blur-md">
              <CardHeader>
                <CardTitle>Répartition par Domaine</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={domainData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        stroke="hsl(var(--background))"
                        strokeWidth={2}
                      >
                        {domainData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Calendrier d'activité */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className={domainData.length > 0 ? "" : "lg:col-span-2"}
        >
          <Card className="glass neomorphism border border-white/10 backdrop-blur-md">
            <CardHeader>
              <CardTitle>Activité d'Apprentissage</CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityCalendar recentActivity={sessionData?.recentActivity || []} />
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Succès */}
      <AchievementsList achievements={achievements} />
    </div>
  );
};