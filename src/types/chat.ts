
export interface MessageAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  content?: string; // Pour le contenu extrait
  url?: string;
  preview?: string;
  extractedText?: string;
  documentIds?: string[];
  error?: string; // Pour les erreurs de traitement
  warning?: string; // Pour les avertissements
}

export interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  attachments?: MessageAttachment[];
}
