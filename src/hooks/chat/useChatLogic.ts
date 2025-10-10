import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStreamingChat } from "@/hooks/useStreamingChat";
import { usePerformanceOptimization } from "@/hooks/usePerformanceOptimization";
import { useDocumentCache } from "./useDocumentCache";
import { Message, MessageAttachment } from "@/types/chat";
import { toast } from "sonner";
import { logger } from "@/utils/logger";
import { redacproFallbackPrompt } from "@/config/prompts/redacpro-fallback";

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
  const { getCachedDocument, cacheDocument } = useDocumentCache();

  const processAttachments = useCallback(async (attachments: AttachedFile[]): Promise<MessageAttachment[]> => {
    const processedAttachments: MessageAttachment[] = [];
    setProcessingAttachment(true);
    setAttachmentError(null);

    for (const attachment of attachments) {
      try {
        // Check cache first
        const cached = getCachedDocument(attachment.file);
        if (cached) {
          processedAttachments.push({
            id: cached.id,
            name: cached.filename,
            type: 'document',
            size: attachment.file.size,
            content: cached.extractedText
          } as MessageAttachment);
          
          toast.success("Document trouvé en cache", {
            description: `${attachment.file.name} déjà traité récemment`,
          });
          continue;
        }

        const formData = new FormData();
        formData.append('file', attachment.file);

        const { data, error } = await supabase.functions.invoke('process-document', {
          body: formData
        });

        if (error) {
          logger.error('Supabase function error', error, 'ChatLogic');
          
          // Gestion spécifique des erreurs de rate limit
          if (error.message?.includes('rate limit') || error.message?.includes('429')) {
            throw new Error('🚦 L\'API est temporairement saturée. Réessayez dans quelques secondes ou copiez-collez le texte directement.');
          }
          
          throw new Error(`Erreur de traitement: ${error.message}`);
        }

        if (!data || !data.success) {
          logger.error('Document processing failed', data, 'ChatLogic');
          
          // Si c'est un problème de processing mais qu'on a du texte extrait
          if (data?.extractedText && data.extractedText.length > 0) {
            // Cache même les documents partiellement traités
            const cachedResult = cacheDocument(attachment.file, data);
            
            processedAttachments.push({
              id: cachedResult.id,
              name: attachment.file.name,
              type: attachment.file.type,
              size: attachment.file.size,
              content: data.extractedText,
              warning: 'Traitement partiel réussi'
            } as MessageAttachment);
            
            toast.warning("Document partiellement traité", {
              description: `${attachment.file.name} - Contenu extrait disponible`,
            });
            continue;
          }
          
          throw new Error(data?.error || 'Échec du traitement du document');
        }

        // Cache successful result
        cacheDocument(attachment.file, data);

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


      const messagesToSend: Message[] = [...optimizedMessages];
      
      // Remplacer le dernier message utilisateur avec le contenu enrichi des documents
      if (messagesToSend.length > 0 && messageContent !== content) {
        messagesToSend[messagesToSend.length - 1] = {
          ...messagesToSend[messagesToSend.length - 1],
          content: messageContent
        };
      }

      console.log('📎 Document processing:', {
        originalContent: content,
        enrichedContent: messageContent,
        attachmentsCount: processedAttachments.length,
        hasEnrichment: messageContent !== content
      });

      // Send the streaming message with enriched content
      await sendStreamingMessage(
        messagesToSend,
        selectedAgent,
        userSession,
        messageContent, // Pass enriched content with attachments
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
  }, [selectedAgent, optimizeMessages, sendStreamingMessage, processAttachments, processingAttachment]);

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