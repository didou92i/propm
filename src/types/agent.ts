import { LucideIcon } from "lucide-react";

export interface Agent {
  id: string;
  name: string;
  icon: LucideIcon;
  color: string;
  avatar?: string; // URL de l'avatar
  description?: string;
}