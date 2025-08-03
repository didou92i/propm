import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Terms() {
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
                <FileText className="h-6 w-6" />
                Conditions Générales d'Utilisation
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
              </p>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">1. Objet</h2>
                <p>
                  Les présentes Conditions Générales d'Utilisation (CGU) régissent l'utilisation 
                  de la plateforme d'assistance IA pour la rédaction de documents administratifs.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">2. Définitions</h2>
                <ul className="space-y-2">
                  <li><strong>Service :</strong> Plateforme d'assistance IA pour la rédaction</li>
                  <li><strong>Utilisateur :</strong> Toute personne utilisant le Service</li>
                  <li><strong>Compte :</strong> Espace personnel de l'Utilisateur</li>
                  <li><strong>Contenu :</strong> Toute information saisie ou générée</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">3. Accès au Service</h2>
                <div className="space-y-3">
                  <h3 className="text-lg font-medium">3.1 Inscription</h3>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>L'inscription est gratuite et requiert une adresse email valide</li>
                    <li>L'Utilisateur garantit l'exactitude des informations fournies</li>
                    <li>Un seul compte par utilisateur est autorisé</li>
                  </ul>
                  
                  <h3 className="text-lg font-medium">3.2 Conditions d'accès</h3>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Être âgé de 16 ans minimum</li>
                    <li>Accepter les présentes CGU</li>
                    <li>Respecter la politique de confidentialité</li>
                  </ul>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">4. Utilisation du Service</h2>
                <div className="space-y-3">
                  <h3 className="text-lg font-medium">4.1 Usage autorisé</h3>
                  <p>Le Service est destiné à :</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>La rédaction de documents administratifs</li>
                    <li>L'assistance à la consultation de codes</li>
                    <li>L'aide à la recherche documentaire</li>
                  </ul>
                  
                  <h3 className="text-lg font-medium">4.2 Usages interdits</h3>
                  <p>Il est formellement interdit de :</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Utiliser le Service à des fins illégales</li>
                    <li>Tenter de contourner les mesures de sécurité</li>
                    <li>Partager ses identifiants de connexion</li>
                    <li>Diffuser du contenu illicite ou inapproprié</li>
                    <li>Surcharger les serveurs (attaques DDoS)</li>
                  </ul>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">5. Propriété intellectuelle</h2>
                <div className="space-y-3">
                  <h3 className="text-lg font-medium">5.1 Droits sur le Service</h3>
                  <p>
                    Le Service, son design, ses fonctionnalités et son code source sont protégés 
                    par le droit d'auteur et appartiennent à l'éditeur.
                  </p>
                  
                  <h3 className="text-lg font-medium">5.2 Contenu généré</h3>
                  <p>
                    L'Utilisateur conserve la propriété du contenu qu'il génère via le Service, 
                    sous réserve des droits accordés pour le fonctionnement du Service.
                  </p>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">6. Protection des données</h2>
                <p>
                  Le traitement des données personnelles est décrit dans notre 
                  <Button variant="link" className="p-0 h-auto" onClick={() => navigate('/privacy')}>
                    Politique de Confidentialité
                  </Button>, 
                  conforme au RGPD.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">7. Responsabilités</h2>
                <div className="space-y-3">
                  <h3 className="text-lg font-medium">7.1 Responsabilité de l'éditeur</h3>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Fourniture du Service selon les fonctionnalités décrites</li>
                    <li>Sécurisation des données selon l'état de l'art</li>
                    <li>Information en cas d'incident de sécurité</li>
                  </ul>
                  
                  <h3 className="text-lg font-medium">7.2 Responsabilité de l'utilisateur</h3>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Usage conforme des fonctionnalités</li>
                    <li>Vérification des documents générés</li>
                    <li>Respect de la réglementation applicable</li>
                    <li>Sécurisation de ses identifiants</li>
                  </ul>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">8. Limitations de responsabilité</h2>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p><strong>Important :</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Le Service est fourni "en l'état" sans garantie de fonctionnement parfait</li>
                    <li>L'éditeur ne garantit pas l'exactitude du contenu généré par l'IA</li>
                    <li>L'Utilisateur reste responsable de la validation juridique des documents</li>
                    <li>L'éditeur ne peut être tenu responsable des dommages indirects</li>
                  </ul>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">9. Disponibilité du Service</h2>
                <p>
                  Nous nous efforçons d'assurer une disponibilité maximale du Service, 
                  sous réserve des maintenances programmées et des cas de force majeure.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">10. Résiliation</h2>
                <div className="space-y-3">
                  <h3 className="text-lg font-medium">10.1 Par l'utilisateur</h3>
                  <p>
                    L'Utilisateur peut supprimer son compte à tout moment via l'interface dédiée 
                    ou en contactant le support.
                  </p>
                  
                  <h3 className="text-lg font-medium">10.2 Par l'éditeur</h3>
                  <p>
                    L'éditeur peut suspendre ou supprimer un compte en cas de violation des CGU, 
                    avec préavis sauf urgence.
                  </p>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">11. Modifications des CGU</h2>
                <p>
                  Ces CGU peuvent être modifiées. Les utilisateurs seront informés par email 
                  et/ou notification dans l'application au moins 30 jours avant l'entrée en vigueur.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">12. Droit applicable</h2>
                <p>
                  Les présentes CGU sont soumises au droit français. 
                  Tout litige sera porté devant les tribunaux compétents de [Ville].
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">13. Contact</h2>
                <p>
                  Pour toute question relative aux présentes CGU : 
                  <strong> legal@votre-entreprise.fr</strong>
                </p>
              </section>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}