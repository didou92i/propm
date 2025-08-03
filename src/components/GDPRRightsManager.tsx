import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Download, Trash2, CheckCircle, AlertCircle, Clock, Send } from 'lucide-react';

interface GDPRRequest {
  id: string;
  request_type: string;
  status: string;
  description?: string;
  reason?: string;
  created_at: string;
  updated_at: string;
}

export function GDPRRightsManager() {
  const { user } = useAuth();
  const [selectedRight, setSelectedRight] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requests, setRequests] = useState<GDPRRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const rights = [
    { value: 'access', label: 'Droit d\'accès', description: 'Demander une copie de vos données personnelles' },
    { value: 'rectification', label: 'Droit de rectification', description: 'Corriger des données incorrectes' },
    { value: 'erasure', label: 'Droit à l\'effacement', description: 'Supprimer vos données personnelles' },
    { value: 'portability', label: 'Droit à la portabilité', description: 'Récupérer vos données dans un format standard' },
    { value: 'restriction', label: 'Droit de limitation', description: 'Limiter le traitement de vos données' },
    { value: 'objection', label: 'Droit d\'opposition', description: 'S\'opposer au traitement de vos données' }
  ];

  useEffect(() => {
    if (user) {
      loadGDPRRequests();
    }
  }, [user]);

  const loadGDPRRequests = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('gdpr_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      // Map the database fields to our interface
      const mappedData = (data || []).map((item: any) => ({
        ...item,
        description: item.description || item.reason || ''
      }));
      setRequests(mappedData);
    } catch (error) {
      console.error('Error loading GDPR requests:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger vos demandes RGPD.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedRight || !description.trim() || !user) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un droit et fournir une description.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('gdpr_requests')
        .insert({
          user_id: user.id,
          request_type: selectedRight,
          description: description.trim()
        });

      if (error) throw error;

      // Log the action for audit
      console.log('GDPR request created:', {
        user_id: user.id,
        action: 'gdpr_request_created',
        resource_type: 'gdpr_request',
        timestamp: new Date().toISOString(),
        data: { request_type: selectedRight, description }
      });

      toast({
        title: "Demande enregistrée",
        description: "Votre demande RGPD a été enregistrée. Nous vous répondrons dans les 30 jours maximum.",
      });
      
      setSelectedRight('');
      setDescription('');
      loadGDPRRequests(); // Refresh the list
    } catch (error) {
      console.error('Error submitting GDPR request:', error);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de l'enregistrement de votre demande.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const exportUserData = async () => {
    if (!user) return;

    try {
      // Get user data from various tables
      const [profileData, conversationsData, documentsData, gdprData] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', user.id),
        supabase.from('conversations').select('*').eq('user_id', user.id),
        supabase.from('documents').select('*').eq('user_id', user.id),
        supabase.from('gdpr_requests').select('*').eq('user_id', user.id)
      ]);

      const userData = {
        profile: profileData.data?.[0] || {},
        conversations: conversationsData.data || [],
        documents: documentsData.data || [],
        gdpr_requests: gdprData.data || [],
        auth: {
          email: user.email,
          created_at: user.created_at
        },
        exportedAt: new Date().toISOString(),
        format: 'JSON',
        version: '1.0',
        notes: 'Export conforme au RGPD - Article 20 (Droit à la portabilité)'
      };

      // Log the export action
      console.log('Data export requested:', {
        user_id: user.id,
        action: 'data_export',
        resource_type: 'user_data',
        timestamp: new Date().toISOString()
      });

      const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mes-donnees-rgpd-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export réussi",
        description: "Vos données ont été exportées avec succès.",
      });
    } catch (error) {
      console.error('Error exporting user data:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'exporter vos données.",
        variant: "destructive",
      });
    }
  };

  const deleteAccount = async () => {
    if (!user) return;

    try {
      // Create a deletion request instead of immediately deleting
      const { error } = await supabase
        .from('gdpr_requests')
        .insert({
          user_id: user.id,
          request_type: 'erasure',
          description: 'Demande de suppression complète du compte utilisateur (Article 17 RGPD)'
        });

      if (error) throw error;

      // Log the deletion request
      console.log('Account deletion requested:', {
        user_id: user.id,
        action: 'account_deletion_requested',
        resource_type: 'user_account',
        timestamp: new Date().toISOString()
      });

      toast({
        title: "Demande de suppression enregistrée",
        description: "Votre demande de suppression de compte a été enregistrée. Nous procéderons à la suppression dans les 30 jours conformément au RGPD.",
      });

      setShowDeleteConfirm(false);
      loadGDPRRequests(); // Refresh the list
    } catch (error) {
      console.error('Error requesting account deletion:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer votre demande de suppression.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">En attente</Badge>;
      case 'processing':
        return <Badge variant="outline">En cours</Badge>;
      case 'completed':
        return <Badge variant="default">Terminé</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejeté</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (!user) {
    return (
      <Alert>
        <AlertDescription>
          Vous devez être connecté pour gérer vos données personnelles.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rights Request Section */}
      <Card>
        <CardHeader>
          <CardTitle>
            Exercer vos droits RGPD
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Sélectionnez le droit que vous souhaitez exercer :
            </label>
            <Select value={selectedRight} onValueChange={setSelectedRight}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir un droit..." />
              </SelectTrigger>
              <SelectContent>
                {rights.map((right) => (
                  <SelectItem key={right.value} value={right.value}>
                    <div>
                      <div className="font-medium">{right.label}</div>
                      <div className="text-xs text-muted-foreground">{right.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Description de votre demande :
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez précisément votre demande..."
              rows={4}
            />
          </div>

          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || !user}
            className="w-full"
          >
            {isSubmitting ? 'Envoi en cours...' : 'Soumettre la demande'}
          </Button>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-2">Exporter mes données</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Téléchargez toutes vos données dans un format structuré (Article 20 RGPD).
              </p>
              <Button onClick={exportUserData} size="sm" variant="outline">
                Télécharger
              </Button>
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-2">Supprimer mon compte</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Demander la suppression définitive de votre compte (Article 17 RGPD).
              </p>
              <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="destructive">
                    Supprimer
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Confirmer la suppression du compte</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Alert>
                      <AlertDescription>
                        Cette action créera une demande de suppression qui sera traitée dans les 30 jours conformément au RGPD. 
                        Vos données seront définitivement supprimées après validation.
                      </AlertDescription>
                    </Alert>
                    <div className="flex gap-3">
                      <Button variant="destructive" onClick={deleteAccount}>
                        Confirmer la demande de suppression
                      </Button>
                      <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                        Annuler
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Previous Requests Section */}
      <Card>
        <CardHeader>
          <CardTitle>Vos demandes RGPD</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Chargement...</div>
          ) : requests.length > 0 ? (
            <div className="space-y-3">
              {requests.map((request) => (
                <div key={request.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium">
                        {rights.find(r => r.value === request.request_type)?.label || request.request_type}
                      </h4>
                      <p className="text-sm text-muted-foreground">{request.description || request.reason || ''}</p>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Créée le {new Date(request.created_at).toLocaleDateString('fr-FR')} • 
                    Modifiée le {new Date(request.updated_at).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              Aucune demande RGPD enregistrée
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact DPO */}
      <Alert>
        <AlertDescription>
          Pour toute question relative à vos données personnelles ou aux délais de traitement, contactez notre DPO : 
          <strong> dpo@redacpro.fr</strong>
        </AlertDescription>
      </Alert>
    </div>
  );
}