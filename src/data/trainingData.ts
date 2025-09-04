// Données statiques garanties pour chaque type d'entraînement

import type { TrainingType, UserLevel, StudyDomain } from '@/types/prepacds';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'facile' | 'moyen' | 'difficile';
}

export interface TrueFalseQuestion {
  id: string;
  statement: string;
  isCorrect: boolean;
  explanation: string;
  domain: string;
}

export interface CasePracticeStep {
  id: string;
  title: string;
  scenario: string;
  question: string;
  expectedPoints: string[];
  timeLimit: number; // minutes
}

export interface CasePracticeData {
  title: string;
  context: string;
  steps: CasePracticeStep[];
  totalTime: number;
}

// Données statiques QCM enrichies pour plus de diversité
export const staticQCMData: Record<StudyDomain, QuizQuestion[]> = {
  droit_administratif: [
    {
      id: "q1",
      question: "Quelle est la hiérarchie des normes en droit administratif français ?",
      options: [
        "Constitution, lois, décrets, arrêtés",
        "Lois, Constitution, décrets, arrêtés", 
        "Décrets, lois, Constitution, arrêtés",
        "Constitution, décrets, lois, arrêtés"
      ],
      correctAnswer: 0,
      explanation: "La hiérarchie des normes suit l'ordre : Constitution (sommet), lois, décrets, puis arrêtés.",
      difficulty: "moyen"
    },
    {
      id: "q2", 
      question: "Qu'est-ce que le principe de légalité en droit administratif ?",
      options: [
        "L'administration peut tout faire",
        "L'administration doit respecter les lois",
        "L'administration crée les lois",
        "L'administration est au-dessus des lois"
      ],
      correctAnswer: 1,
      explanation: "Le principe de légalité impose que l'administration respecte et applique les lois en vigueur.",
      difficulty: "facile"
    },
    {
      id: "q3",
      question: "Quelle juridiction juge les litiges entre particuliers et administration ?",
      options: [
        "Tribunal judiciaire",
        "Tribunal administratif", 
        "Cour de cassation",
        "Tribunal des conflits"
      ],
      correctAnswer: 1,
      explanation: "Le tribunal administratif est compétent pour les litiges entre particuliers et administration.",
      difficulty: "facile"
    },
    {
      id: "q4",
      question: "Quel est le délai de recours contentieux contre un acte administratif ?",
      options: [
        "1 mois",
        "2 mois",
        "3 mois",
        "6 mois"
      ],
      correctAnswer: 1,
      explanation: "Le délai de recours contentieux est de 2 mois à compter de la notification ou publication de l'acte.",
      difficulty: "moyen"
    },
    {
      id: "q5",
      question: "Qu'est-ce qu'un acte administratif unilatéral ?",
      options: [
        "Un contrat entre administration et particulier",
        "Une décision prise par l'administration seule",
        "Un accord entre deux administrations",
        "Une loi votée par le Parlement"
      ],
      correctAnswer: 1,
      explanation: "L'acte administratif unilatéral est une décision prise par l'administration de manière unilatérale.",
      difficulty: "facile"
    },
    {
      id: "q6",
      question: "Quel principe régit l'accès aux documents administratifs ?",
      options: [
        "Principe de confidentialité",
        "Principe de transparence",
        "Principe de secret",
        "Principe de discrétion"
      ],
      correctAnswer: 1,
      explanation: "Le principe de transparence, codifié par la loi de 1978, régit l'accès aux documents administratifs.",
      difficulty: "moyen"
    },
    {
      id: "q7",
      question: "Qu'est-ce que le pouvoir réglementaire ?",
      options: [
        "Le pouvoir de faire des lois",
        "Le pouvoir de prendre des décrets et arrêtés",
        "Le pouvoir de juger",
        "Le pouvoir de contrôler"
      ],
      correctAnswer: 1,
      explanation: "Le pouvoir réglementaire permet à l'administration de prendre des décrets et arrêtés.",
      difficulty: "moyen"
    },
    {
      id: "q8",
      question: "Quel est l'objet du recours pour excès de pouvoir ?",
      options: [
        "Obtenir des dommages-intérêts",
        "Annuler un acte administratif illégal",
        "Modifier un contrat administratif",
        "Nommer un fonctionnaire"
      ],
      correctAnswer: 1,
      explanation: "Le recours pour excès de pouvoir vise à faire annuler un acte administratif illégal.",
      difficulty: "difficile"
    }
  ],
  police_municipale: [
    {
      id: "q1",
      question: "Qui exerce le pouvoir de police municipale ?",
      options: [
        "Le préfet",
        "Le maire",
        "Le conseil municipal",
        "Le commissaire de police"
      ],
      correctAnswer: 1,
      explanation: "Le maire détient le pouvoir de police municipale en tant qu'agent de l'État.",
      difficulty: "facile"
    },
    {
      id: "q2",
      question: "Quels sont les trois objectifs de la police municipale ?",
      options: [
        "Sécurité, salubrité, tranquillité publiques",
        "Ordre, discipline, contrôle",
        "Surveillance, répression, prévention",
        "Information, communication, médiation"
      ],
      correctAnswer: 0,
      explanation: "La police municipale vise à assurer la sécurité, la salubrité et la tranquillité publiques.",
      difficulty: "moyen"
    },
    {
      id: "q3",
      question: "Quel texte encadre les pouvoirs de police du maire ?",
      options: [
        "Code civil",
        "Code général des collectivités territoriales",
        "Code de procédure pénale",
        "Code de l'urbanisme"
      ],
      correctAnswer: 1,
      explanation: "Le CGCT, notamment l'article L. 2212-2, définit les pouvoirs de police du maire.",
      difficulty: "moyen"
    }
  ],
  securite_publique: [
    {
      id: "q1",
      question: "Quelle est la mission première des forces de sécurité publique ?",
      options: [
        "Maintenir l'ordre public",
        "Collecter des impôts",
        "Gérer les élections",
        "Organiser les transports"
      ],
      correctAnswer: 0,
      explanation: "Le maintien de l'ordre public est la mission fondamentale des forces de sécurité.",
      difficulty: "facile"
    },
    {
      id: "q2",
      question: "Qu'est-ce qu'une infraction pénale ?",
      options: [
        "Une erreur administrative",
        "Un comportement contraire à la loi pénale",
        "Un conflit civil",
        "Une négligence professionnelle"
      ],
      correctAnswer: 1,
      explanation: "L'infraction pénale est tout comportement prohibé par la loi pénale et sanctionné.",
      difficulty: "facile"
    }
  ],
  reglementation: [
    {
      id: "q1",
      question: "Qu'est-ce qu'un règlement dans la hiérarchie des normes ?",
      options: [
        "Une norme supérieure à la loi",
        "Une norme inférieure à la loi",
        "Une norme égale à la loi",
        "Une norme sans valeur juridique"
      ],
      correctAnswer: 1,
      explanation: "Le règlement est une norme inférieure à la loi dans la hiérarchie des normes.",
      difficulty: "moyen"
    },
    {
      id: "q2",
      question: "Qui peut prendre un règlement ?",
      options: [
        "Uniquement le Parlement",
        "Uniquement le Président",
        "L'autorité administrative compétente",
        "Uniquement les juges"
      ],
      correctAnswer: 2,
      explanation: "Les règlements sont pris par les autorités administratives dans leurs domaines de compétence.",
      difficulty: "moyen"
    }
  ],
  procedure_penale: [
    {
      id: "q1",
      question: "Quelles sont les trois catégories d'infractions en droit pénal ?",
      options: [
        "Crimes, délits, contraventions",
        "Majeur, mineur, négligeable",
        "Civil, pénal, administratif", 
        "Public, privé, mixte"
      ],
      correctAnswer: 0,
      explanation: "Le droit pénal distingue trois catégories : crimes (les plus graves), délits, et contraventions.",
      difficulty: "facile"
    },
    {
      id: "q2",
      question: "Quel est le principe fondamental de la responsabilité pénale ?",
      options: [
        "Responsabilité collective",
        "Responsabilité personnelle",
        "Responsabilité familiale",
        "Responsabilité d'entreprise"
      ],
      correctAnswer: 1,
      explanation: "La responsabilité pénale est personnelle : chacun ne répond que de ses propres actes.",
      difficulty: "moyen"
    },
    {
      id: "q3",
      question: "Qu'est-ce que la présomption d'innocence ?",
      options: [
        "Tout accusé est coupable jusqu'à preuve du contraire",
        "Tout accusé est innocent jusqu'à preuve du contraire",
        "La culpabilité doit être prouvée par l'accusé",
        "L'innocence n'existe pas en droit pénal"
      ],
      correctAnswer: 1,
      explanation: "La présomption d'innocence est un principe fondamental : toute personne est présumée innocente tant que sa culpabilité n'a pas été établie.",
      difficulty: "facile"
    }
  ],
  management: [
    {
      id: "q1",
      question: "Quels sont les quatre fonctions principales du management ?",
      options: [
        "Planifier, organiser, diriger, contrôler",
        "Vendre, acheter, produire, distribuer",
        "Recruter, former, évaluer, licencier",
        "Innover, créer, développer, investir"
      ],
      correctAnswer: 0,
      explanation: "Les quatre fonctions du management selon Fayol sont : planifier, organiser, diriger et contrôler.",
      difficulty: "moyen"
    },
    {
      id: "q2",
      question: "Qu'est-ce que le leadership transformationnel ?",
      options: [
        "Un style autoritaire",
        "Un style qui inspire et motive l'équipe vers une vision",
        "Un style laissez-faire",
        "Un style purement administratif"
      ],
      correctAnswer: 1,
      explanation: "Le leadership transformationnel inspire et motive les collaborateurs vers une vision partagée.",
      difficulty: "difficile"
    },
    {
      id: "q3",
      question: "Quelle est la différence entre efficacité et efficience ?",
      options: [
        "Il n'y en a pas",
        "L'efficacité c'est faire les bonnes choses, l'efficience c'est bien faire les choses",
        "L'efficience c'est faire les bonnes choses, l'efficacité c'est bien faire les choses",
        "Les deux termes sont synonymes"
      ],
      correctAnswer: 1,
      explanation: "L'efficacité concerne l'atteinte des objectifs, l'efficience concerne l'optimisation des moyens.",
      difficulty: "moyen"
    }
  ],
  ethique_deontologie: [
    {
      id: "q1",
      question: "Qu'est-ce que la déontologie ?",
      options: [
        "L'étude des dents",
        "L'ensemble des règles de conduite professionnelle",
        "La science des comportements",
        "L'art de négocier"
      ],
      correctAnswer: 1,
      explanation: "La déontologie désigne l'ensemble des règles et devoirs qui régissent une profession.",
      difficulty: "facile"
    },
    {
      id: "q2",
      question: "Quel principe guide l'action du fonctionnaire ?",
      options: [
        "L'intérêt personnel",
        "L'intérêt général",
        "L'intérêt de son administration",
        "L'intérêt de ses collègues"
      ],
      correctAnswer: 1,
      explanation: "Le fonctionnaire doit servir l'intérêt général avant toute autre considération.",
      difficulty: "facile"
    }
  ]
};

