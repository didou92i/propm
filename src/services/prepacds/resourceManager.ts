import type { StudyDomain, UserLevel, LegalReference } from './types';

export class ResourceManager {
  suggestResources(domain: StudyDomain, level: UserLevel, specificTopic?: string): {
    manuals: any[];
    exercises: any[];
    jurisprudence: any[];
    videos: any[];
    websites: any[];
  } {
    const baseResources = this.getBaseResources(domain);
    const levelResources = this.getLevelSpecificResources(domain, level);
    const topicResources = specificTopic ? this.getTopicResources(domain, specificTopic) : [];

    return {
      manuals: [...baseResources.manuals, ...levelResources.manuals],
      exercises: [...baseResources.exercises, ...levelResources.exercises, ...topicResources],
      jurisprudence: baseResources.jurisprudence,
      videos: levelResources.videos || [],
      websites: baseResources.websites
    };
  }

  generateSummarySheet(domain: StudyDomain, topic: string, level: UserLevel): {
    title: string;
    keyPoints: string[];
    definitions: { term: string; definition: string }[];
    examples: string[];
    legalReferences: LegalReference[];
    exercises: string[];
  } {
    return {
      title: `Fiche de révision : ${topic}`,
      keyPoints: this.getKeyPoints(domain, topic),
      definitions: this.getDefinitions(domain, topic),
      examples: this.getExamples(domain, topic),
      legalReferences: this.getLegalReferences(domain, topic),
      exercises: this.getRelatedExercises(domain, topic, level)
    };
  }

  private getBaseResources(domain: StudyDomain) {
    const resourceMap: Record<StudyDomain, any> = {
      police_municipale: {
        manuals: [
          { title: 'Code général des collectivités territoriales', type: 'officiel' },
          { title: 'Manuel de police municipale', type: 'formation' }
        ],
        exercises: [
          { type: 'qcm', title: 'QCM Police municipale' },
          { type: 'cas', title: 'Cas pratiques courants' }
        ],
        jurisprudence: [
          { tribunal: 'CE', date: '2023', affaire: 'Pouvoirs de police' }
        ],
        websites: [
          { nom: 'Collectivités locales', url: 'collectivites-locales.gouv.fr' }
        ]
      },
      securite_publique: {
        manuals: [
          { title: 'Guide de la sécurité publique', type: 'formation' },
          { title: 'Prévention situationnelle', type: 'specialise' }
        ],
        exercises: [
          { type: 'simulation', title: 'Gestion de crise' },
          { type: 'etude_cas', title: 'Analyse de situations' }
        ],
        jurisprudence: [
          { tribunal: 'CE', date: '2023', affaire: 'Ordre public' }
        ],
        websites: [
          { nom: 'INHESJ', url: 'inhesj.fr' }
        ]
      },
      reglementation: {
        manuals: [
          { title: 'Code de la route', type: 'officiel' },
          { title: 'Réglementation municipale', type: 'formation' }
        ],
        exercises: [
          { type: 'application', title: 'Application des règlements' }
        ],
        jurisprudence: [
          { tribunal: 'CE', date: '2023', affaire: 'Réglementation locale' }
        ],
        websites: [
          { nom: 'Légifrance', url: 'legifrance.gouv.fr' }
        ]
      },
      procedure_penale: {
        manuals: [
          { title: 'Code de procédure pénale', type: 'officiel' },
          { title: 'Procédure pénale simplifiée', type: 'formation' }
        ],
        exercises: [
          { type: 'redaction', title: 'Rédaction de PV' }
        ],
        jurisprudence: [
          { tribunal: 'Cass. Crim.', date: '2023', affaire: 'Procédure' }
        ],
        websites: [
          { nom: 'Ministère de la Justice', url: 'justice.gouv.fr' }
        ]
      },
      droit_administratif: {
        manuals: [
          { title: 'Code de justice administrative', type: 'officiel' },
          { title: 'Droit administratif général', type: 'formation' }
        ],
        exercises: [
          { type: 'contentieux', title: 'Cas de contentieux' }
        ],
        jurisprudence: [
          { tribunal: 'CE', date: '2023', affaire: 'Service public' }
        ],
        websites: [
          { nom: 'Conseil d\'État', url: 'conseil-etat.fr' }
        ]
      },
      management: {
        manuals: [
          { title: 'Management public', type: 'formation' },
          { title: 'Leadership dans la fonction publique', type: 'specialise' }
        ],
        exercises: [
          { type: 'mise_situation', title: 'Situations managériales' }
        ],
        jurisprudence: [],
        websites: [
          { nom: 'CNFPT', url: 'cnfpt.fr' }
        ]
      },
      ethique_deontologie: {
        manuals: [
          { title: 'Code de déontologie', type: 'officiel' },
          { title: 'Éthique professionnelle', type: 'formation' }
        ],
        exercises: [
          { type: 'dilemme', title: 'Dilemmes éthiques' }
        ],
        jurisprudence: [
          { tribunal: 'CE', date: '2023', affaire: 'Déontologie' }
        ],
        websites: [
          { nom: 'Défenseur des droits', url: 'defenseurdesdroits.fr' }
        ]
      }
    };

    return resourceMap[domain] || { manuals: [], exercises: [], jurisprudence: [], websites: [] };
  }

