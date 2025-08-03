import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Cookie } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Cookies() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate('/')} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cookie className="h-6 w-6" />
                Politique de Cookies
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
              </p>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Qu'est-ce qu'un cookie ?</h2>
                <p>
                  Un cookie est un petit fichier texte déposé sur votre terminal (ordinateur, tablette, smartphone) 
                  lors de la visite d'un site web. Il permet au site de se souvenir de vos actions et préférences 
                  (langue, taille de police, autres préférences d'affichage) pendant une durée déterminée.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Types de cookies utilisés</h2>
                
                <div className="space-y-6">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="text-lg font-medium text-green-800 mb-2">🔒 Cookies essentiels (obligatoires)</h3>
                    <p className="text-green-700 mb-2">Ces cookies sont nécessaires au fonctionnement du site et ne peuvent pas être désactivés.</p>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border border-green-200">
                        <thead>
                          <tr className="bg-green-100">
                            <th className="border border-green-200 p-2 text-left">Nom</th>
                            <th className="border border-green-200 p-2 text-left">Finalité</th>
                            <th className="border border-green-200 p-2 text-left">Durée</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-green-200 p-2">sb-session</td>
                            <td className="border border-green-200 p-2">Authentification utilisateur</td>
                            <td className="border border-green-200 p-2">Session</td>
                          </tr>
                          <tr>
                            <td className="border border-green-200 p-2">cookie-consent</td>
                            <td className="border border-green-200 p-2">Mémorisation des préférences de cookies</td>
                            <td className="border border-green-200 p-2">13 mois</td>
                          </tr>
                          <tr>
                            <td className="border border-green-200 p-2">csrf-token</td>
                            <td className="border border-green-200 p-2">Protection contre les attaques CSRF</td>
                            <td className="border border-green-200 p-2">Session</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="text-lg font-medium text-blue-800 mb-2">📊 Cookies analytiques (optionnels)</h3>
                    <p className="text-blue-700 mb-2">Ces cookies nous aident à comprendre comment vous utilisez le site pour l'améliorer.</p>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border border-blue-200">
                        <thead>
                          <tr className="bg-blue-100">
                            <th className="border border-blue-200 p-2 text-left">Nom</th>
                            <th className="border border-blue-200 p-2 text-left">Finalité</th>
                            <th className="border border-blue-200 p-2 text-left">Durée</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-blue-200 p-2">_ga</td>
                            <td className="border border-blue-200 p-2">Google Analytics - Identification unique</td>
                            <td className="border border-blue-200 p-2">2 ans</td>
                          </tr>
                          <tr>
                            <td className="border border-blue-200 p-2">_ga_*</td>
                            <td className="border border-blue-200 p-2">Google Analytics - État de session</td>
                            <td className="border border-blue-200 p-2">2 ans</td>
                          </tr>
                          <tr>
                            <td className="border border-blue-200 p-2">usage-analytics</td>
                            <td className="border border-blue-200 p-2">Analyse d'usage interne</td>
                            <td className="border border-blue-200 p-2">30 jours</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="text-lg font-medium text-purple-800 mb-2">⚙️ Cookies fonctionnels (optionnels)</h3>
                    <p className="text-purple-700 mb-2">Ces cookies améliorent les fonctionnalités et personnalisent votre expérience.</p>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border border-purple-200">
                        <thead>
                          <tr className="bg-purple-100">
                            <th className="border border-purple-200 p-2 text-left">Nom</th>
                            <th className="border border-purple-200 p-2 text-left">Finalité</th>
                            <th className="border border-purple-200 p-2 text-left">Durée</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-purple-200 p-2">theme-preference</td>
                            <td className="border border-purple-200 p-2">Mémorisation du thème (clair/sombre)</td>
                            <td className="border border-purple-200 p-2">1 an</td>
                          </tr>
                          <tr>
                            <td className="border border-purple-200 p-2">language-preference</td>
                            <td className="border border-purple-200 p-2">Mémorisation de la langue</td>
                            <td className="border border-purple-200 p-2">1 an</td>
                          </tr>
                          <tr>
                            <td className="border border-purple-200 p-2">sidebar-state</td>
                            <td className="border border-purple-200 p-2">État de la barre latérale</td>
                            <td className="border border-purple-200 p-2">30 jours</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h3 className="text-lg font-medium text-orange-800 mb-2">🎯 Cookies marketing (optionnels)</h3>
                    <p className="text-orange-700 mb-2">Ces cookies sont utilisés pour le ciblage publicitaire et le marketing personnalisé.</p>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border border-orange-200">
                        <thead>
                          <tr className="bg-orange-100">
                            <th className="border border-orange-200 p-2 text-left">Nom</th>
                            <th className="border border-orange-200 p-2 text-left">Finalité</th>
                            <th className="border border-orange-200 p-2 text-left">Durée</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-orange-200 p-2">fbp</td>
                            <td className="border border-orange-200 p-2">Facebook Pixel - Suivi conversions</td>
                            <td className="border border-orange-200 p-2">90 jours</td>
                          </tr>
                          <tr>
                            <td className="border border-orange-200 p-2">_gcl_au</td>
                            <td className="border border-orange-200 p-2">Google Ads - Attribution</td>
                            <td className="border border-orange-200 p-2">90 jours</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Gestion de vos préférences</h2>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium mb-2">Contrôle via notre interface</h3>
                  <p className="mb-3">
                    Vous pouvez à tout moment modifier vos préférences de cookies via la bannière 
                    de consentement ou en cliquant sur le bouton ci-dessous :
                  </p>
                  <Button 
                    onClick={() => {
                      localStorage.removeItem('cookie-consent');
                      window.location.reload();
                    }}
                    className="mb-3"
                  >
                    Gérer mes préférences de cookies
                  </Button>
                  
                  <h3 className="text-lg font-medium mb-2">Contrôle via votre navigateur</h3>
                  <p>Vous pouvez également configurer votre navigateur pour :</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Accepter ou refuser tous les cookies</li>
                    <li>Être informé avant l'enregistrement d'un cookie</li>
                    <li>Supprimer les cookies existants</li>
                  </ul>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Configuration par navigateur</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="bg-muted p-4 rounded-lg">
                    <h3 className="font-medium mb-2">Google Chrome</h3>
                    <p className="text-sm">Menu → Paramètres → Confidentialité et sécurité → Cookies</p>
                  </div>
                  <div className="bg-muted p-4 rounded-lg">
                    <h3 className="font-medium mb-2">Firefox</h3>
                    <p className="text-sm">Menu → Options → Vie privée et sécurité → Cookies</p>
                  </div>
                  <div className="bg-muted p-4 rounded-lg">
                    <h3 className="font-medium mb-2">Safari</h3>
                    <p className="text-sm">Préférences → Confidentialité → Cookies et données</p>
                  </div>
                  <div className="bg-muted p-4 rounded-lg">
                    <h3 className="font-medium mb-2">Edge</h3>
                    <p className="text-sm">Menu → Paramètres → Confidentialité → Cookies</p>
                  </div>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Conséquences du refus</h2>
                <div className="space-y-3">
                  <div className="bg-yellow-50 p-3 rounded border-l-4 border-yellow-400">
                    <p><strong>Refus des cookies essentiels :</strong> Impossible (nécessaires au fonctionnement)</p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-400">
                    <p><strong>Refus des cookies analytiques :</strong> Pas d'impact sur les fonctionnalités</p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded border-l-4 border-purple-400">
                    <p><strong>Refus des cookies fonctionnels :</strong> Perte de personnalisation (thème, langue, etc.)</p>
                  </div>
                  <div className="bg-orange-50 p-3 rounded border-l-4 border-orange-400">
                    <p><strong>Refus des cookies marketing :</strong> Publicité moins pertinente</p>
                  </div>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Cookies tiers</h2>
                <p>
                  Certains cookies sont déposés par des services tiers (Google Analytics, réseaux sociaux, etc.). 
                  Ces services ont leurs propres politiques de confidentialité :
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1 mt-2">
                  <li><a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Politique de Google</a></li>
                  <li><a href="https://www.facebook.com/privacy/explanation" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Politique de Facebook</a></li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Durée de conservation</h2>
                <p>
                  Conformément aux recommandations de la CNIL, nous vous demandons votre consentement 
                  tous les 13 mois maximum pour les cookies non essentiels.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">Contact</h2>
                <p>
                  Pour toute question relative aux cookies : 
                  <strong> dpo@votre-entreprise.fr</strong>
                </p>
              </section>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}