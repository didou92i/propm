import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ActivityData {
  date: string;
  sessionsCount: number;
  averageScore: number;
}

interface ActivityCalendarProps {
  recentActivity: ActivityData[];
  isLoading?: boolean;
}

export const ActivityCalendar: React.FC<ActivityCalendarProps> = ({ 
  recentActivity = [], 
  isLoading = false 
}) => {
  // Générer les 5 dernières semaines (35 jours)
  const generateCalendarDays = () => {
    const days = [];
    const today = new Date();
    
    for (let i = 34; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      days.push(date);
    }
    return days;
  };

  const calendarDays = generateCalendarDays();

  // Mapper les données d'activité avec les jours du calendrier
  const getActivityForDate = (date: Date) => {
    if (!recentActivity || !Array.isArray(recentActivity)) return undefined;
    
    const dateString = date.toDateString();
    return recentActivity.find(activity => 
      new Date(activity.date).toDateString() === dateString
    );
  };

  // Calculer l'intensité de l'activité pour la couleur
  const getIntensityLevel = (activity?: ActivityData) => {
    if (!activity || activity.sessionsCount === 0) return 0;
    
    // Normaliser le nombre de sessions (1-4+ sessions)
    const sessions = Math.min(activity.sessionsCount, 4);
    return sessions / 4; // Retourne une valeur entre 0 et 1
  };

  // Obtenir la classe CSS pour l'intensité
  const getIntensityClass = (intensity: number) => {
    if (intensity === 0) return 'bg-muted/20 border-muted hover:border-primary/30';
    if (intensity <= 0.25) return 'bg-primary/20 border-primary/40 hover:border-primary/60';
    if (intensity <= 0.5) return 'bg-primary/40 border-primary/60 hover:border-primary/80';
    if (intensity <= 0.75) return 'bg-primary/60 border-primary/80 hover:border-primary';
    return 'bg-primary border-primary hover:bg-primary/90';
  };

  const formatTooltipContent = (date: Date, activity?: ActivityData) => {
    const dateStr = date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    if (!activity || activity.sessionsCount === 0) {
      return (
        <div>
          <div className="font-medium">{dateStr}</div>
          <div className="text-sm text-muted-foreground">Aucune activité</div>
        </div>
      );
    }

    return (
      <div>
        <div className="font-medium">{dateStr}</div>
        <div className="text-sm space-y-1">
          <div>{activity.sessionsCount} session{activity.sessionsCount > 1 ? 's' : ''}</div>
          {activity.averageScore > 0 && (
            <div>Score moyen: {activity.averageScore}%</div>
          )}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card className="glass neomorphism">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Calendrier d'Activité
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
                <div key={day} className="text-xs text-center text-muted-foreground font-medium py-2">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 35 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-md bg-muted/20 animate-pulse"
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass neomorphism">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Calendrier d'Activité
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* En-têtes des jours */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
              <div key={day} className="text-xs text-center text-muted-foreground font-medium py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Grille des jours d'activité */}
          <TooltipProvider>
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((date, i) => {
                const activity = getActivityForDate(date);
                const intensity = getIntensityLevel(activity);
                const intensityClass = getIntensityClass(intensity);

                return (
                  <Tooltip key={i}>
                    <TooltipTrigger asChild>
                      <motion.div
                        className={`aspect-square rounded-md border-2 cursor-pointer transition-all duration-200 ${intensityClass}`}
                        whileHover={{ scale: 1.1 }}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.02 }}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      {formatTooltipContent(date, activity)}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </TooltipProvider>

          {/* Légende */}
          <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
            <span>Moins actif</span>
            <div className="flex gap-1">
              {[0.2, 0.4, 0.6, 0.8].map((opacity, i) => (
                <div 
                  key={i}
                  className="w-3 h-3 rounded-sm bg-primary"
                  style={{ opacity }}
                />
              ))}
            </div>
            <span>Plus actif</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};