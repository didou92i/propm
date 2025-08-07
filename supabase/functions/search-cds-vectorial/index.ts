import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchRequest {
  query: string;
  database: string;
  context: 'rural' | 'moyenne' | 'metropole' | 'large';
  filters?: {
    police_municipale?: boolean;
    droit_administratif?: boolean;
  };
  maxResults?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: {
            Authorization: req.headers.get('Authorization') || '',
          },
        },
      }
    );

    const { query, database, context, filters = {}, maxResults = 10 }: SearchRequest = await req.json();

    console.log(`CDS Pro vectorial search: "${query}" in context: ${context}`);

    // Enrichissement de la requête selon le contexte territorial
    const enrichedQuery = enrichQueryWithContext(query, context);

    // Génération de l'embedding pour la recherche
    const { data: embeddingData, error: embeddingError } = await supabase.functions.invoke('generate-embedding', {
      body: { text: enrichedQuery }
    });

    if (embeddingError) {
      console.error('Error generating embedding:', embeddingError);
      throw new Error('Erreur lors de la génération de l\'embedding');
    }

    // Recherche dans la base vectorielle avec filtres CDS Pro
    const { data: searchResults, error: searchError } = await supabase.rpc('match_documents_hierarchical', {
      query_embedding: embeddingData.embedding,
      match_count: maxResults,
      level_filter: determineSearchLevel(context)
    });

    if (searchError) {
      console.error('Error in vectorial search:', searchError);
      throw new Error('Erreur lors de la recherche vectorielle');
    }

    // Filtrage et enrichissement des résultats selon les critères CDS Pro
    const filteredResults = filterResultsForCdsPro(searchResults || [], filters, context);
    
    // Ajout des références juridiques automatiques
    const enrichedResults = await addLegalReferences(filteredResults, query, context);

    console.log(`Found ${enrichedResults.length} relevant results for CDS Pro`);

    return new Response(
      JSON.stringify({
        success: true,
        results: enrichedResults,
        context,
        database,
        query: enrichedQuery
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in CDS Pro search:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

/**
 * Enrichit la requête selon le contexte territorial
 */
function enrichQueryWithContext(query: string, context: string): string {
  const contextKeywords = {
    rural: ['intercommunalité', 'mutualisation', 'polyvalence', 'gendarmerie'],
    moyenne: ['brigade', 'coordination', 'prévention', 'police nationale'],
    metropole: ['vidéoprotection', 'centre supervision', 'unité spécialisée', 'métropole'],
  };

  const keywords = contextKeywords[context as keyof typeof contextKeywords] || [];
  let enriched = query.trim();

  if (keywords.length > 0) {
    const enrichedTerms = keywords.join(' OR ');
    enriched += ` AND (${enrichedTerms})`;
  }

  // Always bias towards police municipale context
  enriched += ' AND police municipale';
  return enriched;
}

/**
 * Détermine le niveau de recherche selon le contexte
 */
function determineSearchLevel(context: string): string | null {
  switch (context) {
    case 'rural':
      return 'document'; // Recherche large pour communes rurales
    case 'moyenne':
      return 'paragraph'; // Recherche équilibrée
    case 'metropole':
      return 'title'; // Recherche précise pour métropoles
    case 'large':
      return null; // Pas de filtrage de niveau
    default:
      return null;
  }
}

/**
 * Filtre les résultats selon les critères CDS Pro
 */
function filterResultsForCdsPro(results: any[], filters: any, context: string): any[] {
  return results
    .filter(result => {
      // Filtrage par police municipale
      if (filters.police_municipale) {
        const content = result.content?.toLowerCase() || '';
        const policeMunicipaleTerms = ['police municipale', 'pm', 'csi', 'cgct', 'maire'];
        if (!policeMunicipaleTerms.some(term => content.includes(term))) {
          return false;
        }
      }

      // Filtrage par droit administratif
      if (filters.droit_administratif) {
        const content = result.content?.toLowerCase() || '';
        const droitAdminTerms = ['arrêté', 'délibération', 'pouvoir police', 'maire', 'préfet'];
        if (!droitAdminTerms.some(term => content.includes(term))) {
          return false;
        }
      }

      return true;
    })
    .map(result => ({
      ...result,
      cds_pro_score: calculateCdsProScore(result, context),
      territory_context: context
    }))
    .sort((a, b) => b.cds_pro_score - a.cds_pro_score);
}

/**
 * Calcule un score spécifique CDS Pro
 */
function calculateCdsProScore(result: any, context: string): number {
  let score = result.similarity || 0;
  const content = result.content?.toLowerCase() || '';
  const metadata = result.metadata || {};

  // Bonus pour termes CDS Pro spécifiques
  const cdsProTerms = ['police municipale', 'csi', 'cgct', 'l.511', 'l.512', 'assermentation'];
  const termMatches = cdsProTerms.filter(term => content.includes(term)).length;
  score += termMatches * 0.1;

  // Bonus selon le contexte territorial
  const contextBonus = {
    rural: ['intercommunalité', 'mutualisation', 'gendarmerie'],
    moyenne: ['brigade', 'coordination', 'police nationale'],
    metropole: ['vidéoprotection', 'centre supervision', 'unité']
  };

  const contextTerms = contextBonus[context as keyof typeof contextBonus] || [];
  const contextMatches = contextTerms.filter(term => content.includes(term)).length;
  score += contextMatches * 0.05;

  // Bonus pour documents officiels
  if (metadata.type === 'official' || content.includes('article') || content.includes('loi')) {
    score += 0.2;
  }

  return Math.min(score, 1);
}

/**
 * Ajoute des références juridiques automatiques
 */
async function addLegalReferences(results: any[], query: string, context: string): Promise<any[]> {
  const legalReferences = generateLegalReferences(query, context);
  
  return results.map(result => ({
    ...result,
    legal_references: legalReferences,
    cds_pro_context: {
      territory: context,
      applicable_codes: ['CSI', 'CGCT', 'Code de la route'],
      priority_level: determinePriorityLevel(result.content)
    }
  }));
}

/**
 * Génère des références juridiques pertinentes
 */
function generateLegalReferences(query: string, context: string): any[] {
  const references = [];
  const queryLower = query.toLowerCase();

  // Références CSI
  if (queryLower.includes('police municipale') || queryLower.includes('compétence')) {
    references.push({
      code: 'Code de la Sécurité Intérieure',
      article: 'L.511-1',
      title: 'Compétences des agents de police municipale'
    });
  }

  // Références CGCT
  if (queryLower.includes('maire') || queryLower.includes('pouvoir police')) {
    references.push({
      code: 'Code général des collectivités territoriales',
      article: 'L.2212-1',
      title: 'Pouvoirs de police du maire'
    });
  }

  // Références spécifiques au contexte
  if (context === 'rural' && queryLower.includes('mutualisation')) {
    references.push({
      code: 'Code de la Sécurité Intérieure',
      article: 'L.511-2',
      title: 'Mutualisation des services de police municipale'
    });
  }

  return references;
}

/**
 * Détermine le niveau de priorité selon le contenu
 */
function determinePriorityLevel(content: string): string {
  const contentLower = content.toLowerCase();
  
  if (contentLower.includes('urgence') || contentLower.includes('sécurité')) {
    return 'urgence';
  }
  if (contentLower.includes('conformité') || contentLower.includes('légalité')) {
    return 'conformite';
  }
  if (contentLower.includes('procédure') || contentLower.includes('organisation')) {
    return 'optimisation';
  }
  
  return 'planification';
}