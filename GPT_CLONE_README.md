# Clone GPT - Documentation

## Vue d'ensemble

Le Clone GPT est une interface de chat moderne et configurable inspirée de ChatGPT, vous permettant de créer et gérer vos propres agents IA avec différents providers (OpenAI, Anthropic, Mistral, ou votre API personnalisée).

## Fonctionnalités

- **Interface moderne type ChatGPT** avec sidebar de navigation
- **Agents configurables** - Créez vos propres agents avec différents modèles
- **Multi-providers** - Support pour OpenAI, Claude (Anthropic), Mistral AI et APIs personnalisées
- **Streaming en temps réel** - Réponses streamées pour une meilleure expérience utilisateur
- **Gestion des conversations** - Sauvegarde automatique et historique des conversations
- **Configuration avancée** - Contrôle total sur les paramètres (température, tokens, prompts système, etc.)
- **Interface d'administration** - Gérez facilement vos agents depuis l'interface web

## Architecture

### Frontend
```
/src
├── /pages
│   ├── GPTClone.tsx          # Page principale du chat
│   └── GPTSettings.tsx       # Page de configuration des agents
├── /components/gpt-clone
│   ├── GPTSidebar.tsx        # Sidebar avec liste des conversations
│   ├── GPTHeader.tsx         # En-tête avec sélecteur d'agents
│   ├── GPTChatArea.tsx       # Zone de chat principale
│   ├── GPTMessageItem.tsx    # Composant pour afficher un message
│   ├── GPTComposer.tsx       # Compositeur de messages
│   ├── GPTAgentCard.tsx      # Carte d'agent dans la config
│   └── GPTAgentDialog.tsx    # Dialog de création/édition d'agent
├── /hooks/gpt-clone
│   ├── useGPTConversations.ts # Hook pour gérer les conversations
│   ├── useGPTChat.ts         # Hook pour gérer le chat
│   └── useGPTAgents.ts       # Hook pour gérer les agents
├── /services/gpt-clone
│   └── gptChatService.ts     # Service pour communiquer avec les APIs
└── /types
    └── gpt-clone.ts          # Types TypeScript
```

### Backend (Supabase)
```sql
Tables:
- gpt_agents          # Configuration des agents
- gpt_conversations   # Conversations des utilisateurs
- gpt_messages        # Messages individuels
```

## Installation et Configuration

### 1. Appliquer la migration Supabase

Exécutez la migration SQL pour créer les tables nécessaires :

```bash
# Via Supabase CLI
supabase db push

# Ou exécutez directement le fichier SQL dans votre dashboard Supabase
supabase/migrations/20250121_gpt_clone_tables.sql
```

### 2. Configuration des variables d'environnement

Créez ou mettez à jour votre fichier `.env` avec les clés API :

```env
# Supabase (déjà configuré)
VITE_SUPABASE_URL=votre_url_supabase
VITE_SUPABASE_ANON_KEY=votre_cle_supabase

# Clés API pour les différents providers (optionnel - peut aussi être configuré par agent)
VITE_OPENAI_API_KEY=sk-...
VITE_ANTHROPIC_API_KEY=sk-ant-...
VITE_MISTRAL_API_KEY=...
```

### 3. Installer les dépendances

```bash
npm install
```

### 4. Lancer l'application

```bash
npm run dev
```

## Utilisation

### Accéder au Clone GPT

Naviguez vers `/gpt-clone` dans votre application.

### Créer votre premier agent

1. Accédez à la page de configuration : `/gpt-clone/settings`
2. Cliquez sur "Créer un agent"
3. Remplissez les informations :
   - **Général** : Nom, description, provider, modèle, icône, couleur
   - **Paramètres** : Température, max tokens, prompt système
   - **Avancé** : Clé API (optionnel), capacités

### Agents pré-configurés

Le système inclut 5 agents par défaut :

| Agent | Provider | Modèle | Description |
|-------|----------|--------|-------------|
| GPT-4 | OpenAI | gpt-4-turbo-preview | Le plus puissant |
| GPT-3.5 | OpenAI | gpt-3.5-turbo | Rapide et efficace |
| Claude 3 Opus | Anthropic | claude-3-opus-20240229 | Très performant |
| Claude 3 Sonnet | Anthropic | claude-3-sonnet-20240229 | Équilibré |
| Mistral Large | Mistral | mistral-large-latest | Modèle français |

### Créer un agent personnalisé avec votre propre API

