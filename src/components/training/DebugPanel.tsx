import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, Bug, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DebugPanelProps {
  sessionData: any;
  isEmpty: boolean;
  user: any;
  configuration: any;
  isTrainingActive: boolean;
  showConfiguration: boolean;
  isLoading: boolean;
  onRefresh: () => void;
  onCreateTestData: () => void;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({
  sessionData,
  isEmpty,
  user,
  configuration,
  isTrainingActive,
  showConfiguration,
  isLoading,
  onRefresh,
  onCreateTestData
}) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <>
      {/* Bouton toggle flottant */}
      <Button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 right-4 z-50 rounded-full shadow-lg"
        size="sm"
        variant="outline"
      >
        {isVisible ? <EyeOff className="h-4 w-4" /> : <Bug className="h-4 w-4" />}
      </Button>

      {/* Panel de debug */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-16 right-4 z-40 w-96"
          >
            <Card className="bg-background/95 backdrop-blur border-2 border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 text-sm">
                  <Bug className="h-4 w-4 text-primary" />
                  <span>Debug Training Page</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* États critiques */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">User</div>
                    <Badge variant={user ? "default" : "destructive"}>
                      {user ? "Connecté" : "Non connecté"}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Sessions</div>
                    <Badge variant={isEmpty ? "destructive" : "default"}>
                      {sessionData?.totalSessions || 0}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Training</div>
                    <Badge variant={isTrainingActive ? "default" : "secondary"}>
                      {isTrainingActive ? "Actif" : "Inactif"}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Config</div>
                    <Badge variant={showConfiguration ? "default" : "secondary"}>
                      {showConfiguration ? "Visible" : "Masquée"}
                    </Badge>
                  </div>
                </div>

                {/* Données de session */}
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Session Data</div>
                  <div className="text-xs font-mono bg-muted p-2 rounded text-wrap">
                    {sessionData ? (
                      <div>
                        Total: {sessionData.totalSessions}<br/>
                        Score moy: {sessionData.averageScore}%<br/>
                        Temps: {sessionData.totalTimeMinutes}min<br/>
                        Streak: {sessionData.streakDays} jours
                      </div>
                    ) : (
                      <span className="text-destructive">Null</span>
                    )}
                  </div>
                </div>

                {/* Configuration */}
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Configuration</div>
                  <div className="text-xs font-mono bg-muted p-2 rounded">
                    {configuration.trainingType} • {configuration.level} • {configuration.domain}
                  </div>
                </div>

                {/* Actions de debug */}
                <div className="flex space-x-2">
                  <Button
                    onClick={onRefresh}
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    disabled={isLoading}
                  >
                    <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <Button
                    onClick={onCreateTestData}
                    size="sm"
                    variant="outline"
                    className="flex-1"
                  >
                    Test Data
                  </Button>
                </div>

                {/* Logique d'affichage */}
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Logique Affichage</div>
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span>isEmpty:</span>
                      <Badge variant={isEmpty ? "destructive" : "default"} className="text-xs">
                        {isEmpty.toString()}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>showConfig:</span>
                      <Badge variant={showConfiguration ? "default" : "secondary"} className="text-xs">
                        {showConfiguration.toString()}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Affichage:</span>
                      <Badge className="text-xs">
                        {showConfiguration ? "Config" : isEmpty ? "Hero" : "Dashboard"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};