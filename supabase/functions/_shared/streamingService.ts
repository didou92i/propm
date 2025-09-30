/**
 * Service de streaming SSE pour OpenAI
 * Extraction sécurisée de la logique de streaming depuis chat-openai-stream
 */

import { PollingService } from './pollingService.ts';
import { getErrorMessage } from './errorHelpers.ts';

interface StreamingConfig {
  openAIApiKey: string;
  threadId: string;
  runId: string;
  corsHeaders: Record<string, string>;
}

export class StreamingService {
  static createSSEResponse(config: StreamingConfig): Response {
    const { openAIApiKey, threadId, runId, corsHeaders } = config;
    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Feedback immédiat
          StreamingService.sendStatusEvent(controller, encoder, 'thinking', 'L\'assistant réfléchit...');
          
          // Polling avec callbacks SSE
          const result = await PollingService.pollForCompletion({
            openAIApiKey,
            threadId,
            runId,
            maxAttempts: 70,
            isSSE: true
          });

          if (result.status === 'completed' && result.content) {
            StreamingService.sendCompleteEvent(controller, encoder, result.content, threadId);
          } else {
            StreamingService.sendErrorEvent(controller, encoder, 'Assistant did not complete successfully');
          }
          
        } catch (error) {
          console.error('streaming-service: error', error);
          StreamingService.sendErrorEvent(controller, encoder, getErrorMessage(error));
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  }

  private static sendStatusEvent(
    controller: ReadableStreamDefaultController,
    encoder: TextEncoder,
    status: string,
    message: string
  ): void {
    controller.enqueue(encoder.encode('event: status\n'));
    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status, message })}\n\n`));
  }

  private static sendCompleteEvent(
    controller: ReadableStreamDefaultController,
    encoder: TextEncoder,
    content: string,
    threadId: string
  ): void {
    controller.enqueue(encoder.encode('event: complete\n'));
    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content, threadId })}\n\n`));
  }

  private static sendErrorEvent(
    controller: ReadableStreamDefaultController,
    encoder: TextEncoder,
    error: string
  ): void {
    controller.enqueue(encoder.encode('event: error\n'));
    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error })}\n\n`));
  }
}