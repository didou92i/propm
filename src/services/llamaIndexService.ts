import { 
  VectorStoreIndex, 
  Document, 
  Settings
} from 'llamaindex';
import { supabase } from '@/integrations/supabase/client';

export interface LlamaSearchResult {
  id: string;
  content: string;
  metadata: any;
  score: number;
  relevanceScore: number;
  level: 'title' | 'paragraph' | 'document';
  nodeId?: string;
  sourceDocument?: string;
}

export interface LlamaSearchOptions {
  maxResults?: number;
  threshold?: number;
  queryType?: 'semantic' | 'hybrid' | 'contextual';
  retrievalStrategy?: 'default' | 'auto_merging' | 'hierarchical';
  responseMode?: 'compact' | 'simple_summarize' | 'tree_summarize';
}

class LlamaIndexService {
  private index: VectorStoreIndex | null = null;
  private queryEngine: any = null;
  private isInitialized = false;
  private cache = new Map<string, any>();
  private readonly CACHE_DURATION = 3600000; // 1 hour

  constructor() {
    // Initialize settings if needed
  }

  /**
   * Initialize the index with existing documents from Supabase
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('Initializing LlamaIndex service...');
      
      // Fetch documents from Supabase
      const { data: documents, error } = await supabase
        .from('documents')
        .select('id, content, metadata');

      if (error) throw error;

      if (!documents || documents.length === 0) {
        console.log('No documents found, creating empty index');
        // Create empty index
        const emptyDoc = new Document({ text: "Empty index", id_: "empty" });
        this.index = await VectorStoreIndex.fromDocuments([emptyDoc]);
        this.isInitialized = true;
        return;
      }

      // Convert Supabase documents to LlamaIndex Documents
      const llamaDocuments = documents.map(doc => new Document({
        text: doc.content || '',
        id_: doc.id,
        metadata: Object.assign(
          doc.metadata || {},
          {
            sourceType: 'police_document',
            documentId: doc.id
          }
        )
      }));

      // Create index
      console.log(`Creating index from ${llamaDocuments.length} documents...`);
      this.index = await VectorStoreIndex.fromDocuments(llamaDocuments);

      // Create query engine
      this.queryEngine = this.index.asQueryEngine({
        similarityTopK: 10,
      });

      this.isInitialized = true;
      console.log('LlamaIndex service initialized successfully');

    } catch (error) {
      console.error('Error initializing LlamaIndex:', error);
      throw error;
    }
  }

  /**
   * Perform enhanced semantic search with LlamaIndex
   */
  async search(
    query: string,
    options: LlamaSearchOptions = {}
  ): Promise<LlamaSearchResult[]> {
    await this.initialize();

    if (!this.index || !query.trim()) return [];

    const {
      maxResults = 10,
      threshold = 0.3,
      retrievalStrategy = 'default'
    } = options;

    try {
      const cacheKey = `${query}-${JSON.stringify(options)}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        return cached.results;
      }

      let results: LlamaSearchResult[] = [];

      switch (retrievalStrategy) {
        case 'hierarchical':
          results = await this.hierarchicalSearch(query, options);
          break;
        case 'auto_merging':
          results = await this.autoMergingSearch(query, options);
          break;
        default:
          results = await this.defaultSearch(query, options);
      }

      // Filter by threshold and limit results
      const filteredResults = results
        .filter(result => result.score >= threshold)
        .slice(0, maxResults);

      // Cache results
      this.cache.set(cacheKey, {
        results: filteredResults,
        timestamp: Date.now()
      });

      return filteredResults;

    } catch (error) {
      console.error('LlamaIndex search error:', error);
      return [];
    }
  }

  /**
   * Default semantic search using vector similarity
   */
  private async defaultSearch(
    query: string,
    options: LlamaSearchOptions
  ): Promise<LlamaSearchResult[]> {
    if (!this.queryEngine || !this.index) return [];

    try {
      const retriever = this.index.asRetriever({
        similarityTopK: options.maxResults || 10,
      });

      const nodes = await retriever.retrieve(query);

      return nodes.map(node => ({
        id: node.node.id_,
        content: node.node.text || '',
        metadata: node.node.metadata,
        score: node.score || 0,
        relevanceScore: this.calculateRelevanceScore(node, query),
        level: this.determineNodeLevel(node.node),
        nodeId: node.node.id_,
        sourceDocument: node.node.metadata.documentId
      }));
    } catch (error) {
      console.error('Default search error:', error);
      return [];
    }
  }

  /**
   * Hierarchical search across multiple levels
   */
  private async hierarchicalSearch(
    query: string,
    options: LlamaSearchOptions
  ): Promise<LlamaSearchResult[]> {
    if (!this.index) return [];

    try {
      // For now, use default search with weighted results
      const retriever = this.index.asRetriever({
        similarityTopK: (options.maxResults || 10) * 2,
      });

      const nodes = await retriever.retrieve(query);

      // Simulate hierarchical scoring based on content length
      return nodes.map(node => {
        const contentLength = (node.node.text || '').length;
        let level: 'title' | 'paragraph' | 'document' = 'paragraph';
        let weight = 0.5;

        if (contentLength < 200) {
          level = 'title';
          weight = 0.3;
        } else if (contentLength > 1000) {
          level = 'document';
          weight = 0.4;
        }

        return {
          id: node.node.id_,
          content: node.node.text || '',
          metadata: node.node.metadata,
          score: (node.score || 0) * weight,
          relevanceScore: this.calculateRelevanceScore(node, query) * weight,
          level,
          nodeId: node.node.id_,
          sourceDocument: node.node.metadata.documentId
        };
      }).sort((a, b) => b.score - a.score);
    } catch (error) {
      console.error('Hierarchical search error:', error);
      return [];
    }
  }

  /**
   * Auto-merging search that reconstructs context
   */
  private async autoMergingSearch(
    query: string,
    options: LlamaSearchOptions
  ): Promise<LlamaSearchResult[]> {
    if (!this.index) return [];

    try {
      // Find relevant chunks with higher count for merging
      const retriever = this.index.asRetriever({
        similarityTopK: 20,
      });

      const nodes = await retriever.retrieve(query);

      // Group by parent document and merge related chunks
      const mergedResults = this.mergeRelatedNodes(nodes, query);

      return mergedResults.map(result => ({
        id: result.id,
        content: result.content,
        metadata: result.metadata,
        score: result.score,
        relevanceScore: result.relevanceScore,
        level: 'paragraph' as const,
        nodeId: result.id,
        sourceDocument: result.metadata.documentId
      }));
    } catch (error) {
      console.error('Auto-merging search error:', error);
      return [];
    }
  }

  /**
   * Contextual search using conversation history
   */
  async contextualSearch(
    query: string,
    conversationHistory: string[],
    maxResults: number = 5
  ): Promise<LlamaSearchResult[]> {
    await this.initialize();

    if (!this.index) return [];

    // Enhance query with conversation context
    const contextPrompt = `
    Given the conversation history: ${conversationHistory.slice(-3).join(' ')}
    
    Enhanced query: ${query}
    
    Focus on finding documents that are relevant to both the specific query and the conversation context.
    `;

    return this.search(contextPrompt, {
      maxResults,
      queryType: 'contextual',
      retrievalStrategy: 'auto_merging'
    });
  }

  /**
   * Police-specific query routing
   */
  async policeQueryRouter(query: string): Promise<LlamaSearchResult[]> {
    const queryLower = query.toLowerCase();
    
    // Detect query type and route appropriately
    if (queryLower.includes('procès-verbal') || queryLower.includes('pv')) {
      return this.search(query, {
        retrievalStrategy: 'hierarchical',
        responseMode: 'tree_summarize',
        maxResults: 5
      });
    }
    
    if (queryLower.includes('rapport') || queryLower.includes('investigation')) {
      return this.search(query, {
        retrievalStrategy: 'auto_merging',
        responseMode: 'compact',
        maxResults: 8
      });
    }
    
    if (queryLower.includes('réglementation') || queryLower.includes('loi')) {
      return this.search(query, {
        retrievalStrategy: 'hierarchical',
        responseMode: 'simple_summarize',
        maxResults: 10
      });
    }

    // Default search for general queries
    return this.search(query, {
      retrievalStrategy: 'default',
      maxResults: 10
    });
  }

  /**
   * Add new document to the index
   */
  async addDocument(content: string, metadata: any): Promise<void> {
    await this.initialize();

    if (!this.index) throw new Error('Index not initialized');

    const document = new Document({
      text: content,
      id_: metadata.id || crypto.randomUUID(),
      metadata: {
        ...metadata,
        sourceType: 'police_document',
        addedAt: new Date().toISOString()
      }
    });

    try {
      await this.index.insert(document);
      this.clearCache(); // Clear cache when new documents are added
    } catch (error) {
      console.error('Error adding document to index:', error);
      throw error;
    }
  }

  /**
   * Helper methods
   */
  private calculateRelevanceScore(node: any, query: string): number {
    let score = node.score || 0;
    
    const content = node.node.getContent().toLowerCase();
    const metadata = node.node.metadata;
    const queryTerms = query.toLowerCase().split(' ');

    // Boost for exact matches
    const exactMatches = queryTerms.filter(term => content.includes(term)).length;
    score += (exactMatches / queryTerms.length) * 0.2;

    // Boost for document type relevance
    if (metadata.filename) {
      const filename = metadata.filename.toLowerCase();
      if (queryTerms.some(term => filename.includes(term))) {
        score += 0.15;
      }
    }

    // Boost for recent documents
    if (metadata.processed_at) {
      const daysSince = (Date.now() - new Date(metadata.processed_at).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince < 30) score += 0.1;
    }

    return Math.min(score, 1);
  }

  private determineNodeLevel(node: any): 'title' | 'paragraph' | 'document' {
    const content = node.getContent();
    
    if (content.length < 200) return 'title';
    if (content.length < 1000) return 'paragraph';
    return 'document';
  }

  private mergeRelatedNodes(nodes: any[], query: string): any[] {
    // Group nodes by parent document
    const groupedNodes = new Map<string, any[]>();
    
    nodes.forEach(node => {
      const docId = node.node.metadata.documentId || node.node.id_;
      if (!groupedNodes.has(docId)) {
        groupedNodes.set(docId, []);
      }
      groupedNodes.get(docId)!.push(node);
    });

    // Merge nodes from same document if they're contextually related
    const mergedResults: any[] = [];
    
    groupedNodes.forEach((docNodes, docId) => {
      if (docNodes.length > 1) {
        // Combine content and average scores
        const combinedContent = docNodes.map(n => n.node.getContent()).join('\n\n');
        const avgScore = docNodes.reduce((sum, n) => sum + (n.score || 0), 0) / docNodes.length;
        
        mergedResults.push({
          id: docId,
          content: combinedContent,
          metadata: docNodes[0].node.metadata,
          score: avgScore,
          relevanceScore: avgScore
        });
      } else {
        const node = docNodes[0];
        mergedResults.push({
          id: node.node.id_,
          content: node.node.getContent(),
          metadata: node.node.metadata,
          score: node.score || 0,
          relevanceScore: node.score || 0
        });
      }
    });

    return mergedResults.sort((a, b) => b.score - a.score);
  }

  /**
   * Cache management
   */
  clearCache(): void {
    this.cache.clear();
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }

  /**
   * Index management
   */
  async rebuildIndex(): Promise<void> {
    this.isInitialized = false;
    this.index = null;
    this.queryEngine = null;
    this.clearCache();
    await this.initialize();
  }

  getIndexStats() {
    return {
      isInitialized: this.isInitialized,
      hasIndex: !!this.index,
      hasQueryEngine: !!this.queryEngine,
      cacheSize: this.cache.size
    };
  }
}

export const llamaIndexService = new LlamaIndexService();