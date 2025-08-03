import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';

interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
}

export function CookiePreferences() {
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    analytics: false,
    marketing: false,
    functional: false,
  });
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Load current preferences
    const savedPrefs = localStorage.getItem('cookie-preferences');
    if (savedPrefs) {
      setPreferences(JSON.parse(savedPrefs));
    }
  }, []);

  const savePreferences = () => {
    localStorage.setItem('cookie-preferences', JSON.stringify(preferences));
    localStorage.setItem('cookie-consent', 'true');
    localStorage.setItem('cookie-consent-date', Date.now().toString());
    
    // Log for audit
    console.log('Cookie preferences updated:', {
      timestamp: new Date().toISOString(),
      preferences,
      userAgent: navigator.userAgent,
    });

    toast({
      title: "Préférences sauvegardées",
      description: "Vos préférences de cookies ont été mises à jour.",
    });

    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button className="hover:text-foreground transition-colors underline-offset-4 hover:underline">
          Cookies
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Préférences de cookies
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <Checkbox 
              checked={preferences.essential} 
              disabled 
              className="mt-1"
            />
            <div>
              <label className="text-sm font-medium">Cookies essentiels</label>
              <p className="text-xs text-muted-foreground">
                Nécessaires au fonctionnement du site. Ne peuvent pas être désactivés.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <Checkbox 
              checked={preferences.analytics}
              onCheckedChange={(checked) => 
                setPreferences(prev => ({ ...prev, analytics: !!checked }))
              }
              className="mt-1"
            />
            <div>
              <label className="text-sm font-medium">Cookies analytiques</label>
              <p className="text-xs text-muted-foreground">
                Nous aident à comprendre comment vous utilisez le site.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <Checkbox 
              checked={preferences.functional}
              onCheckedChange={(checked) => 
                setPreferences(prev => ({ ...prev, functional: !!checked }))
              }
              className="mt-1"
            />
            <div>
              <label className="text-sm font-medium">Cookies fonctionnels</label>
              <p className="text-xs text-muted-foreground">
                Améliorent les fonctionnalités et la personnalisation.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <Checkbox 
              checked={preferences.marketing}
              onCheckedChange={(checked) => 
                setPreferences(prev => ({ ...prev, marketing: !!checked }))
              }
              className="mt-1"
            />
            <div>
              <label className="text-sm font-medium">Cookies marketing</label>
              <p className="text-xs text-muted-foreground">
                Utilisés pour le ciblage publicitaire personnalisé.
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <Button onClick={savePreferences} className="flex-1">
            Enregistrer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}