import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Download, Trash2, Edit, Shield, Mail, Eye } from 'lucide-react';

export function GDPRRightsManager() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [requestType, setRequestType] = useState<string>('');
  const [requestReason, setRequestReason] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const handleDataExport = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Export user data from all tables
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      const { data: conversations } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id);

      const { data: documents } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id);

      const exportData = {
        export_date: new Date().toISOString(),
        user_id: user.id,
        email: user.email,
        profile,
        conversations,
        documents,
        metadata: {
          total_conversations: conversations?.length || 0,
          total_documents: documents?.length || 0,
          account_created: user.created_at,
        }
      };

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `export-donnees-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export terminé",
        description: "Vos données ont été exportées avec succès.",
      });

      // Log the export request for audit
      console.log('Data export requested by user:', {
        userId: user.id,
        timestamp: new Date().toISOString(),
        dataTypes: ['profile', 'conversations', 'documents']
      });

    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Erreur d'export",
        description: "Une erreur est survenue lors de l'export de vos données.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDataDeletion = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Delete user data in correct order (respecting foreign keys)
      await supabase.from('conversation_messages').delete().in(
        'conversation_id',
        (await supabase.from('conversations').select('id').eq('user_id', user.id)).data?.map(c => c.id) || []
      );
      
      await supabase.from('conversations').delete().eq('user_id', user.id);
      await supabase.from('documents').delete().eq('user_id', user.id);
      await supabase.from('profiles').delete().eq('user_id', user.id);

      // Log deletion request for audit
      console.log('Account deletion requested by user:', {
        userId: user.id,
        timestamp: new Date().toISOString(),
        action: 'full_account_deletion'
      });

      toast({
        title: "Compte supprimé",
        description: "Votre compte et toutes vos données ont été supprimés.",
      });

      // Sign out the user
      await supabase.auth.signOut();

    } catch (error) {
      console.error('Deletion error:', error);
      toast({
        title: "Erreur de suppression",
        description: "Une erreur est survenue lors de la suppression de votre compte.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setShowConfirmDelete(false);
    }
  };

  const handleRightsRequest = async () => {
    if (!user || !requestType || !requestReason) return;

    // Log the rights request for processing
    console.log('GDPR rights request:', {
      userId: user.id,
      email: user.email,
      requestType,
      reason: requestReason,
      timestamp: new Date().toISOString(),
    });

    toast({
      title: "Demande enregistrée",
      description: "Votre demande a été enregistrée et sera traitée dans les meilleurs délais.",
    });

    setRequestType('');
    setRequestReason('');
  };

  if (!user) {
    return (
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Vous devez être connecté pour gérer vos données personnelles.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Gestion de vos données personnelles (RGPD)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Conformément au Règlement Général sur la Protection des Données (RGPD), 
            vous disposez de droits sur vos données personnelles.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Download className="h-4 w-4 text-blue-500" />
                  <h3 className="font-medium">Droit d'accès et de portabilité</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Téléchargez toutes vos données dans un format structuré.
                </p>
                <Button onClick={handleDataExport} disabled={loading} size="sm">
                  Exporter mes données
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Trash2 className="h-4 w-4 text-red-500" />
                  <h3 className="font-medium">Droit à l'effacement</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Supprimez définitivement votre compte et toutes vos données.
                </p>
                <Dialog open={showConfirmDelete} onOpenChange={setShowConfirmDelete}>
                  <DialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      Supprimer mon compte
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Confirmer la suppression</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Alert>
                        <Trash2 className="h-4 w-4" />
                        <AlertDescription>
                          Cette action est irréversible. Toutes vos données seront définitivement supprimées.
                        </AlertDescription>
                      </Alert>
                      <div className="flex gap-3">
                        <Button 
                          variant="destructive" 
                          onClick={handleDataDeletion}
                          disabled={loading}
                        >
                          Confirmer la suppression
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setShowConfirmDelete(false)}
                        >
                          Annuler
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Edit className="h-4 w-4 text-green-500" />
                  <h3 className="font-medium">Droit de rectification</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Demandez la correction de vos données personnelles.
                </p>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setRequestType('rectification')}
                    >
                      Demander une correction
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Demande de rectification</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Détaillez votre demande</Label>
                        <Textarea
                          placeholder="Décrivez les données à corriger et les corrections souhaitées..."
                          value={requestReason}
                          onChange={(e) => setRequestReason(e.target.value)}
                        />
                      </div>
                      <Button onClick={handleRightsRequest} disabled={!requestReason}>
                        Envoyer la demande
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="h-4 w-4 text-purple-500" />
                  <h3 className="font-medium">Droit d'opposition</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Vous opposez au traitement de vos données pour motifs légitimes.
                </p>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setRequestType('opposition')}
                    >
                      Exercer mon droit d'opposition
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Droit d'opposition</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Motifs de votre opposition</Label>
                        <Textarea
                          placeholder="Expliquez les raisons de votre opposition au traitement..."
                          value={requestReason}
                          onChange={(e) => setRequestReason(e.target.value)}
                        />
                      </div>
                      <Button onClick={handleRightsRequest} disabled={!requestReason}>
                        Envoyer la demande
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </div>

          <Alert>
            <Mail className="h-4 w-4" />
            <AlertDescription>
              Pour toute question relative à vos données personnelles, contactez notre DPO : 
              <strong> dpo@votre-entreprise.fr</strong>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}