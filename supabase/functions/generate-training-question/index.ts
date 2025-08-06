import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { level, domain, questionType, avoidRecentTopics } = await req.json();

    console.log('Génération question:', { level, domain, questionType });

    // Construction du prompt spécialisé pour Prepa CDS
    const systemPrompt = `Tu es un expert en préparation au concours de Chef de Service de Police Municipale. 
    
Génère une question d'entraînement de type "${questionType}" pour le niveau "${level}" dans le domaine "${domain}".

**CONTRAINTES OBLIGATOIRES:**
- Question réaliste et conforme aux épreuves du concours
- Niveau de difficulté adapté au profil "${level}"
- Références juridiques précises et actualisées
- Explication pédagogique détaillée

**FORMAT DE RÉPONSE REQUIS:**
{
  "question": "Question formulée clairement",
  "options": ["A", "B", "C", "D"] (pour QCM uniquement),
  "correctAnswer": "Réponse correcte",
  "explanation": "Explication détaillée avec analyse et références",
  "references": [
    {
      "article": "Article L.511-1",
      "code": "Code de la sécurité intérieure",
      "content": "Texte de l'article",
      "url": "URL légifrance si disponible"
    }
  ],
  "difficulty": "Niveau de difficulté 1-5",
  "domain": "${domain}",
  "learningObjectives": ["Objectif 1", "Objectif 2"]
}

**INSTRUCTIONS SELON LE NIVEAU:**
- Débutant: Concepts de base, définitions claires, exemples simples
- Intermédiaire: Applications pratiques, cas concrets, nuances juridiques
- Avancé: Situations complexes, jurisprudence, cas d'exception

**INSTRUCTIONS SELON LE DOMAINE:**
- droit_public: CGCT, pouvoirs de police, contentieux administratif, marchés publics
- droit_penal: Code pénal, procédures, infractions, responsabilité pénale
- management: GRH, organisation, planification, leadership, évaluation
- procedures: Protocoles opérationnels, chaîne de commandement, urgences
- redaction: Notes de service, rapports, correspondance, style administratif
- culture_generale: Actualités sécuritaires, réformes, évolutions réglementaires

Génère UNE SEULE question de qualité professionnelle.`;

    const userPrompt = `Génère une question de type "${questionType}" pour:
- Niveau: ${level}
- Domaine: ${domain}
- Éviter répétitions: ${avoidRecentTopics ? 'Oui' : 'Non'}

La question doit être immédiatement utilisable pour l'entraînement d'un candidat.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`Erreur OpenAI: ${response.status}`);
    }

    const data = await response.json();
    let generatedContent = data.choices[0].message.content;

    // Extraction du JSON de la réponse
    let questionData;
    try {
      // Tentative d'extraction du JSON
      const jsonMatch = generatedContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        questionData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Format JSON non trouvé');
      }
    } catch (parseError) {
      console.error('Erreur parsing JSON:', parseError);
      // Fallback avec structure de base
      questionData = {
        question: generatedContent.split('\n')[0] || `Question ${questionType} pour ${domain}`,
        options: questionType === 'qcm' ? ['Option A', 'Option B', 'Option C', 'Option D'] : [],
        correctAnswer: 'Réponse à déterminer',
        explanation: 'Explication générée par l\'IA',
        references: [],
        difficulty: level === 'debutant' ? 2 : level === 'intermediaire' ? 3 : 4,
        domain: domain,
        learningObjectives: [`Maîtriser ${domain}`]
      };
    }

    // Log de la question générée (pour monitoring)
    try {
      await supabase
        .from('training_questions_log')
        .insert({
          level,
          domain,
          question_type: questionType,
          question_content: questionData.question,
          generated_at: new Date().toISOString()
        });
    } catch (logError) {
      console.error('Erreur log question:', logError);
      // Ne pas faire échouer la requête pour un problème de log
    }

    console.log('Question générée avec succès');

    return new Response(JSON.stringify(questionData), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      },
    });

  } catch (error) {
    console.error('Erreur génération question:', error);
    
    // Réponse de fallback en cas d'erreur
    const fallbackQuestion = {
      question: `Question d'entraînement générée pour le domaine demandé`,
      options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
      correctAnswer: 'Option 1',
      explanation: 'Cette question sera développée ultérieurement avec les références appropriées.',
      references: [],
      difficulty: 3,
      domain: 'general',
      learningObjectives: ['Révision générale']
    };

    return new Response(JSON.stringify(fallbackQuestion), {
      status: 200, // Retourner 200 avec fallback plutôt qu'une erreur
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      },
    });
  }
});