// Données statiques Vrai/Faux
export const staticTrueFalseData: Record<StudyDomain, TrueFalseQuestion[]> = {
  droit_administratif: [
    {
      id: "tf1",
      statement: "Un acte administratif peut être annulé par le juge administratif s'il est illégal.",
      isCorrect: true,
      explanation: "Effectivement, le juge administratif peut annuler un acte administratif illégal dans le cadre du recours pour excès de pouvoir.",
      domain: "Droit administratif"
    },
    {
      id: "tf2", 
      statement: "L'administration peut prendre n'importe quelle décision sans justification.",
      isCorrect: false,
      explanation: "Faux. L'administration doit motiver ses décisions et respecter le principe de légalité.",
      domain: "Droit administratif"
    }
  ],
  police_municipale: [
    {
      id: "tf1",
      statement: "Le maire peut déléguer ses pouvoirs de police municipale à un adjoint.",
      isCorrect: true,
      explanation: "Vrai. Le maire peut déléguer certains de ses pouvoirs de police municipale à ses adjoints par arrêté.",
      domain: "Police municipale"
    }
  ],
  securite_publique: [
    {
      id: "tf1",
      statement: "La sécurité publique est uniquement une mission de l'État.",
      isCorrect: false,
      explanation: "Faux. La sécurité publique est une mission partagée entre l'État et les collectivités territoriales.",
      domain: "Sécurité publique"
    }
  ],
  reglementation: [
    {
      id: "tf1",
      statement: "Un règlement peut contredire une loi.",
      isCorrect: false,
      explanation: "Faux. Le règlement doit respecter la hiérarchie des normes et ne peut contredire une loi.",
      domain: "Réglementation"
    }
  ],
  procedure_penale: [
    {
      id: "tf1",
      statement: "Une personne peut être condamnée pour un acte qui n'était pas punissable au moment où elle l'a commis.",
      isCorrect: false,
      explanation: "Faux. C'est le principe de non-rétroactivité de la loi pénale : nulla poena sine lege.",
      domain: "Procédure pénale"
    }
  ],
  management: [
    {
      id: "tf1",
      statement: "Le leadership et le management sont exactement la même chose.",
      isCorrect: false,
      explanation: "Faux. Le leadership concerne l'influence et la vision, tandis que le management concerne l'organisation et le contrôle.",
      domain: "Management"
    }
  ],
  ethique_deontologie: [
    {
      id: "tf1",
      statement: "Un courrier administratif doit toujours utiliser la forme passive.",
      isCorrect: false,
      explanation: "Faux. Il faut privilégier la forme active pour plus de clarté et de dynamisme.",
      domain: "Éthique & Déontologie"
    }
  ]
};

