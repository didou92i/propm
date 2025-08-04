import { Bot, FileText, Calculator, MessageSquare, Search, User, GraduationCap } from "lucide-react";

export const AGENTS = [
  { 
    id: "redacpro", 
    name: "RedacPro", 
    icon: Bot, 
    color: "text-blue-400",
    avatar: "/lovable-uploads/190796cd-907b-454f-aea2-f482b263655d.png",
    description: "Assistant de rédaction professionnelle"
  },
  { 
    id: "cdspro", 
    name: "CDS Pro", 
    icon: FileText, 
    color: "text-purple-400",
    avatar: "/lovable-uploads/321ab54b-a748-42b7-b5e3-22717904fe90.png",
    description: "Expert en code de la sécurité"
  },
  { 
    id: "arrete", 
    name: "ArreteTerritorial", 
    icon: MessageSquare, 
    color: "text-green-400",
    avatar: "/lovable-uploads/47594ea7-a3ab-47c8-b4f5-6081c3b7f039.png",
    description: "Spécialiste des arrêtés territoriaux"
  },
  { 
    id: "prepacds", 
    name: "Prepa CDS", 
    icon: GraduationCap, 
    color: "text-orange-400",
    avatar: "/lovable-uploads/67da1939-3215-457e-bc29-ea5425cd6aea.png",
    description: "Assistant de préparation CDS"
  },
];

export const TOOLS = [
  { 
    id: "salary", 
    name: "Simulateur de salaire", 
    icon: Calculator, 
    color: "text-yellow-400",
    description: "Calcul des salaires et charges"
  },
  { 
    id: "natif", 
    name: "Pro Natif", 
    icon: Search, 
    color: "text-cyan-400",
    description: "Recherche avancée dans la base NATINF"
  },
  { 
    id: "azzabi", 
    name: "Azzabi", 
    icon: User, 
    color: "text-pink-400",
    description: "Assistant juridique personnalisé"
  },
];

export const ALL_AGENTS = [...AGENTS, ...TOOLS];

export const getAgentById = (id: string) => {
  return ALL_AGENTS.find(agent => agent.id === id);
};