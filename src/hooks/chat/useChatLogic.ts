import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStreamingChat } from "@/hooks/useStreamingChat";
import { usePerformanceOptimization } from "@/hooks/usePerformanceOptimization";
import { usePrepaCdsChat } from "@/hooks/usePrepaCdsChat";
import { usePrepaCdsConfig } from "@/hooks/chat/usePrepaCdsConfig";
import { useCdsProEnhancements } from "@/hooks/chat/useCdsProEnhancements";
import { cdsProService } from "@/services/cdsProService";
import { Message, MessageAttachment } from "@/types/chat";
import { toast } from "sonner";
import { logger } from "@/utils/logger";

interface AttachedFile {
  id: string;
  file: File;
  preview?: string;
}

export function useChatLogic(selectedAgent: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [processingAttachment, setProcessingAttachment] = useState(false);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null);

  const { streamingState, sendStreamingMessage } = useStreamingChat();
  const { optimizeMessages } = usePerformanceOptimization();
  const { generateContent: generatePrepaContent } = usePrepaCdsChat();
  const { config: prepaConfig } = usePrepaCdsConfig();
  const cdsPro = useCdsProEnhancements();

  const processAttachments = useCallback(async (attachments: AttachedFile[]): Promise<MessageAttachment[]> => {
    const processedAttachments: MessageAttachment[] = [];
    setProcessingAttachment(true);
    setAttachmentError(null);

    for (const attachment of attachments) {
      try {
        const formData = new FormData();
        formData.append('file', attachment.file);

        const { data, error } = await supabase.functions.invoke('process-document', {
          body: formData
        });

        if (error) {
          logger.error('Supabase function error', error, 'ChatLogic');
          throw new Error(`Erreur de traitement: ${error.message}`);
        }

        if (!data || !data.success) {
          logger.error('Document processing failed', data, 'ChatLogic');
          throw new Error(data?.error || 'Échec du traitement du document');
        }

        toast.success("Document traité avec succès", {
          description: `${attachment.file.name} est maintenant prêt pour l'analyse`,
        });
        
        processedAttachments.push({
          id: attachment.id,
          name: attachment.file.name,
          type: attachment.file.type,
          size: attachment.file.size,
          content: data.extractedText || '',
          documentIds: data.documentIds || []
        });
      } catch (error: any) {
        logger.error('Error processing attachment', error, 'ChatLogic');
        const errorMsg = `Erreur lors du traitement de ${attachment.file.name}: ${error.message}`;
        setAttachmentError(errorMsg);
        
        toast.error("Erreur de traitement", {
          description: errorMsg,
        });
        
        processedAttachments.push({
          id: attachment.id,
          name: attachment.file.name,
          type: attachment.file.type,
          size: attachment.file.size,
          content: `[Erreur de traitement: ${error.message}]`,
          error: error.message
        });
      }
    }

    setProcessingAttachment(false);
    return processedAttachments;
  }, []);

  const sendMessage = useCallback(async (
    content: string,
    attachments: AttachedFile[],
    messages: Message[],
    userSession: { id: string; threadId?: string },
    onMessagesUpdate: (updater: (prev: Message[]) => Message[]) => void
  ) => {
    if (!content.trim() && attachments.length === 0) return;

    setAttachmentError(null);

    if (processingAttachment) {
      toast.warning("Traitement en cours", {
        description: "Veuillez attendre que le traitement des documents soit terminé",
      });
      return;
    }

    // Process attachments
    let processedAttachments: MessageAttachment[] = [];
    if (attachments.length > 0) {
      setIsLoading(true);
      processedAttachments = await processAttachments(attachments);
      
      const hasFailedAttachments = processedAttachments.some(att => att.error || att.content?.startsWith('[Erreur'));
      
      if (hasFailedAttachments && processedAttachments.every(att => att.error || att.content?.startsWith('[Erreur'))) {
        setIsLoading(false);
        toast.error("Erreur de traitement", {
          description: "Aucun document n'a pu être traité correctement. Veuillez réessayer.",
        });
        return;
      }
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: content.trim(),
      role: "user",
      timestamp: new Date(),
      attachments: processedAttachments.length > 0 ? processedAttachments : undefined,
    };

    onMessagesUpdate(prev => [...prev, userMessage]);
    
    if (attachments.length === 0) {
      setIsLoading(true);
    }

    const optimizedMessages = optimizeMessages([...messages, userMessage]);

    // Create assistant message for streaming
    const assistantMessageId = (Date.now() + 1).toString();
    let assistantMessage: Message = {
      id: assistantMessageId,
      content: '',
      role: "assistant",
      timestamp: new Date(),
    };

    onMessagesUpdate(prev => [...prev, assistantMessage]);
    setTypingMessageId(assistantMessageId);

    try {
      // Prepare message content with attachments
      let messageContent = content;
      if (processedAttachments.length > 0) {
        const attachmentContext = processedAttachments
          .filter(att => att.content && !att.content.startsWith('[Erreur') && !att.error)
          .map(att => `[Document: ${att.name}]\n${att.content}`)
          .join('\n\n');
        
        if (attachmentContext) {
          messageContent = `Contexte des documents joints:\n${attachmentContext}\n\nQuestion: ${content}`;
        }
      }

      // Handle PrepaCDS agent
      if (selectedAgent === "prepacds") {
        try {
          const result = await generatePrepaContent(
            prepaConfig.trainingType ?? 'question_ouverte',
            prepaConfig.level ?? 'intermediaire',
            prepaConfig.domain ?? 'droit_administratif'
          );

          // Convert PrepaCDS object result to markdown string
          const contentString = typeof result === 'object' 
            ? `## Contenu d'entraînement généré\n\n\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\``
            : result;

          onMessagesUpdate(prev => prev.map(msg => 
            msg.id === assistantMessageId 
              ? { ...msg, content: contentString }
              : msg
          ));
          setTypingMessageId(null);
          setIsLoading(false);
        } catch (err: any) {
          onMessagesUpdate(prev => prev.map(msg => 
            msg.id === assistantMessageId 
              ? { ...msg, content: `Désolé, une erreur s'est produite: ${err?.message || 'Erreur inconnue'}. Veuillez réessayer.` }
              : msg
          ));
          setTypingMessageId(null);
          setIsLoading(false);
          toast.error("Erreur Prepa CDS", {
            description: err?.message || 'Erreur inconnue',
          });
        }
        return;
      }

      // Handle CDS Pro enrichment
      const buildMessagesForSend = async () => {
        let finalUserContent = messageContent;
        if (selectedAgent === 'cdspro') {
          const isValid = cdsPro.validateSecurityRequest(messageContent);
          if (!isValid) {
            onMessagesUpdate(prev => prev.map(msg => 
              msg.id === assistantMessageId 
                ? { ...msg, content: cdsPro.getSecurityResponse() }
                : msg
            ));
            setTypingMessageId(null);
            setIsLoading(false);
            return null;
          }

          const enriched = cdsPro.enrichPrompt(messageContent);
          const vec = await cdsProService.searchVectorialDatabase(content, cdsPro.configuration.context);
          let vecCtx = '';
          if (vec && vec.length > 0) {
            vecCtx = '\n\nRéférences (extraits):\n' + vec.slice(0, 3).map((r: any, i: number) => `[${i+1}] ${r.content?.slice(0, 280)}...`).join('\n');
            toast.success('Références juridiques incluses', { 
              description: `${Math.min(3, vec.length)} extraits ajoutés.`
            });
          }
          finalUserContent = enriched + vecCtx;
        }
        return optimizedMessages.map((m, i, arr) => (i === arr.length - 1 && m.role === 'user' ? { ...m, content: finalUserContent } : m));
      };

      const messagesToSend = await buildMessagesForSend();
      if (!messagesToSend) return;

      await sendStreamingMessage(
        messagesToSend,
        selectedAgent,
        userSession,
        // onMessageUpdate
        (content: string) => {
          onMessagesUpdate(prev => prev.map(msg => 
            msg.id === assistantMessageId 
              ? { ...msg, content }
              : msg
          ));
        },
        // onComplete
        (finalContent: string, threadId?: string) => {
          onMessagesUpdate(prev => prev.map(msg => 
            msg.id === assistantMessageId 
              ? { ...msg, content: finalContent }
              : msg
          ));
          setTypingMessageId(null);
          setIsLoading(false);
          
          if (threadId) {
            try {
              localStorage.setItem(`openai.thread.${selectedAgent}`, threadId);
            } catch {}
          }
        },
        // onError
        (error: string) => {
          onMessagesUpdate(prev => prev.map(msg => 
            msg.id === assistantMessageId 
              ? { ...msg, content: `Désolé, une erreur s'est produite: ${error}. Veuillez réessayer.` }
              : msg
          ));
          setTypingMessageId(null);
          setIsLoading(false);
          
          toast.error("Erreur de conversation", {
            description: error,
          });
        }
      );

    } catch (error: any) {
      logger.error("Erreur", error, 'ChatLogic');
      onMessagesUpdate(prev => prev.map(msg => 
        msg.id === assistantMessageId 
          ? { ...msg, content: `Désolé, une erreur s'est produite: ${error.message || 'Erreur inconnue'}. Veuillez réessayer.` }
          : msg
      ));
      setTypingMessageId(null);
      setIsLoading(false);
      
      toast.error("Erreur de conversation", {
        description: error.message || 'Erreur inconnue',
      });
    }
  }, [selectedAgent, optimizeMessages, generatePrepaContent, prepaConfig, cdsPro, sendStreamingMessage, processAttachments, processingAttachment]);

  return {
    isLoading,
    processingAttachment,
    attachmentError,
    typingMessageId,
    streamingState,
    sendMessage,
    setAttachmentError
  };
}