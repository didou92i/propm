import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  RefreshCw,
  ExternalLink 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EmailValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  onResendEmail?: () => Promise<{ error?: any }>;
}

export function EmailValidationModal({ 
  isOpen, 
  onClose, 
  userEmail, 
  onResendEmail 
}: EmailValidationModalProps) {
  const [isResending, setIsResending] = useState(false);
  const [resendCount, setResendCount] = useState(0);
  const { toast } = useToast();

  const handleResendEmail = async () => {
    if (!onResendEmail || resendCount >= 3) return;
    
    setIsResending(true);
    try {
      const result = await onResendEmail();
      if (result.error) {
        toast({
          title: "Erreur lors du renvoi",
          description: "Impossible de renvoyer l'email. Veuillez réessayer plus tard.",
          variant: "destructive",
        });
      } else {
        setResendCount(prev => prev + 1);
        toast({
          title: "Email renvoyé",
          description: "Un nouvel email de validation a été envoyé.",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  const canResend = resendCount < 3 && onResendEmail;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] p-0">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 p-6">
          <DialogHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <DialogTitle className="text-2xl font-bold text-green-800 dark:text-green-200">
              Inscription réussie ! 🎉
            </DialogTitle>
            <DialogDescription className="text-lg text-green-700 dark:text-green-300 mt-2">
              Plus qu'une étape pour accéder à la plateforme
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-6">
          {/* Email envoyé */}
          <Card className="border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-800 dark:text-blue-200">
                    Email de validation envoyé
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Un email a été envoyé à <strong>{userEmail}</strong>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Étapes à suivre */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center">
              <Clock className="h-5 w-5 mr-2 text-amber-600" />
              Étapes à suivre :
            </h3>
            
            <div className="space-y-3 ml-7">
              <div className="flex items-start space-x-3">
                <Badge variant="outline" className="mt-0.5 px-2 py-1 text-xs">1</Badge>
                <div>
                  <p className="font-medium">Vérifiez votre boîte email</p>
                  <p className="text-sm text-muted-foreground">
                    Cherchez un email de notre part. <strong>Vérifiez aussi vos courriers indésirables (spam).</strong>
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Badge variant="outline" className="mt-0.5 px-2 py-1 text-xs">2</Badge>
                <div>
                  <p className="font-medium">Cliquez sur le lien de validation</p>
                  <p className="text-sm text-muted-foreground">
                    Dans l'email, cliquez sur le bouton ou le lien "Valider mon compte".
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Badge variant="outline" className="mt-0.5 px-2 py-1 text-xs">3</Badge>
                <div>
                  <p className="font-medium">Revenez vous connecter</p>
                  <p className="text-sm text-muted-foreground">
                    Une fois validé, revenez sur cette page pour vous connecter avec votre email et mot de passe.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Conseils pratiques */}
          <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div className="space-y-2">
                  <h4 className="font-medium text-amber-800 dark:text-amber-200">
                    Conseils pratiques
                  </h4>
                  <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                    <li>• L'email peut prendre <strong>quelques minutes</strong> à arriver</li>
                    <li>• Vérifiez le dossier <strong>"Courriers indésirables"</strong> ou <strong>"Spam"</strong></li>
                    <li>• L'email vient de <strong>"noreply@lovable.dev"</strong></li>
                    <li>• Le lien est valide pendant <strong>24 heures</strong></li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              J'ai compris, je vais vérifier mes emails
            </Button>
            
            {canResend && (
              <Button
                onClick={handleResendEmail}
                disabled={isResending}
                variant="secondary"
                className="flex-1"
              >
                {isResending ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4 mr-2" />
                )}
                Renvoyer l'email {resendCount > 0 && `(${3 - resendCount} restant${3 - resendCount > 1 ? 's' : ''})`}
              </Button>
            )}
          </div>

          {resendCount >= 3 && (
            <div className="text-sm text-center text-muted-foreground">
              Limite de renvoi atteinte. Contactez le support si vous ne recevez toujours pas l'email.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}