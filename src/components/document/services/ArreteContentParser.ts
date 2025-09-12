export interface ArreteSection {
  visas: string[];
  considerants: string[];
  articles: string[];
}

export class ArreteContentParser {
  static parseArreteContent(content: string): ArreteSection {
    // Parse le contenu de l'arrêté pour extraire les différentes sections
    const lines = content.split('\n').filter(line => line.trim());
    
    const visas: string[] = [];
    const considerants: string[] = [];
    const articles: string[] = [];
    let currentSection = '';
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.toLowerCase().includes('vu') || trimmed.toLowerCase().includes('visa')) {
        currentSection = 'visas';
        visas.push(trimmed);
      } else if (trimmed.toLowerCase().includes('considérant')) {
        currentSection = 'considerants';
        considerants.push(trimmed);
      } else if (trimmed.toLowerCase().includes('article') || /^(ARTICLE|Art\.|Article)\s+\d+/.test(trimmed)) {
        currentSection = 'articles';
        articles.push(trimmed);
      } else if (currentSection && trimmed) {
        switch (currentSection) {
          case 'visas':
            visas.push(trimmed);
            break;
          case 'considerants':
            considerants.push(trimmed);
            break;
          case 'articles':
            articles.push(trimmed);
            break;
        }
      }
    });

    return { visas, considerants, articles };
  }
}