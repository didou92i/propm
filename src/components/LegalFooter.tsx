import React from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CookiePreferences } from '@/components/CookiePreferences';
import { Shield, FileText, Building, Cookie } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function LegalFooter() {
  const navigate = useNavigate();

  return (
    <footer className="border-t bg-background/50 backdrop-blur">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span>© 2024 Votre Entreprise. Tous droits réservés.</span>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/legal')}
              className="text-muted-foreground hover:text-foreground"
            >
              <Building className="h-3 w-3 mr-1" />
              Mentions légales
            </Button>
            
            <Separator orientation="vertical" className="h-4" />
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/privacy')}
              className="text-muted-foreground hover:text-foreground"
            >
              <Shield className="h-3 w-3 mr-1" />
              Confidentialité
            </Button>
            
            <Separator orientation="vertical" className="h-4" />
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/terms')}
              className="text-muted-foreground hover:text-foreground"
            >
              <FileText className="h-3 w-3 mr-1" />
              CGU
            </Button>
            
            <Separator orientation="vertical" className="h-4" />
            
            <CookiePreferences />
            
            <Separator orientation="vertical" className="h-4" />
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/my-data')}
              className="text-muted-foreground hover:text-foreground"
            >
              <Shield className="h-3 w-3 mr-1" />
              Mes données
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
}