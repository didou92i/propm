/**
 * Service de suivi des performances pour les Edge Functions
 */

export class PerformanceTracker {
  private static totalRequests = 0;
  private static totalResponseTime = 0;
  private static successfulStreams = 0;

  static incrementRequests(): void {
    this.totalRequests++;
  }

  static recordSuccessfulStream(responseTime: number): void {
    this.successfulStreams++;
    this.totalResponseTime += responseTime;
  }

  static getStats() {
    return {
      totalRequests: this.totalRequests,
      successfulStreams: this.successfulStreams,
      averageResponseTime: this.successfulStreams > 0 
        ? Math.round(this.totalResponseTime / this.successfulStreams) 
        : 0,
      successRate: this.totalRequests > 0 
        ? Math.round((this.successfulStreams / this.totalRequests) * 100) 
        : 0
    };
  }

  static logRequest(functionName: string, requestData: any): void {
    console.log(`${functionName}: incoming request`, {
      ...requestData,
      timestamp: new Date().toISOString()
    });
  }

  static logOpenAIRequest(functionName: string, requestData: any): void {
    console.log(`${functionName}: starting OpenAI request`, requestData);
  }

  static logCompletion(functionName: string, metrics: any): void {
    console.log(`${functionName}: completed`, metrics);
  }
}