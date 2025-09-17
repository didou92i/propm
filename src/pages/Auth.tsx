import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { EmailValidationModal } from '@/components/auth/EmailValidationModal';
import { Loader2, Info, UserCheck } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('signin');
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if already authenticated (avoid setState during render)
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        toast({
          title: "Erreur de connexion",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Connexion réussie",
          description: "Vous êtes maintenant connecté",
        });
        navigate('/');
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await signUp(email, password);
      
      if (error) {
        // Messages d'erreur simplifiés et bienveillants
        let friendlyMessage = error.message;
        
        if (error.message.includes('already registered')) {
          friendlyMessage = "Cette adresse email est déjà utilisée. Essayez de vous connecter ou utilisez une autre adresse.";
        } else if (error.message.includes('password')) {
          friendlyMessage = "Le mot de passe doit contenir au moins 6 caractères.";
        } else if (error.message.includes('email')) {
          friendlyMessage = "Veuillez vérifier le format de votre adresse email.";
        }
        
        toast({
          title: "Inscription impossible",
          description: friendlyMessage,
          variant: "destructive",
        });
      } else {
        // Succès : afficher la modale détaillée
        setRegisteredEmail(email);
        setShowValidationModal(true);
        setActiveTab('signin');
        // Reset du formulaire
        setEmail('');
        setPassword('');
      }
    } catch (error) {
      toast({
        title: "Erreur technique",
        description: "Une erreur inattendue s'est produite. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    return await signUp(registeredEmail, ''); // Note: le mot de passe n'est pas nécessaire pour le renvoi
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background/80 to-primary/5 p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <UserCheck className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-3xl font-bold">Bienvenue</CardTitle>
            <CardDescription className="text-base leading-relaxed">
              Connectez-vous à votre compte ou créez-en un nouveau pour accéder à la plateforme juridique intelligente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Info pour les seniors */}
            <Alert className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm leading-relaxed">
                <strong>Première visite ?</strong> Créez votre compte avec l'onglet "Inscription", 
                puis utilisez "Connexion" pour accéder à la plateforme.
              </AlertDescription>
            </Alert>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-12">
                <TabsTrigger value="signin" className="text-base">
                  Connexion
                </TabsTrigger>
                <TabsTrigger value="signup" className="text-base">
                  Inscription
                </TabsTrigger>
              </TabsList>
            
              <TabsContent value="signin" className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">Connectez-vous</h3>
                  <p className="text-sm text-muted-foreground">
                    Saisissez vos identifiants pour accéder à votre espace
                  </p>
                </div>
                
                <form onSubmit={handleSignIn} className="space-y-5">
                  <div className="space-y-3">
                    <Label htmlFor="signin-email" className="text-base font-medium">
                      Adresse email
                    </Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="Exemple : jean.dupont@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-12 text-base"
                      autoComplete="email"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="signin-password" className="text-base font-medium">
                      Mot de passe
                    </Label>
                    <PasswordInput
                      id="signin-password"
                      placeholder="Saisissez votre mot de passe"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full h-12 text-base font-medium" 
                    disabled={isLoading}
                  >
                    {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                    Se connecter
                  </Button>
                </form>
              </TabsContent>
            
              <TabsContent value="signup" className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">Créer un compte</h3>
                  <p className="text-sm text-muted-foreground">
                    Rejoignez la plateforme en quelques étapes simples
                  </p>
                </div>
                
                <form onSubmit={handleSignUp} className="space-y-5">
                  <div className="space-y-3">
                    <Label htmlFor="signup-email" className="text-base font-medium">
                      Adresse email *
                    </Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="Exemple : jean.dupont@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-12 text-base"
                      autoComplete="email"
                    />
                    <p className="text-xs text-muted-foreground">
                      Vous recevrez un email de validation à cette adresse
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="signup-password" className="text-base font-medium">
                      Mot de passe *
                    </Label>
                    <PasswordInput
                      id="signup-password"
                      placeholder="Créez un mot de passe sécurisé"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      showStrengthIndicator={true}
                      autoComplete="new-password"
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full h-12 text-base font-medium" 
                    disabled={isLoading}
                  >
                    {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                    Créer mon compte
                  </Button>
                  
                  <div className="text-xs text-center text-muted-foreground leading-relaxed">
                    En vous inscrivant, vous acceptez nos conditions d'utilisation 
                    et notre politique de confidentialité.
                  </div>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      {/* Modale de validation email */}
      <EmailValidationModal
        isOpen={showValidationModal}
        onClose={() => setShowValidationModal(false)}
        userEmail={registeredEmail}
        onResendEmail={handleResendEmail}
      />
    </>
  );
}