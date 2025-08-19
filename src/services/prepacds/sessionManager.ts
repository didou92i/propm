import type { SessionHistory, ExerciseMemory } from './types';

export class SessionManager {
  private sessionHistory = new Map<string, SessionHistory>();
  private exerciseMemory = new Map<string, ExerciseMemory[]>();

  recordExercise(sessionId: string, content: string, type: string): void {
    const contentHash = this.generateContentHash(content);
    
    if (!this.exerciseMemory.has(sessionId)) {
      this.exerciseMemory.set(sessionId, []);
    }
    
    const exercises = this.exerciseMemory.get(sessionId)!;
    exercises.push({
      contentHash,
      timestamp: new Date(),
      type
    });
    
    // Garder seulement les 50 derniers exercices pour éviter une mémoire trop importante
    if (exercises.length > 50) {
      exercises.splice(0, exercises.length - 50);
    }
  }

  getSessionHistory(sessionId: string): SessionHistory {
    if (!this.sessionHistory.has(sessionId)) {
      this.sessionHistory.set(sessionId, {
        exercises: [],
        questions: [],
        cases: [],
        documents: [],
        timestamp: new Date()
      });
    }
    return this.sessionHistory.get(sessionId)!;
  }

  updateSessionHistory(
    sessionId: string, 
    type: 'exercise' | 'question' | 'case' | 'document', 
    id: string
  ): void {
    const history = this.getSessionHistory(sessionId);
    
    switch (type) {
      case 'exercise':
        if (!history.exercises.includes(id)) {
          history.exercises.push(id);
        }
        break;
      case 'question':
        if (!history.questions.includes(id)) {
          history.questions.push(id);
        }
        break;
      case 'case':
        if (!history.cases.includes(id)) {
          history.cases.push(id);
        }
        break;
      case 'document':
        if (!history.documents.includes(id)) {
          history.documents.push(id);
        }
        break;
    }
    
    history.timestamp = new Date();
  }

  isContentAlreadyProposed(sessionId: string, content: string): boolean {
    const contentHash = this.generateContentHash(content);
    const exercises = this.exerciseMemory.get(sessionId) || [];
    
    return exercises.some(exercise => 
      exercise.contentHash === contentHash && 
      (Date.now() - exercise.timestamp.getTime()) < 24 * 60 * 60 * 1000 // 24h
    );
  }

  clearSession(sessionId: string): void {
    this.sessionHistory.delete(sessionId);
    this.exerciseMemory.delete(sessionId);
  }

  getSessionStats(sessionId: string): {
    totalExercises: number;
    totalQuestions: number;
    totalCases: number;
    totalDocuments: number;
    sessionDuration: number;
  } {
    const history = this.getSessionHistory(sessionId);
    const sessionStart = history.timestamp;
    const sessionDuration = Date.now() - sessionStart.getTime();

    return {
      totalExercises: history.exercises.length,
      totalQuestions: history.questions.length,
      totalCases: history.cases.length,
      totalDocuments: history.documents.length,
      sessionDuration: Math.floor(sessionDuration / 1000 / 60) // en minutes
    };
  }

  private generateContentHash(content: string): string {
    // Simple hash function pour identifier le contenu
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }
}