  private getLevelSpecificResources(domain: StudyDomain, level: UserLevel) {
    const levelResources: Record<UserLevel, any> = {
      debutant: {
        manuals: [{ title: 'Guide du débutant', type: 'initiation' }],
        exercises: [{ type: 'base', title: 'Exercices de base' }],
        videos: [{ title: 'Introduction vidéo', duree: '30min' }]
      },
      intermediaire: {
        manuals: [{ title: 'Approfondissement', type: 'intermediaire' }],
        exercises: [{ type: 'intermediaire', title: 'Cas intermédiaires' }],
        videos: [{ title: 'Masterclass', duree: '60min' }]
      },
      avance: {
        manuals: [{ title: 'Expertise avancée', type: 'avance' }],
        exercises: [{ type: 'complexe', title: 'Cas complexes' }],
        videos: [{ title: 'Séminaire expert', duree: '90min' }]
      },
      expert: {
        manuals: [{ title: 'Référence experte', type: 'expert' }],
        exercises: [{ type: 'expert', title: 'Défis d\'expert' }],
        videos: [{ title: 'Colloque spécialisé', duree: '120min' }]
      }
    };

    return levelResources[level] || { manuals: [], exercises: [], videos: [] };
  }

  private getTopicResources(domain: StudyDomain, topic: string) {
    return [
      { type: 'specifique', title: `Exercices spécifiques : ${topic}` },
      { type: 'approfondissement', title: `Approfondissement : ${topic}` }
    ];
  }

  private getKeyPoints(domain: StudyDomain, topic: string): string[] {
    return [
      `Point clé 1 sur ${topic}`,
      `Point clé 2 sur ${topic}`,
      `Point clé 3 sur ${topic}`
    ];
  }

  private getDefinitions(domain: StudyDomain, topic: string): { term: string; definition: string }[] {
    return [
      { term: 'Terme 1', definition: 'Définition du terme 1' },
      { term: 'Terme 2', definition: 'Définition du terme 2' }
    ];
  }

  private getExamples(domain: StudyDomain, topic: string): string[] {
    return [
      `Exemple 1 pour ${topic}`,
      `Exemple 2 pour ${topic}`
    ];
  }

  private getLegalReferences(domain: StudyDomain, topic: string): LegalReference[] {
    return [
      {
        code: 'CGCT',
        article: 'Art. L2212-1',
        title: 'Pouvoirs de police du maire',
        url: 'https://legifrance.gouv.fr'
      }
    ];
  }

  private getRelatedExercises(domain: StudyDomain, topic: string, level: UserLevel): string[] {
    return [
      `Exercice 1 : ${topic} (${level})`,
      `Exercice 2 : ${topic} (${level})`
    ];
  }
}