1. Sélectionnez "Personnalisé" comme provider
2. Entrez l'URL de base de votre API (ex: `https://api.example.com/v1`)
3. Configurez la clé API
4. Spécifiez le nom du modèle
5. Configurez les paramètres selon votre API

L'API doit suivre le format OpenAI compatible :
```
POST {baseUrl}/chat/completions
Headers:
  Authorization: Bearer {apiKey}
  Content-Type: application/json
Body:
  {
    "model": "...",
    "messages": [...],
    "temperature": 0.7,
    "max_tokens": 2000,
    "stream": true
  }
```

### Démarrer une conversation

1. Sur la page `/gpt-clone`, cliquez sur "Nouveau chat"
2. Sélectionnez un agent dans le header
3. Tapez votre message et appuyez sur Entrée
4. Les réponses sont streamées en temps réel

### Gérer les conversations

- **Renommer** : Cliquez sur l'icône d'édition à côté du titre
- **Supprimer** : Cliquez sur l'icône de suppression
- **Changer d'agent** : Utilisez le sélecteur dans le header

## Configuration avancée

### Paramètres des agents

#### Température (0.0 - 2.0)
- **0.0** : Réponses déterministes et focalisées
- **0.7** : Équilibre entre créativité et cohérence (recommandé)
- **2.0** : Très créatif et varié

#### Max Tokens
Nombre maximum de tokens dans la réponse (100 - 32000)

#### Top P (0.0 - 1.0)
Contrôle la diversité via nucleus sampling

#### Frequency/Presence Penalty (0.0 - 2.0)
Réduit la répétition dans les réponses

#### Prompt Système
Instructions de base qui définissent le comportement de l'agent

### Capacités

- **Streaming** : Affichage progressif des réponses
- **Appel de fonctions** : Permet à l'agent d'appeler des fonctions
- **Vision** : Support des images (Claude 3, GPT-4 Vision)
- **Interpréteur de code** : Exécution de code (si supporté)

## Sécurité

### Clés API

Les clés API peuvent être configurées de deux manières :

1. **Globales** : Dans les variables d'environnement (recommandé pour le développement)
2. **Par agent** : Dans la configuration de chaque agent (pour production multi-tenant)

⚠️ **Important** : Les clés API stockées en base de données doivent être chiffrées en production.

### Row Level Security (RLS)

Les tables Supabase utilisent RLS pour garantir que :
- Les utilisateurs ne voient que leurs propres conversations et messages
- Les utilisateurs ne peuvent créer/modifier que leurs propres agents
- Les agents par défaut (user_id = NULL) sont visibles par tous

## Développement

### Ajouter un nouveau provider

1. Ajoutez le type dans `src/types/gpt-clone.ts` :
```typescript
provider: "openai" | "anthropic" | "mistral" | "custom" | "nouveauProvider"
```

2. Implémentez la méthode de streaming dans `src/services/gpt-clone/gptChatService.ts` :
```typescript
private async streamNouveauProvider(
  agent: GPTAgent,
  message: string,
  history: any[],
  onChunk: (chunk: string) => void
) {
  // Implémentation...
}
```

3. Ajoutez le cas dans le switch du service :
```typescript
case "nouveauProvider":
  await this.streamNouveauProvider(agent, message, history, onChunk);
  break;
```

### Tests

```bash
# Lancer les tests unitaires
npm test

# Lancer en mode watch
npm run test:watch
```

## Roadmap

- [ ] Support multi-modal (images, fichiers)
- [ ] Export des conversations (PDF, Markdown)
- [ ] Partage de conversations
- [ ] Plugins et extensions
- [ ] Recherche dans l'historique
- [ ] Statistiques d'utilisation
- [ ] Support des function calling
- [ ] Intégration RAG (Retrieval Augmented Generation)
- [ ] Mode vocal
- [ ] Collaboration en temps réel

## Dépannage

### "Agent not found"
Vérifiez que l'agent est bien créé dans la base de données et est actif.

### "API key not configured"
Configurez la clé API soit dans `.env` soit dans la configuration de l'agent.

### "Streaming not working"
Vérifiez que le provider supporte le streaming et que la capacité est activée.

### "Unauthorized" errors
Vérifiez que l'utilisateur est bien authentifié et que les policies RLS sont correctes.

## Support

Pour toute question ou problème :
1. Consultez cette documentation
2. Vérifiez les logs de la console développeur
3. Consultez les issues GitHub du projet

## License

Ce projet fait partie de Propm.fr et suit la même licence.
