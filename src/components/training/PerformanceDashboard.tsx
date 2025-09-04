import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Trophy, 
  TrendingUp, 
  Clock, 
  Target, 
  Award, 
  Calendar,
  Flame,
  Star,
  Zap,
  Brain
} from 'lucide-react';

interface PerformanceData {
  date: string;
  score: number;
  time: number;
  questions: number;
}

interface TrainingSessionForDashboard {
  id: string;
  type: string;
  score: number;
  date: string;
  duration: number;
}

interface PerformanceDashboardProps {
  completedSessions: any[];
}

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({ completedSessions }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('week');
  const [animatedStats, setAnimatedStats] = useState({
    avgScore: 0,
    totalSessions: 0,
    streakDays: 0,
    totalTime: 0
  });

  // Mock data for demonstration
  const mockPerformanceData: PerformanceData[] = [
    { date: '2024-01', score: 75, time: 45, questions: 20 },
    { date: '2024-02', score: 82, time: 38, questions: 25 },
    { date: '2024-03', score: 78, time: 42, questions: 22 },
    { date: '2024-04', score: 88, time: 35, questions: 28 },
    { date: '2024-05', score: 92, time: 32, questions: 30 },
    { date: '2024-06', score: 95, time: 28, questions: 32 },
  ];

  const domainData = [
    { name: 'Droit Administratif', value: 35, color: 'hsl(var(--primary))' },
    { name: 'Droit Pénal', value: 25, color: 'hsl(var(--secondary))' },
    { name: 'Management', value: 20, color: 'hsl(var(--accent))' },
    { name: 'Rédaction', value: 20, color: 'hsl(var(--muted))' },
  ];

  const achievementBadges = [
    { 
      id: 'streak_7', 
      name: 'Série de 7 jours', 
      icon: Flame, 
      color: 'text-orange-500', 
      unlocked: true,
      description: 'Entraînement quotidien pendant 7 jours'
    },
    { 
      id: 'perfect_score', 
      name: 'Score Parfait', 
      icon: Star, 
      color: 'text-yellow-500', 
      unlocked: true,
      description: '100% dans une session'
    },
    { 
      id: 'speed_master', 
      name: 'Maître de Vitesse', 
      icon: Zap, 
      color: 'text-blue-500', 
      unlocked: false,
      description: 'Terminer en moins de 30 secondes'
    },
    { 
      id: 'knowledge_seeker', 
      name: 'Chercheur de Savoir', 
      icon: Brain, 
      color: 'text-purple-500', 
      unlocked: true,
      description: '50 sessions complétées'
    },
  ];

  useEffect(() => {
    // Animate statistics
    const targetStats = {
      avgScore: 87,
      totalSessions: completedSessions.length || 24,
      streakDays: 12,
      totalTime: 1440 // minutes
    };

    Object.entries(targetStats).forEach(([key, target]) => {
      let current = 0;
      const increment = target / 60;
      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          current = target;
          clearInterval(timer);
        }
        setAnimatedStats(prev => ({ 
          ...prev, 
          [key]: Math.floor(current) 
        }));
      }, 25);
    });
  }, [completedSessions]);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="space-y-6">
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          {
            icon: Trophy,
            label: "Score Moyen",
            value: `${animatedStats.avgScore}%`,
            color: "text-yellow-500",
            bg: "bg-yellow-500/10"
          },
          {
            icon: Target,
            label: "Sessions Complétées",
            value: animatedStats.totalSessions,
            color: "text-blue-500",
            bg: "bg-blue-500/10"
          },
          {
            icon: Flame,
            label: "Série Actuelle",
            value: `${animatedStats.streakDays} jours`,
            color: "text-orange-500",
            bg: "bg-orange-500/10"
          },
          {
            icon: Clock,
            label: "Temps Total",
            value: formatTime(animatedStats.totalTime),
            color: "text-green-500",
            bg: "bg-green-500/10"
          }
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card className="glass neomorphism hover-lift cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">
                      {stat.label}
                    </p>
                    <motion.p 
                      className="text-2xl font-bold text-foreground"
                      key={stat.value}
                      initial={{ scale: 1.2, opacity: 0.8 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      {stat.value}
                    </motion.p>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.bg} group-hover:scale-110 transition-transform duration-300`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Performance Chart */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <Card className="glass neomorphism">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Évolution des Performances
              </CardTitle>
              <div className="flex gap-2">
                {(['week', 'month', 'year'] as const).map((period) => (
                  <Button
                    key={period}
                    variant={selectedPeriod === period ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedPeriod(period)}
                    className="capitalize"
                  >
                    {period === 'week' ? 'Semaine' : period === 'month' ? 'Mois' : 'Année'}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockPerformanceData}>
                  <defs>
                    <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#scoreGradient)"
                    name="Score (%)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Domain Distribution */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Card className="glass neomorphism">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Répartition par Domaine
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={domainData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {domainData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4">
                {domainData.map((domain, index) => (
                  <div key={domain.name} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: domain.color }}
                    />
                    <span className="text-sm text-muted-foreground">
                      {domain.name}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Achievements */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <Card className="glass neomorphism">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                Badges & Réussites
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {achievementBadges.map((badge, index) => (
                  <motion.div
                    key={badge.id}
                    className={`p-4 rounded-lg border-2 transition-all duration-300 cursor-pointer ${
                      badge.unlocked 
                        ? 'border-primary/50 bg-primary/5 hover:border-primary' 
                        : 'border-muted bg-muted/20 opacity-60'
                    }`}
                    whileHover={{ scale: badge.unlocked ? 1.05 : 1 }}
                    whileTap={{ scale: badge.unlocked ? 0.95 : 1 }}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-2 rounded-full ${badge.unlocked ? 'bg-background' : 'bg-muted'}`}>
                        <badge.icon className={`w-4 h-4 ${badge.unlocked ? badge.color : 'text-muted-foreground'}`} />
                      </div>
                      {badge.unlocked && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: index * 0.2 }}
                        >
                          <Badge variant="secondary" className="text-xs">
                            Débloqué
                          </Badge>
                        </motion.div>
                      )}
                    </div>
                    <h4 className="font-semibold text-sm mb-1">{badge.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      {badge.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Learning Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1 }}
      >
        <Card className="glass neomorphism">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Calendrier d'Activité
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
                <div key={day} className="text-xs text-center text-muted-foreground font-medium py-2">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 35 }).map((_, i) => {
                const intensity = Math.random();
                const hasActivity = intensity > 0.3;
                return (
                  <motion.div
                    key={i}
                    className={`aspect-square rounded-md border-2 cursor-pointer transition-all duration-200 ${
                      hasActivity 
                        ? intensity > 0.8 
                          ? 'bg-primary border-primary' 
                          : intensity > 0.6 
                          ? 'bg-primary/60 border-primary/60' 
                          : 'bg-primary/30 border-primary/30'
                        : 'bg-muted/20 border-muted hover:border-primary/30'
                    }`}
                    whileHover={{ scale: 1.1 }}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.02 }}
                  />
                );
              })}
            </div>
            <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
              <span>Moins actif</span>
              <div className="flex gap-1">
                {[0.2, 0.4, 0.6, 0.8].map((opacity, i) => (
                  <div 
                    key={i}
                    className={`w-3 h-3 rounded-sm bg-primary`}
                    style={{ opacity }}
                  />
                ))}
              </div>
              <span>Plus actif</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};