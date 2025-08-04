export interface RippleConfig {
  variant: 'default' | 'enhanced' | 'subtle';
  duration?: number;
  color?: string;
}

export interface ThemeConfig {
  agent: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

export interface PerformanceMetrics {
  memoryUsage: number;
  renderTime: number;
  messageCount: number;
  lastCleanup: Date;
}