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
      "Procédures de contrôle d'identité",
      "Systèmes de vidéoprotection",
      "Coordination avec forces de l'ordre"
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
      "🎯 Commencer un entraînement QCM",
      "📚 Générer un cas pratique",
      "📝 Créer un plan de révision",
      "🔍 Simulation d'oral",
      "📊 Voir mes statistiques",
      "🎓 Évaluer mes progrès",
      "📋 Fiche de révision personnalisée"
    ]
  }
};

export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });
};