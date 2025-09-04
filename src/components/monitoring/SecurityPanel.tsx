import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Shield, RefreshCw, AlertTriangle, CheckCircle, ExternalLink, Zap, Database, Settings } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SecurityData {
  security_score: number;
  status: string;
  security_grade: string;
  critical_issues: any[];
  warnings: any[];
  manual_configuration_needed: any[];
  automated_fixes_available: string[];
  scan_completed_at: string;
}

interface ExtensionUpdateResult {
  updated_at: string;
  total_processed: number;
  successfully_updated: number;
  details: any[];
}

export function SecurityPanel() {
  const [securityData, setSecurityData] = useState<SecurityData | null>(null);
  const [loading, setLoading] = useState(false);
  const [updatingExtensions, setUpdatingExtensions] = useState(false);
  const [optimizing, setOptimizing] = useState(false);

  const fetchSecurityStatus = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('run_security_diagnostics');
      if (error) throw error;
      setSecurityData(data as unknown as SecurityData);
    } catch (error) {
      console.error('Erreur lors de la récupération du statut de sécurité:', error);
      toast.error('Impossible de charger les données de sécurité');
    } finally {
      setLoading(false);
    }
  };

  const updateExtensions = async () => {
    setUpdatingExtensions(true);
    try {
      const { data, error } = await supabase.rpc('auto_update_extensions');
      if (error) throw error;
      
      const result = data as unknown as ExtensionUpdateResult;
      toast.success(`Extensions mises à jour: ${result.successfully_updated}/${result.total_processed}`);
      
      // Rafraîchir les données de sécurité
      await fetchSecurityStatus();
    } catch (error) {
      console.error('Erreur lors de la mise à jour des extensions:', error);
      toast.error('Échec de la mise à jour des extensions');
    } finally {
      setUpdatingExtensions(false);
    }
  };

  const optimizeSettings = async () => {
    setOptimizing(true);
    try {
      const { data, error } = await supabase.rpc('optimize_security_settings');
      if (error) throw error;
      
      toast.success('Paramètres de sécurité optimisés');
      
      // Rafraîchir les données de sécurité
      await fetchSecurityStatus();
    } catch (error) {
      console.error('Erreur lors de l\'optimisation:', error);
      toast.error('Échec de l\'optimisation');
    } finally {
      setOptimizing(false);
    }
  };

  useEffect(() => {
    fetchSecurityStatus();
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getGradeBadgeVariant = (grade: string) => {
    if (grade.startsWith('A')) return 'default';
    if (grade === 'B') return 'secondary';
    return 'destructive';
  };

  return (
    <div className="space-y-6">
      {/* En-tête du panel de sécurité */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-blue-600" />
              <div>
                <CardTitle>Sécurité de la Base de Données</CardTitle>
                <CardDescription>
                  Analyse automatisée et outils de sécurisation
                </CardDescription>
              </div>
            </div>
            <Button 
              onClick={fetchSecurityStatus} 
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Analyser
            </Button>
          </div>
        </CardHeader>

        {securityData && (
          <CardContent className="space-y-6">
            {/* Score de sécurité */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Score de Sécurité</span>
                <div className="flex items-center gap-2">
                  <span className={`text-2xl font-bold ${getScoreColor(securityData.security_score)}`}>
                    {securityData.security_score}/100
                  </span>
                  <Badge variant={getGradeBadgeVariant(securityData.security_grade)}>
                    {securityData.security_grade}
                  </Badge>
                </div>
              </div>
              <Progress 
                value={securityData.security_score} 
                className="h-2"
              />
            </div>

            <Separator />

            {/* Problèmes critiques */}
            {securityData.critical_issues?.length > 0 && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-semibold text-red-800">Problèmes Critiques Détectés:</p>
                    {securityData.critical_issues.map((issue, index) => (
                      <div key={index} className="text-sm text-red-700">
                        • {issue.issue} ({issue.severity})
                      </div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Avertissements */}
            {securityData.warnings?.length > 0 && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-semibold text-yellow-800">Avertissements:</p>
                    {securityData.warnings.map((warning, index) => (
                      <div key={index} className="text-sm text-yellow-700">
                        • {warning.issue} - {warning.action && `Action: ${warning.action}`}
                      </div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Actions automatisées */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Actions Automatisées
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button
                  onClick={updateExtensions}
                  disabled={updatingExtensions}
                  variant="outline"
                  className="justify-start h-auto p-4"
                >
                  <Database className="h-4 w-4 mr-2" />
                  <div className="text-left">
                    <div className="font-medium">Mettre à jour Extensions</div>
                    <div className="text-xs text-muted-foreground">
                      {updatingExtensions ? 'Mise à jour...' : 'Corriger les extensions obsolètes'}
                    </div>
                  </div>
                </Button>

                <Button
                  onClick={optimizeSettings}
                  disabled={optimizing}
                  variant="outline"
                  className="justify-start h-auto p-4"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  <div className="text-left">
                    <div className="font-medium">Optimiser Sécurité</div>
                    <div className="text-xs text-muted-foreground">
                      {optimizing ? 'Optimisation...' : 'Nettoyer et optimiser'}
                    </div>
                  </div>
                </Button>
              </div>
            </div>

            <Separator />

            {/* Configuration manuelle requise */}
            {securityData.manual_configuration_needed?.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Configuration Manuelle Requise
                </h4>
                <div className="space-y-3">
                  {securityData.manual_configuration_needed.map((config, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <p className="font-medium text-sm">{config.category}</p>
                          <p className="text-xs text-muted-foreground">
                            Recommandé: {config.recommended_value}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          asChild
                        >
                          <a
                            href={config.dashboard_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1"
                          >
                            Configurer
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Statut global */}
            {securityData.critical_issues?.length === 0 && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Aucun problème critique détecté. Votre base de données est sécurisée.
                </AlertDescription>
              </Alert>
            )}

            <div className="text-xs text-muted-foreground">
              Dernière analyse: {new Date(securityData.scan_completed_at).toLocaleString('fr-FR')}
            </div>
          </CardContent>
        )}

        {loading && (
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground mr-2" />
              <span className="text-muted-foreground">Analyse de sécurité en cours...</span>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}