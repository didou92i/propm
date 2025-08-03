import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Building, Mail, Phone, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Legal() {
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
                <Building className="h-6 w-6" />
                Mentions Légales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <section>
                <h2 className="text-xl font-semibold mb-4">Éditeur du site</h2>
                <div className="bg-muted p-6 rounded-lg space-y-3">
                  <div className="flex items-start gap-3">
                    <Building className="h-5 w-5 mt-1 text-muted-foreground" />
                    <div>
                      <p><strong>Raison sociale :</strong> RedacPro</p>
                      <p><strong>Forme juridique :</strong> SAS</p>
                      <p><strong>Capital social :</strong> 10 000 euros</p>
                      <p><strong>SIRET :</strong> [À compléter]</p>
                      <p><strong>RCS :</strong> [À compléter]</p>
                      <p><strong>TVA Intracommunautaire :</strong> [À compléter]</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 mt-1 text-muted-foreground" />
                    <div>
                      <p><strong>Adresse du siège social :</strong></p>
                      <p>France</p>
                      <p>(Adresse complète à compléter)</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 mt-1 text-muted-foreground" />
                    <div>
                      <p><strong>Téléphone :</strong> +33 (0)1 XX XX XX XX</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 mt-1 text-muted-foreground" />
                    <div>
                      <p><strong>Email :</strong> contact@redacpro.fr</p>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">Directeur de la publication</h2>
                <div className="bg-muted p-4 rounded-lg">
                  <p><strong>Nom :</strong> [Directeur RedacPro]</p>
                  <p><strong>Qualité :</strong> Président</p>
                  <p><strong>Email :</strong> direction@redacpro.fr</p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">Hébergement</h2>
                <div className="bg-muted p-4 rounded-lg">
                  <p><strong>Hébergeur :</strong> Supabase Inc.</p>
                  <p><strong>Adresse :</strong> 970 Toa Payoh North #07-04, Singapore 318992</p>
                  <p><strong>Localisation des serveurs :</strong> Europe (Irlande)</p>
                  <p><strong>Site web :</strong> <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">supabase.com</a></p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">Délégué à la Protection des Données (DPO)</h2>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p><strong>Nom :</strong> DPO RedacPro</p>
                  <p><strong>Email :</strong> dpo@redacpro.fr</p>
                  <p><strong>Mission :</strong> Veille au respect du RGPD et traite les demandes relatives aux données personnelles</p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">Propriété intellectuelle</h2>
                <div className="space-y-3">
                  <p>
                    Le site et son contenu (textes, images, design, logo, etc.) sont protégés par le droit d'auteur 
                    et appartiennent à RedacPro ou à leurs auteurs respectifs.
                  </p>
                  <p>
                    Toute reproduction, représentation, modification, publication, adaptation de tout ou partie 
                    des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite, 
                    sauf autorisation écrite préalable.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">Données personnelles</h2>
                <p>
                  Le traitement des données personnelles est effectué conformément au RGPD. 
                  Pour plus d'informations, consultez notre{' '}
                  <Button variant="link" className="p-0 h-auto" onClick={() => navigate('/privacy')}>
                    Politique de Confidentialité
                  </Button>.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">Cookies</h2>
                <p>
                  Le site utilise des cookies conformément à notre{' '}
                  <Button variant="link" className="p-0 h-auto" onClick={() => navigate('/cookies')}>
                    Politique de Cookies
                  </Button>. 
                  Vous pouvez gérer vos préférences via la bannière de consentement.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">Responsabilité</h2>
                <div className="space-y-3">
                  <p>
                    Les informations diffusées sur ce site sont présentées à titre informatif et général. 
                    Nous nous efforçons de fournir des informations exactes et à jour, mais ne pouvons 
                    garantir l'exactitude, la précision ou l'exhaustivité des informations mises à disposition.
                  </p>
                  <p>
                    L'utilisation des informations et contenus disponibles sur ce site se fait sous 
                    l'entière responsabilité de l'utilisateur.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">Droit applicable</h2>
                <p>
                  Les présentes mentions légales sont soumises au droit français. 
                  Tout litige relatif à l'utilisation du site sera de la compétence exclusive 
                  des tribunaux de Paris, nonobstant pluralité de défendeurs ou appel en garantie.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">Contact</h2>
                <div className="bg-muted p-4 rounded-lg">
                  <p>Pour toute question concernant ces mentions légales :</p>
                  <p><strong>Email :</strong> contact@redacpro.fr</p>
                  <p><strong>Courrier :</strong> RedacPro - France</p>
                </div>
              </section>

              <div className="text-sm text-muted-foreground border-t pt-4">
                <p>Mentions légales mises à jour le {new Date().toLocaleDateString('fr-FR')}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}