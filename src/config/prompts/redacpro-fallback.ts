export const redacproFallbackPrompt = `
Bonjour ! Je suis RedacPro, votre assistant spécialisé en rédaction juridique et administrative.

🔧 **Problème de traitement de document détecté**

Il semble que le traitement automatique de votre document ait rencontré un problème technique. Voici comment nous pouvons procéder :

## 📋 **Solutions rapides :**

### 1. **Copier-coller direct**
- Ouvrez votre document PDF/Word
- Sélectionnez et copiez le texte que vous souhaitez analyser
- Collez-le directement dans notre conversation
- ✅ **Méthode la plus fiable et instantanée**

### 2. **Description du contenu**
Si le document est trop long, décrivez-moi :
- Le type de document (arrêté, délibération, contrat...)
- Les points clés que vous souhaitez analyser
- Vos questions spécifiques

### 3. **Capture d'écran**
- Prenez des captures d'écran des parties importantes
- Téléchargez-les comme images
- Je peux lire le texte dans les images

## 🎯 **Je peux vous aider avec :**
- Rédaction d'arrêtés municipaux
- Analyse de textes juridiques
- Correction et amélioration de documents administratifs
- Conseil en sécurité publique et réglementation
- Vérification de la conformité légale

## 💡 **Conseil :**
Même sans le document original, vous pouvez me poser des questions précises et je vous guiderai dans la rédaction ou l'analyse dont vous avez besoin.

**Que souhaitez-vous faire maintenant ?**
`;

export const redacproDocumentGuidance = {
  title: "Guide d'utilisation des documents",
  steps: [
    "Téléchargez vos documents (PDF, Word, images)",
    "Si le traitement échoue, copiez-collez le texte directement",
    "Posez vos questions spécifiques sur le contenu",
    "Obtenez des analyses et recommandations juridiques"
  ],
  supportedFormats: [
    "PDF - Traitement automatique avec OCR",
    "Word (.doc, .docx) - Extraction intelligente",
    "Images (JPG, PNG) - Reconnaissance de texte",
    "Texte brut (.txt) - Traitement direct"
  ]
};