// Données statiques Cas Pratiques
export const staticCasePracticeData: Record<StudyDomain, CasePracticeData> = {
  droit_administratif: {
    title: "Recours contre un arrêté municipal",
    context: "Un maire prend un arrêté interdisant la circulation sur une place publique. Des commerçants contestent cette décision qui affecte leur activité.",
    totalTime: 30,
    steps: [
      {
        id: "step1",
        title: "Analyse des faits",
        scenario: "Des commerçants contestent un arrêté municipal qui interdit la circulation sur une place publique, affectant directement leur activité commerciale.",
        question: "Quels sont les moyens de droit que peuvent invoquer les commerçants dans leur recours ?",
        expectedPoints: [
          "Incompétence du maire",
          "Vice de forme", 
          "Violation de la loi",
          "Détournement de pouvoir"
        ],
        timeLimit: 15
      }
    ]
  },
  police_municipale: {
    title: "Contrôle des terrasses",
    context: "Un restaurant installe une terrasse sur le domaine public sans autorisation. Le maire doit intervenir.",
    totalTime: 25,
    steps: [
      {
        id: "step1",
        title: "Analyse de la situation",
        scenario: "Un restaurateur a installé une terrasse sur le trottoir devant son établissement sans autorisation d'occupation du domaine public.",
        question: "Quelles mesures le maire peut-il prendre ?",
        expectedPoints: [
          "Mise en demeure de régulariser",
          "Arrêté de police",
          "Évacuation forcée si nécessaire",
          "Sanctions pécuniaires"
        ],
        timeLimit: 15
      }
    ]
  },
  securite_publique: {
    title: "Gestion d'un événement public",
    context: "Organisation d'un festival dans le centre-ville avec risques pour la sécurité publique.",
    totalTime: 30,
    steps: [
      {
        id: "step1",
        title: "Évaluation des risques",
        scenario: "Un festival de musique doit se tenir sur la place principale avec 5000 participants attendus.",
        question: "Quelles mesures de sécurité mettre en place ?",
        expectedPoints: [
          "Plan de circulation",
          "Dispositif de sécurité",
          "Évacuation d'urgence",
          "Coordination avec forces de l'ordre"
        ],
        timeLimit: 20
      }
    ]
  },
  reglementation: {
    title: "Élaboration d'un règlement",
    context: "Création d'un règlement municipal pour l'usage des espaces verts.",
    totalTime: 35,
    steps: [
      {
        id: "step1",
        title: "Rédaction du règlement",
        scenario: "La commune souhaite réglementer l'usage de ses parcs et jardins publics.",
        question: "Quelle procédure suivre pour adopter ce règlement ?",
        expectedPoints: [
          "Consultation publique",
          "Avis des services",
          "Délibération du conseil municipal",
          "Publication et affichage"
        ],
        timeLimit: 20
      }
    ]
  },
  procedure_penale: {
    title: "Analyse d'une infraction",
    context: "Une personne subtilise un objet dans un magasin d'une valeur de 50 euros et est interpellée à la sortie.",
    totalTime: 20,
    steps: [
      {
        id: "step1",
        title: "Qualification des faits",
        scenario: "Une personne subtilise un objet dans un magasin d'une valeur de 50 euros. Elle est interpellée à la sortie du magasin.",
        question: "Quelle qualification pénale donner à ces faits ?",
        expectedPoints: [
          "Vol simple",
          "Article 311-1 du Code pénal",
          "Délit punissable",
          "Éléments constitutifs"
        ],
        timeLimit: 10
      }
    ]
  },
  management: {
    title: "Gestion d'équipe en conflit",
    context: "Deux membres d'une équipe sont en conflit ouvert depuis plusieurs semaines, affectant l'ambiance et la productivité.",
    totalTime: 25,
    steps: [
      {
        id: "step1",
        title: "Diagnostic de la situation",
        scenario: "Deux membres d'une équipe sont en conflit ouvert depuis plusieurs semaines. Cela affecte l'ambiance et la productivité de toute l'équipe.",
        question: "Quelles actions managériales mettre en place ?",
        expectedPoints: [
          "Écoute active des parties",
          "Médiation",
          "Clarification des rôles",
          "Suivi régulier"
        ],
        timeLimit: 15
      }
    ]
  },
  ethique_deontologie: {
    title: "Conflit d'intérêts",
    context: "Un agent public se trouve dans une situation de conflit d'intérêts potentiel.",
    totalTime: 25,
    steps: [
      {
        id: "step1", 
        title: "Analyse éthique",
        scenario: "Un agent de la mairie découvre que sa sœur a déposé un dossier de permis de construire qu'il doit instruire.",
        question: "Quelle conduite adopter selon les règles déontologiques ?",
        expectedPoints: [
          "Signalement hiérarchique",
          "Abstention",
          "Déclaration de conflit d'intérêts",
          "Réassignation du dossier"
        ],
        timeLimit: 15
      }
    ]
  }
};

