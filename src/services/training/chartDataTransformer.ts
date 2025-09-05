import type { TrainingSessionData } from '@/hooks/useTrainingSession';

export interface ChartDataPoint {
  date: string;
  score: number;
  sessions?: number;
  time?: number;
}

export interface DomainChartData {
  name: string;
  value: number;
  fill: string;
  color: string;
}

/**
 * Service pour transformer les données en format adapté aux graphiques
 */
export const chartDataTransformer = {
  /**
   * Transforme les données de performance pour les graphiques temporels
   */
  transformPerformanceData(
    sessionData: TrainingSessionData, 
    period: 'week' | 'month' | 'year' = 'month'
  ): ChartDataPoint[] {
    const { recentActivity = [] } = sessionData;
    
    if (recentActivity.length === 0) {
      return this.generateEmptyTimeSeriesData(period);
    }

    const days = this.getPeriodDays(period);
    const now = new Date();
    
    return Array.from({ length: days }, (_, i) => {
      const date = new Date(now.getTime() - (days - 1 - i) * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const activity = recentActivity.find((a: any) => a.date === dateStr);
      
      return {
        date: this.formatDateForChart(date, period),
        score: activity?.averageScore || 0,
        sessions: activity?.sessionsCount || 0,
        time: (activity?.sessionsCount || 0) * 15 // 15min par session estimé
      };
    });
  },

  /**
   * Transforme les données de domaine pour les graphiques en secteurs
   */
  transformDomainData(sessionData: TrainingSessionData): DomainChartData[] {
    const { sessionsByDomain } = sessionData;
    
    if (!sessionsByDomain || Object.keys(sessionsByDomain).length === 0) {
      return [{
        name: 'Aucune donnée',
        value: 100,
        fill: 'hsl(var(--muted))',
        color: 'hsl(var(--muted))'
      }];
    }

    const domainNames = this.getDomainDisplayNames();
    const colors = this.getDomainColors();
    
    return Object.entries(sessionsByDomain).map(([domain, count], index) => ({
      name: domainNames[domain] || domain,
      value: count,
      fill: colors[index % colors.length],
      color: colors[index % colors.length]
    }));
  },

  /**
   * Transforme les données pour les graphiques de trend
   */
  transformTrendData(sessionData: TrainingSessionData): ChartDataPoint[] {
    const { recentActivity = [] } = sessionData;
    
    return recentActivity
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(activity => ({
        date: new Date(activity.date).toLocaleDateString('fr-FR', { 
          month: 'short', 
          day: 'numeric' 
        }),
        score: activity.averageScore,
        sessions: activity.sessionsCount
      }));
  },

  /**
   * Utilitaires
   */
  getPeriodDays(period: 'week' | 'month' | 'year'): number {
    switch (period) {
      case 'week': return 7;
      case 'month': return 30;
      case 'year': return 365;
      default: return 30;
    }
  },

  formatDateForChart(date: Date, period: 'week' | 'month' | 'year'): string {
    if (period === 'year') {
      return date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
    }
    return date.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });
  },

  generateEmptyTimeSeriesData(period: 'week' | 'month' | 'year'): ChartDataPoint[] {
    const days = this.getPeriodDays(period);
    const now = new Date();
    
    return Array.from({ length: Math.min(days, 7) }, (_, i) => {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      return {
        date: this.formatDateForChart(date, period),
        score: 0,
        sessions: 0,
        time: 0
      };
    }).reverse();
  },

  getDomainDisplayNames(): Record<string, string> {
    return {
      'droit_administratif': 'Droit Administratif',
      'droit_penal': 'Droit Pénal', 
      'police_municipale': 'Police Municipale',
      'securite_publique': 'Sécurité Publique',
      'reglementation': 'Réglementation',
      'procedure_penale': 'Procédure Pénale',
      'management': 'Management',
      'ethique_deontologie': 'Éthique & Déontologie'
    };
  },

  getDomainColors(): string[] {
    return [
      'hsl(var(--primary))',
      'hsl(var(--secondary))',
      'hsl(var(--accent))',
      'hsl(220 14.3% 65.9%)',
      'hsl(210 40% 60%)',
      'hsl(280 35% 60%)',
      'hsl(160 60% 45%)',
      'hsl(30 80% 55%)'
    ];
  }
};