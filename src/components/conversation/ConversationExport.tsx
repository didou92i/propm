import { useState } from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Message } from "@/types/chat";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/utils/logger";

interface ConversationExportProps {
  messages: Message[];
  agentName: string;
  children: React.ReactNode;
}

export function ConversationExport({ messages, agentName, children }: ConversationExportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<"pdf" | "txt" | "md">("pdf");
  const { toast } = useToast();

  const formatMessageForExport = (message: Message): string => {
    const timestamp = message.timestamp.toLocaleString("fr-FR");
    const role = message.role === "user" ? "Utilisateur" : agentName;
    
    let content = `**${role}** (${timestamp})\n${message.content}\n\n`;
    
    if (message.attachments && message.attachments.length > 0) {
      content += `*Pièces jointes:*\n`;
      message.attachments.forEach(att => {
        content += `- ${att.name} (${att.type})\n`;
      });
      content += "\n";
    }
    
    return content;
  };

  const generateMarkdown = (): string => {
    const header = `# Conversation avec ${agentName}\n\n`;
    const date = `*Exportée le ${new Date().toLocaleString("fr-FR")}*\n\n`;
    const summary = `## Résumé\n- **Agent:** ${agentName}\n- **Messages:** ${messages.length}\n- **Période:** ${messages[0]?.timestamp.toLocaleDateString("fr-FR")} - ${messages[messages.length - 1]?.timestamp.toLocaleDateString("fr-FR")}\n\n---\n\n`;
    
    const conversation = messages.map(formatMessageForExport).join("");
    
    return header + date + summary + conversation;
  };

  const generatePlainText = (): string => {
    const header = `CONVERSATION AVEC ${agentName.toUpperCase()}\n`;
    const separator = "=".repeat(50) + "\n\n";
    const date = `Exportée le ${new Date().toLocaleString("fr-FR")}\n\n`;
    
    const conversation = messages.map(message => {
      const timestamp = message.timestamp.toLocaleString("fr-FR");
      const role = message.role === "user" ? "UTILISATEUR" : agentName.toUpperCase();
      
      let content = `[${timestamp}] ${role}:\n${message.content}\n\n`;
      
      if (message.attachments && message.attachments.length > 0) {
        content += "Pièces jointes:\n";
        message.attachments.forEach(att => {
          content += `- ${att.name} (${att.type})\n`;
        });
        content += "\n";
      }
      
      return content + "-".repeat(30) + "\n\n";
    }).join("");
    
    return header + separator + date + conversation;
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const generatePDF = async (content: string, filename: string) => {
    try {
      // Pour une vraie implémentation PDF, utiliser une bibliothèque comme jsPDF ou Puppeteer
      // Pour l'instant, on simule avec un fichier HTML que l'utilisateur peut imprimer en PDF
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Conversation ${agentName}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              max-width: 800px; 
              margin: 0 auto; 
              padding: 20px; 
              line-height: 1.6;
            }
            .header { 
              border-bottom: 2px solid #333; 
              padding-bottom: 20px; 
              margin-bottom: 30px; 
            }
            .message { 
              margin-bottom: 20px; 
              padding: 15px; 
              border-left: 3px solid #007bff; 
              background: #f8f9fa; 
            }
            .user-message { 
              border-left-color: #28a745; 
            }
            .timestamp { 
              color: #666; 
              font-size: 0.9em; 
            }
            .attachments { 
              background: #e9ecef; 
              padding: 10px; 
              margin-top: 10px; 
              border-radius: 4px; 
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Conversation avec ${agentName}</h1>
            <p class="timestamp">Exportée le ${new Date().toLocaleString("fr-FR")}</p>
            <p><strong>Messages:</strong> ${messages.length}</p>
          </div>
          
          <div class="no-print">
            <p><em>Utilisez Ctrl+P (ou Cmd+P) pour imprimer cette conversation en PDF</em></p>
            <hr>
          </div>
          
          ${messages.map(message => `
            <div class="message ${message.role === 'user' ? 'user-message' : ''}">
              <strong>${message.role === 'user' ? 'Utilisateur' : agentName}</strong>
              <span class="timestamp"> - ${message.timestamp.toLocaleString("fr-FR")}</span>
              <div style="margin-top: 10px; white-space: pre-wrap;">${message.content}</div>
              ${message.attachments && message.attachments.length > 0 ? `
                <div class="attachments">
                  <strong>Pièces jointes:</strong>
                  <ul>
                    ${message.attachments.map(att => `<li>${att.name} (${att.type})</li>`).join('')}
                  </ul>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </body>
        </html>
      `;
      
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      
    } catch (error) {
      logger.error('Erreur lors de la génération PDF', error, 'ConversationExport');
      throw error;
    }
  };

  const handleExport = async () => {
    if (messages.length === 0) {
      toast({
        title: "Aucune conversation",
        description: "Il n'y a aucun message à exporter",
        variant: "destructive"
      });
      return;
    }

    setIsExporting(true);
    
    try {
      const timestamp = new Date().toISOString().slice(0, 10);
      const baseFilename = `conversation_${agentName}_${timestamp}`;
      
      switch (exportFormat) {
        case "md":
          const markdownContent = generateMarkdown();
          downloadFile(markdownContent, `${baseFilename}.md`, "text/markdown");
          break;
          
        case "txt":
          const textContent = generatePlainText();
          downloadFile(textContent, `${baseFilename}.txt`, "text/plain");
          break;
          
        case "pdf":
          const pdfContent = generateMarkdown();
          await generatePDF(pdfContent, `${baseFilename}.pdf`);
          break;
      }
      
      toast({
        title: "Export réussi",
        description: `La conversation a été exportée en ${exportFormat.toUpperCase()}`,
      });
      
    } catch (error) {
      logger.error('Erreur lors de l\'export', error, 'ConversationExport');
      toast({
        title: "Erreur d'export",
        description: "Une erreur s'est produite lors de l'export",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="glass">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-primary" />
            Exporter la conversation
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Format d'export</label>
            <Select value={exportFormat} onValueChange={(value: "pdf" | "txt" | "md") => setExportFormat(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    PDF (via impression)
                  </div>
                </SelectItem>
                <SelectItem value="md">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Markdown (.md)
                  </div>
                </SelectItem>
                <SelectItem value="txt">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Texte brut (.txt)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p><strong>Conversation:</strong> {agentName}</p>
            <p><strong>Messages:</strong> {messages.length}</p>
            {messages.length > 0 && (
              <p><strong>Période:</strong> {messages[0]?.timestamp.toLocaleDateString("fr-FR")} - {messages[messages.length - 1]?.timestamp.toLocaleDateString("fr-FR")}</p>
            )}
          </div>
          
          <Button 
            onClick={handleExport} 
            disabled={isExporting || messages.length === 0}
            className="w-full"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Export en cours...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Exporter en {exportFormat.toUpperCase()}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}