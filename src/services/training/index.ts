// Services de formation
export { statisticsService } from './statisticsService';
export { chartDataTransformer } from './chartDataTransformer';
export { achievementCalculator } from './achievementCalculator';

// Types
export type { TrainingMetrics, ProgressMetrics } from './statisticsService';
export type { ChartDataPoint, DomainChartData } from './chartDataTransformer';
export type { Achievement } from './achievementCalculator';

// Services existants
export { HTMLGenerator, createHTMLGenerator } from './htmlGenerator';
export { trainingContentService } from './trainingContentService';
export type { 
  ContentGenerationOptions, 
  ContentGenerationResult, 
  GenerationMetrics 
} from './trainingContentService';