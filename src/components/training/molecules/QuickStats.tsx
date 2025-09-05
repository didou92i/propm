import React, { useEffect, useState } from 'react';
import { MetricCard } from '../atoms/MetricCard';
import { Trophy, Clock, Target, Flame } from 'lucide-react';

interface QuickStatsProps {
  sessionData: any;
}

export const QuickStats: React.FC<QuickStatsProps> = ({ sessionData }) => {
  const [animatedStats, setAnimatedStats] = useState({
    averageScore: 0,
    totalSessions: 0,
    streakDays: 0,
    totalTimeMinutes: 0
  });

  useEffect(() => {
    if (sessionData) {
      const targetStats = {
        averageScore: sessionData.averageScore || 0,
        totalSessions: sessionData.totalSessions || 0,
        streakDays: sessionData.streakDays || 0,
        totalTimeMinutes: sessionData.totalTimeMinutes || 0
      };

      // Animation des statistiques
      const animateValues = () => {
        const duration = 1500;
        const steps = 30;
        let currentStep = 0;

        const timer = setInterval(() => {
          currentStep++;
          const progress = currentStep / steps;

          setAnimatedStats({
            averageScore: Math.floor(targetStats.averageScore * progress),
            totalSessions: Math.floor(targetStats.totalSessions * progress),
            streakDays: Math.floor(targetStats.streakDays * progress),
            totalTimeMinutes: Math.floor(targetStats.totalTimeMinutes * progress)
          });

          if (currentStep >= steps) {
            setAnimatedStats(targetStats);
            clearInterval(timer);
          }
        }, duration / steps);

        return timer;
      };

      const timer = setTimeout(animateValues, 200);
      return () => clearTimeout(timer);
    }
  }, [sessionData]);

  const formatTime = (minutes: number): string => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h${remainingMinutes}m` : `${hours}h`;
  };

  const stats = [
    {
      title: "Score Moyen",
      value: `${animatedStats.averageScore}%`,
      change: animatedStats.averageScore > 70 ? "+5% ce mois" : "En progression",
      icon: Trophy,
      gradient: "from-yellow-500/20 to-yellow-300/5",
      delay: 0
    },
    {
      title: "Sessions Total",
      value: animatedStats.totalSessions,
      change: `${animatedStats.totalSessions} complétées`,
      icon: Target,
      gradient: "from-blue-500/20 to-blue-300/5",
      delay: 0.1
    },
    {
      title: "Série Actuelle",
      value: `${animatedStats.streakDays} jours`,
      change: "Excellent rythme !",
      icon: Flame,
      gradient: "from-red-500/20 to-red-300/5",
      delay: 0.2
    },
    {
      title: "Temps Total",
      value: formatTime(animatedStats.totalTimeMinutes),
      change: "Temps d'étude",
      icon: Clock,
      gradient: "from-green-500/20 to-green-300/5",
      delay: 0.3
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <MetricCard
          key={index}
          title={stat.title}
          value={stat.value}
          change={stat.change}
          icon={stat.icon}
          gradient={stat.gradient}
          delay={stat.delay}
        />
      ))}
    </div>
  );
};