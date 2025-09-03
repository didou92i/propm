export const agentInfo = {
  redacpro: {
    name: "RedacPro",
    description: "Assistant IA pour les agents de police municipale",
    suggestions: [
      "Améliorer un rapport",
      "Rédiger un procès-verbal",
      "Rédiger une note de service",
      "Modifier un arrêté existant"
    ]
  },
  cdspro: {
    name: "CDS Pro", 
    description: "Assistant spécialisé pour responsables de police municipale",
    suggestions: [
      "Rédiger une note de service",
      "Analyser la conformité juridique",
      "Organiser les cycles de travail",
      "Procédures de contrôle d'identité"
    ]
  },
  arrete: {
    name: "ArreteTerritorial",
    description: "Spécialiste des arrêtés municipaux",
    suggestions: [
      "Rédiger un arrêté municipal",
      "Modifier un arrêté existant",
      "Vérifier la conformité", 
      "Consulter la jurisprudence"
    ]
  },
  prepacds: {
    name: "Prepa CDS",
    description: "Assistant personnalisé pour la préparation aux concours de la fonction publique",
    suggestions: [
      "Commencer une session d'entraînement",
      "Réviser les notions de base",
      "Tester mes connaissances",
      "Simuler un concours blanc"
    ]
  },
  salary: {
    name: "Simulateur de salaire",
    description: "Calcul des salaires et charges",
    suggestions: [
      "Calculer un salaire net",
      "Estimer les charges sociales",
      "Comparer différents statuts",
      "Simuler une évolution de carrière"
    ]
  },
  natif: {
    name: "Pro NATINF",
    description: "Recherche avancée dans la base NATINF",
    suggestions: [
      "Rechercher une infraction",
      "Trouver un code NATINF",
      "Consulter les sanctions",
      "Vérifier la classification"
    ]
  },
  jobs: {
    name: "Nous recrutons",
    description: "Mini job-board : publier et consulter des offres",
    suggestions: [
      "Publier une offre d'emploi",
      "Rechercher des candidats",
      "Consulter les offres disponibles",
      "Gérer mes annonces"
    ]
  }
};

export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });
};