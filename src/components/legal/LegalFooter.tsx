import React from 'react';
import { CookiePreferences } from '@/components/legal';
import { useNavigate } from 'react-router-dom';

export function LegalFooter() {
  const navigate = useNavigate();

  return (
    <footer className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur z-20">
      <div className="max-w-7xl mx-auto px-6 py-2">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs text-muted-foreground">
            <span>© 2024 RedacPro. Tous droits réservés.</span>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <button 
              onClick={() => navigate('/legal')}
              className="hover:text-foreground transition-colors underline-offset-4 hover:underline"
            >
              Mentions légales
            </button>
            
            <span className="text-muted-foreground/40">•</span>
            
            <button 
              onClick={() => navigate('/privacy')}
              className="hover:text-foreground transition-colors underline-offset-4 hover:underline"
            >
              Confidentialité
            </button>
            
            <span className="text-muted-foreground/40">•</span>
            
            <button 
              onClick={() => navigate('/terms')}
              className="hover:text-foreground transition-colors underline-offset-4 hover:underline"
            >
              CGU
            </button>
            
            <span className="text-muted-foreground/40">•</span>
            
            <CookiePreferences />
            
            <span className="text-muted-foreground/40">•</span>
            
            <button 
              onClick={() => navigate('/my-data')}
              className="hover:text-foreground transition-colors underline-offset-4 hover:underline"
            >
              Mes données
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}