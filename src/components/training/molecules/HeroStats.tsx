import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { StatCard } from '../atoms/StatCard';
import { Users, Trophy, TrendingUp } from 'lucide-react';

export const HeroStats: React.FC = () => {
  const [statsCounter, setStatsCounter] = useState({ sessions: 0, students: 0, successRate: 0 });

  useEffect(() => {
    const animateStats = () => {
      const targetStats = { sessions: 15420, students: 3250, successRate: 94 };
      const duration = 2000;
      const steps = 60;
      const stepDuration = duration / steps;
      
      let currentStep = 0;
      const timer = setInterval(() => {
        currentStep++;
        const progress = currentStep / steps;
        
        setStatsCounter({
          sessions: Math.floor(targetStats.sessions * progress),
          students: Math.floor(targetStats.students * progress),
          successRate: Math.floor(targetStats.successRate * progress)
        });
        
        if (currentStep >= steps) {
          setStatsCounter(targetStats);
          clearInterval(timer);
        }
      }, stepDuration);
      
      return () => clearInterval(timer);
    };

    const timer = setTimeout(animateStats, 500);
    return () => clearTimeout(timer);
  }, []);

  const stats = [
    {
      title: "Sessions Complétées",
      value: statsCounter.sessions.toLocaleString(),
      subtitle: "+12% ce mois",
      icon: Trophy,
      delay: 0.2
    },
    {
      title: "Étudiants Actifs",
      value: statsCounter.students.toLocaleString(),
      subtitle: "Communauté grandissante",
      icon: Users,
      delay: 0.4
    },
    {
      title: "Taux de Réussite",
      value: `${statsCounter.successRate}%`,
      subtitle: "Excellence confirmée",
      icon: TrendingUp,
      delay: 0.6
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.4 }}
      className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto"
    >
      {stats.map((stat, index) => (
        <StatCard
          key={index}
          title={stat.title}
          value={stat.value}
          subtitle={stat.subtitle}
          icon={stat.icon}
          delay={stat.delay}
        />
      ))}
    </motion.div>
  );
};