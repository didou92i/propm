import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
}

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true, // Always true, cannot be disabled
    analytics: false,
    marketing: false,
    functional: false,
  });

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    const consentDate = localStorage.getItem('cookie-consent-date');
    
    // Show banner if no consent or consent is older than 13 months (GDPR requirement)
    if (!consent || !consentDate || 
        (Date.now() - parseInt(consentDate)) > 13 * 30 * 24 * 60 * 60 * 1000) {
      setIsVisible(true);
    } else {
      // Load saved preferences
      const savedPrefs = localStorage.getItem('cookie-preferences');
      if (savedPrefs) {
        setPreferences(JSON.parse(savedPrefs));
      }
    }
  }, []);

  const saveConsent = (prefs: CookiePreferences) => {
    localStorage.setItem('cookie-consent', 'true');
    localStorage.setItem('cookie-consent-date', Date.now().toString());
    localStorage.setItem('cookie-preferences', JSON.stringify(prefs));
    
    // Log consent for audit purposes
    // Production: removed debug logging
    
    setIsVisible(false);
    setShowPreferences(false);
  };

  const acceptAll = () => {
    const allAccepted = {
      essential: true,
      analytics: true,
      marketing: true,
      functional: true,
    };
    setPreferences(allAccepted);
    saveConsent(allAccepted);
  };

  const acceptEssential = () => {
    const essentialOnly = {
      essential: true,
      analytics: false,
      marketing: false,
      functional: false,
    };
    setPreferences(essentialOnly);
    saveConsent(essentialOnly);
  };

  const saveCustomPreferences = () => {
    saveConsent(preferences);
  };

  if (!isVisible) return null;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/95 backdrop-blur border-t">
        <div className="max-w-4xl mx-auto">
          <div className="bg-card rounded-lg border p-6">
            <div>
              <h3 className="text-base font-medium mb-2">
                Respect de votre vie privée
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Nous utilisons des cookies pour améliorer votre expérience, analyser l'usage du site et personnaliser le contenu. 
                Vous pouvez choisir les types de cookies que vous acceptez.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button onClick={acceptAll} size="sm">
                  Accepter tout
                </Button>
                <Button onClick={acceptEssential} variant="outline" size="sm">
                  Essentiels uniquement
                </Button>
                <Sheet open={showPreferences} onOpenChange={setShowPreferences}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm">
                      Personnaliser
                    </Button>
                  </SheetTrigger>
                    <SheetContent side="right" className="w-full sm:max-w-md">
                      <SheetHeader>
                        <SheetTitle>Préférences de cookies</SheetTitle>
                      </SheetHeader>
                      <div className="mt-6 space-y-6">
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
                        
                        <div className="flex gap-3">
                          <Button onClick={saveCustomPreferences} className="flex-1">
                            Enregistrer les préférences
                          </Button>
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}