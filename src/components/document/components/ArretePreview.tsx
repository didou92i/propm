import React from 'react';
import { ArreteMetadata } from '../services/ArretePDFGenerator';
import { ArreteSection } from '../services/ArreteContentParser';

interface ArretePreviewProps {
  metadata: ArreteMetadata;
  sections: ArreteSection;
}

export const ArretePreview: React.FC<ArretePreviewProps> = ({ metadata, sections }) => {
  if (!metadata.commune || !metadata.numero) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Remplissez les champs obligatoires pour voir la prévisualisation
      </div>
    );
  }

  return (
    <div className="bg-white p-8 text-black min-h-[400px] border border-border">
      {/* En-tête */}
      <div className="text-center mb-8">
        <div className="font-bold text-lg mb-2">COMMUNE DE {metadata.commune.toUpperCase()}</div>
        <div className="font-bold text-base">ARRÊTÉ N° {metadata.numero}</div>
      </div>
      
      {/* Visas */}
      {sections.visas.length > 0 && (
        <div className="mb-6">
          {sections.visas.map((visa, index) => (
            <div key={index} className="mb-2 text-sm">{visa}</div>
          ))}
        </div>
      )}
      
      {/* Considérants */}
      {sections.considerants.length > 0 && (
        <div className="mb-6">
          {sections.considerants.map((considerant, index) => (
            <div key={index} className="mb-2 text-sm">{considerant}</div>
          ))}
        </div>
      )}
      
      {/* Partie décisionnelle */}
      <div className="mb-6">
        <div className="font-bold mb-4">ARRÊTE :</div>
        {sections.articles.map((article, index) => (
          <div key={index} className="mb-3 text-sm">{article}</div>
        ))}
      </div>
      
      {/* Signature */}
      <div className="mt-8">
        <div className="text-sm">Fait à {metadata.commune}, le {new Date().toLocaleDateString('fr-FR')}</div>
        <div className="text-sm mt-2">Le Maire,</div>
        {metadata.maire && (
          <div className="font-bold mt-4">{metadata.maire}</div>
        )}
      </div>
    </div>
  );
};