// Fonction pour mélanger un tableau (algorithme Fisher-Yates)
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Fonction pour sélectionner un sous-ensemble aléatoire selon le niveau
function selectContentByLevel<T>(content: T[], level: UserLevel, maxItems: number = 5): T[] {
  const shuffled = shuffleArray(content);
  
  // Adapter le nombre de questions selon le niveau
  let itemCount: number;
  switch (level) {
    case 'debutant':
      itemCount = Math.min(3, maxItems);
      break;
    case 'intermediaire':
      itemCount = Math.min(5, maxItems);
      break;
    case 'avance':
      itemCount = Math.min(8, maxItems);
      break;
    default:
      itemCount = Math.min(5, maxItems);
  }
  
  return shuffled.slice(0, Math.min(itemCount, content.length));
}

export function getStaticContent(trainingType: TrainingType, domain: StudyDomain, level: UserLevel) {
  const fallbackDomain = 'droit_administratif';
  
  switch (trainingType) {
    case 'qcm': {
      const questions = staticQCMData[domain] || staticQCMData[fallbackDomain];
      return selectContentByLevel(questions, level, 8);
    }
    case 'vrai_faux': {
      const questions = staticTrueFalseData[domain] || staticTrueFalseData[fallbackDomain];
      return selectContentByLevel(questions, level, 6);
    }
    case 'cas_pratique': {
      const caseData = staticCasePracticeData[domain] || staticCasePracticeData[fallbackDomain];
      // Pour les cas pratiques, on retourne le cas complet mais on peut varier les étapes
      return {
        ...caseData,
        steps: shuffleArray(caseData.steps)
      };
    }
    default: {
      const questions = staticQCMData[domain] || staticQCMData[fallbackDomain];
      return selectContentByLevel(questions, level, 5);
    }
  }
}