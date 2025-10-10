import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface IndexStats {
  timestamp: string;
  documents_index: {
    index_name: string;
    scans: number;
    tuples_read: number;
    tuples_fetched: number;
    index_size: string;
    table_size: string;
  };
  job_posts_index: {
    index_name: string;
    scans: number;
    tuples_read: number;
    tuples_fetched: number;
    index_size: string;
    table_size: string;
  };
  recommendations: string[];
}

interface SearchBenchmark {
  query: string;
  duration: number;
  resultCount: number;
  timestamp: Date;
}

export const useIndexMonitoring = () => {
  const [indexStats, setIndexStats] = useState<IndexStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [benchmarks, setBenchmarks] = useState<SearchBenchmark[]>([]);

  const getIndexPerformance = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_index_performance');
      
      if (error) {
        console.error('Error fetching index performance:', error);
        throw error;
      }

      setIndexStats(data as unknown as IndexStats);
      return data as unknown as IndexStats;
    } catch (error) {
      console.error('Failed to get index performance:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const benchmarkSearch = useCallback(async (
    searchFn: () => Promise<any[]>,
    query: string
  ) => {
    const start = performance.now();
    const results = await searchFn();
    const duration = performance.now() - start;

    const benchmark: SearchBenchmark = {
      query,
      duration,
      resultCount: results.length,
      timestamp: new Date()
    };

    setBenchmarks(prev => [benchmark, ...prev].slice(0, 10)); // Keep last 10 benchmarks
    
    console.log(`🔍 Search benchmark: ${query}`, {
      duration: `${duration.toFixed(2)}ms`,
      results: results.length,
      performance: duration < 100 ? '✅ Excellent' : duration < 500 ? '⚠️ Acceptable' : '❌ Slow'
    });

    return { results, benchmark };
  }, []);

  const clearBenchmarks = useCallback(() => {
    setBenchmarks([]);
  }, []);

  const getAverageSearchTime = useCallback(() => {
    if (benchmarks.length === 0) return 0;
    const total = benchmarks.reduce((sum, b) => sum + b.duration, 0);
    return total / benchmarks.length;
  }, [benchmarks]);

  const getIndexUtilization = useCallback(() => {
    if (!indexStats) return null;

    return {
      documents: {
        utilization: indexStats.documents_index.scans > 0 ? 'Active' : 'Unused',
        efficiency: indexStats.documents_index.tuples_read > 0
          ? ((indexStats.documents_index.tuples_fetched / indexStats.documents_index.tuples_read) * 100).toFixed(1)
          : '0',
        recommendations: indexStats.recommendations
      },
      job_posts: {
        utilization: indexStats.job_posts_index.scans > 0 ? 'Active' : 'Unused',
        efficiency: indexStats.job_posts_index.tuples_read > 0
          ? ((indexStats.job_posts_index.tuples_fetched / indexStats.job_posts_index.tuples_read) * 100).toFixed(1)
          : '0'
      }
    };
  }, [indexStats]);

  return {
    // State
    indexStats,
    isLoading,
    benchmarks,
    
    // Actions
    getIndexPerformance,
    benchmarkSearch,
    clearBenchmarks,
    
    // Computed
    getAverageSearchTime,
    getIndexUtilization
  };
};
