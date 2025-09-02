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

// Données statiques QCM
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
    }
  ],
  droit_penal: [
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
    }
  ],
  redaction_administrative: [
    {
      id: "q1",
      question: "Quel est l'objectif principal de la rédaction administrative ?",
      options: [
        "Impressionner le lecteur",
        "Être clair, précis et efficace",
        "Utiliser un vocabulaire complexe",
        "Rédiger le plus long texte possible"
      ],
      correctAnswer: 1,
      explanation: "La rédaction administrative doit être claire, précise et efficace pour servir l'intérêt général.",
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
  droit_penal: [
    {
      id: "tf1",
      statement: "Une personne peut être condamnée pour un acte qui n'était pas punissable au moment où elle l'a commis.",
      isCorrect: false,
      explanation: "Faux. C'est le principe de non-rétroactivité de la loi pénale : nulla poena sine lege.",
      domain: "Droit pénal"
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
  redaction_administrative: [
    {
      id: "tf1",
      statement: "Un courrier administratif doit toujours utiliser la forme passive.",
      isCorrect: false,
      explanation: "Faux. Il faut privilégier la forme active pour plus de clarté et de dynamisme.",
      domain: "Rédaction administrative"
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
  droit_penal: {
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
  redaction_administrative: {
    title: "Rédaction d'un courrier officiel",
    context: "Vous devez informer les citoyens d'une nouvelle réglementation de manière claire et accessible.",
    totalTime: 20,
    steps: [
      {
        id: "step1", 
        title: "Structure du courrier",
        scenario: "Vous devez informer les citoyens d'une nouvelle réglementation. Le courrier doit être clair et accessible à tous.",
        question: "Quelle structure adopter pour ce courrier ?",
        expectedPoints: [
          "En-tête officiel",
          "Objet précis",
          "Développement structuré", 
          "Formule de politesse"
        ],
        timeLimit: 12
      }
    ]
  }
};

export function getStaticContent(trainingType: TrainingType, domain: StudyDomain, level: UserLevel) {
  switch (trainingType) {
    case 'qcm':
      return staticQCMData[domain] || staticQCMData.droit_administratif;
    case 'vrai_faux':
      return staticTrueFalseData[domain] || staticTrueFalseData.droit_administratif;
    case 'cas_pratique':
      return staticCasePracticeData[domain] || staticCasePracticeData.droit_administratif;
    default:
      return staticQCMData[domain] || staticQCMData.droit_administratif;
  }
}