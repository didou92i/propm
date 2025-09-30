/**
 * Service de traitement des flux SSE pour OpenAI
 */

import { getErrorMessage } from './errorHelpers.ts';

export interface StreamMetrics {
  totalTime: number;
  firstTokenLatency: number;
  tokenCount: number;
  tokensPerSecond: number;
}

export interface StreamConfig {
  startTime: number;
  isOptimized?: boolean;
}

export class StreamProcessor {
  private encoder = new TextEncoder();
  private fullContent = '';
  private tokenCount = 0;
  private firstTokenTime: number | null = null;
  private startTime: number;
  private isOptimized: boolean;

  constructor(config: StreamConfig) {
    this.startTime = config.startTime;
    this.isOptimized = config.isOptimized || false;
  }

  createStream(response: Response): ReadableStream<Uint8Array> {
    return new ReadableStream({
      start: (controller) => this.handleStream(response, controller)
    });
  }

  private async handleStream(response: Response, controller: ReadableStreamDefaultController) {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    // Send immediate start signal
    this.sendEvent(controller, 'start', { status: "streaming_started" });

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          this.sendCompletionEvent(controller);
          break;
        }

        await this.processChunk(value, controller);
      }
    } catch (error) {
      console.error('Streaming error:', error);
      this.sendEvent(controller, 'error', { error: getErrorMessage(error) });
    } finally {
      reader.releaseLock();
      controller.close();
    }
  }

  private async processChunk(value: Uint8Array, controller: ReadableStreamDefaultController) {
    const chunk = new TextDecoder().decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        
        if (data === '[DONE]') {
          continue;
        }

        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta;
          
          if (delta?.content) {
            this.processToken(delta.content, controller);
          }
        } catch (error) {
          // Silently skip invalid JSON to maintain stream flow
          if (!this.isOptimized) {
            console.warn('Failed to parse SSE data:', data);
          }
          continue;
        }
      }
    }
  }

  private processToken(content: string, controller: ReadableStreamDefaultController) {
    if (!this.firstTokenTime) {
      this.firstTokenTime = Date.now();
      console.log(`First token received, latency: ${this.firstTokenTime - this.startTime}ms`);
    }
    
    this.fullContent += content;
    this.tokenCount++;
    
    const tokenData: any = {
      token: content,
      content: this.fullContent
    };

    // Add token count for non-optimized version
    if (!this.isOptimized) {
      tokenData.tokenCount = this.tokenCount;
    }
    
    this.sendEvent(controller, 'token', tokenData);
  }

  private sendCompletionEvent(controller: ReadableStreamDefaultController) {
    const endTime = Date.now();
    const metrics: StreamMetrics = {
      totalTime: endTime - this.startTime,
      firstTokenLatency: this.firstTokenTime ? this.firstTokenTime - this.startTime : 0,
      tokenCount: this.tokenCount,
      tokensPerSecond: this.tokenCount / ((endTime - this.startTime) / 1000)
    };
    
    this.sendEvent(controller, 'complete', { 
      content: this.fullContent,
      performance: metrics
    });
    
    console.log('Stream completed:', {
      ...metrics,
      contentLength: this.fullContent.length,
      tokensPerSecond: Math.round(metrics.tokensPerSecond)
    });
  }

  private sendEvent(
    controller: ReadableStreamDefaultController, 
    event: string, 
    data: any
  ) {
    controller.enqueue(this.encoder.encode(`event: ${event}\n`));
    controller.enqueue(this.encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
  }

  static createErrorStream(error: string, responseTime: number, corsHeaders: Record<string, string>): Response {
    const encoder = new TextEncoder();
    const errorStream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('event: error\n'));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          error,
          responseTime 
        })}\n\n`));
        controller.close();
      }
    });

    return new Response(errorStream, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  }
}