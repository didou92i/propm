import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, Mail, Phone, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Privacy() {
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
                <Shield className="h-6 w-6" />
                Politique de Confidentialité
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
              </p>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">1. Responsable du traitement</h2>
                <div className="bg-muted p-4 rounded-lg">
                  <p><strong>Raison sociale :</strong> RedacPro</p>
                  <p><strong>Adresse :</strong> France</p>
                  <p><strong>Email :</strong> contact@redacpro.fr</p>
                  <p><strong>DPO :</strong> dpo@redacpro.fr</p>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">2. Données collectées</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium">Données d'identification</h3>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>Adresse email</li>
                      <li>Nom d'affichage (optionnel)</li>
                      <li>Avatar (optionnel)</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium">Données d'usage</h3>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>Conversations avec les assistants IA</li>
                      <li>Documents téléchargés</li>
                      <li>Historique d'utilisation</li>
                      <li>Préférences de l'utilisateur</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium">Données techniques</h3>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>Adresse IP</li>
                      <li>Type de navigateur</li>
                      <li>Système d'exploitation</li>
                      <li>Cookies et traceurs</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">3. Finalités du traitement</h2>
                <div className="space-y-3">
                  <div className="bg-blue-50 p-3 rounded">
                    <strong>Service principal :</strong> Fourniture des services d'assistance IA pour la rédaction de documents administratifs
                  </div>
                  <div className="bg-green-50 p-3 rounded">
                    <strong>Amélioration du service :</strong> Analyse des usages pour optimiser nos algorithmes
                  </div>
                  <div className="bg-purple-50 p-3 rounded">
                    <strong>Support client :</strong> Traitement des demandes et assistance technique
                  </div>
                  <div className="bg-orange-50 p-3 rounded">
                    <strong>Obligations légales :</strong> Respect des réglementations en vigueur
                  </div>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">4. Base légale</h2>
                <ul className="space-y-2">
                  <li><strong>Consentement (Art. 6.1.a RGPD) :</strong> Cookies non essentiels, marketing</li>
                  <li><strong>Contrat (Art. 6.1.b RGPD) :</strong> Fourniture du service demandé</li>
                  <li><strong>Intérêt légitime (Art. 6.1.f RGPD) :</strong> Amélioration du service, sécurité</li>
                  <li><strong>Obligation légale (Art. 6.1.c RGPD) :</strong> Conservation des logs</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">5. Durée de conservation</h2>
                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-200">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-200 p-2 text-left">Type de données</th>
                        <th className="border border-gray-200 p-2 text-left">Durée</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-200 p-2">Données de compte</td>
                        <td className="border border-gray-200 p-2">Tant que le compte est actif + 3 ans</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-200 p-2">Conversations</td>
                        <td className="border border-gray-200 p-2">7 jours (suppression automatique)</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-200 p-2">Documents</td>
                        <td className="border border-gray-200 p-2">2 jours après traitement</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-200 p-2">Logs techniques</td>
                        <td className="border border-gray-200 p-2">12 mois maximum</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">6. Vos droits RGPD</h2>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="mb-3">Conformément au RGPD, vous disposez des droits suivants :</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li><strong>Droit d'accès</strong> : Obtenir une copie de vos données</li>
                    <li><strong>Droit de rectification</strong> : Corriger vos données inexactes</li>
                    <li><strong>Droit à l'effacement</strong> : Supprimer vos données</li>
                    <li><strong>Droit à la portabilité</strong> : Récupérer vos données dans un format structuré</li>
                    <li><strong>Droit d'opposition</strong> : Vous opposer au traitement pour motifs légitimes</li>
                    <li><strong>Droit à la limitation</strong> : Limiter le traitement dans certains cas</li>
                  </ul>
                  <p className="mt-3">
                    Pour exercer ces droits, utilisez l'interface dédiée dans votre compte ou contactez : 
                    <strong> dpo@redacpro.fr</strong>
                  </p>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">7. Sécurité des données</h2>
                <ul className="space-y-2">
                  <li>• Chiffrement SSL/TLS pour toutes les communications</li>
                  <li>• Chiffrement des données sensibles en base</li>
                  <li>• Authentification sécurisée</li>
                  <li>• Contrôles d'accès stricts (RLS)</li>
                  <li>• Monitoring et logs d'audit</li>
                  <li>• Sauvegardes sécurisées</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">8. Transferts de données</h2>
                <p>
                  Vos données sont hébergées en Europe (Supabase - Irlande). 
                  Aucun transfert hors UE n'est effectué sans garanties appropriées.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">9. Cookies et traceurs</h2>
                <p>
                  Nous utilisons des cookies conformément à notre 
                  <Button variant="link" className="p-0 h-auto" onClick={() => navigate('/cookies')}>
                    politique de cookies
                  </Button>. 
                  Vous pouvez gérer vos préférences via la bannière de consentement.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">10. Contact et réclamations</h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>DPO : dpo@redacpro.fr</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span>Support : +33 1 23 45 67 89</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>CNIL : www.cnil.fr (en cas de réclamation)</span>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">11. Modifications</h2>
                <p>
                  Cette politique peut être modifiée. Nous vous informerons de toute modification substantielle 
                  par email et/ou notification dans l'application.
                </p>
              </section>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}