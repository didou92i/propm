import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { SimpleTrainingPlayer } from '@/components/training/SimpleTrainingPlayer';
import { 
  HeroSection, 
  TrainingDashboard, 
  TrainingConfiguration, 
  TrainingLayout 
} from '@/components/training';
import { DebugPanel } from '@/components/training/DebugPanel';
import { ProtectedTrainingRoute } from '@/components/ProtectedTrainingRoute';
import { useAgentTheme } from "@/hooks/useAgentTheme";
import { useTrainingPage } from '@/hooks/useTrainingPage';
import { createTestTrainingData } from '@/utils/createTestTrainingData';
import { DEFAULT_TRAINING_CONFIG } from '@/config/training';

const Training = () => {
  const [selectedAgent, setSelectedAgent] = useState("prepacds");
  
  // Hook simplifié pour gérer l'entraînement (NOUVELLE ARCHITECTURE)
  const {
    configuration,
    showConfiguration,
    isTrainingActive,
    user,
    currentSessionId,
    sessionData,
    isEmpty,
    hasSessionData,
    shouldShowDashboard,
    shouldShowHero,
    isLoading,
    setConfiguration,
    handleStartTraining,
    handleTrainingComplete,
    handleTrainingExit,
    handleShowConfiguration,
    handleConfigurationBack,
    handleSignOut,
    refreshSessionData,
    logDebugInfo
  } = useTrainingPage(DEFAULT_TRAINING_CONFIG);

  useAgentTheme(selectedAgent);

  const handleAgentSelect = (agentId: string) => {
    setSelectedAgent(agentId);
  };

  const handleCreateTestData = async () => {
    const success = await createTestTrainingData();
    if (success) {
      await refreshSessionData();
    }
  };

  // Mode entraînement actif
  if (isTrainingActive && currentSessionId) {
    return (
      <ProtectedTrainingRoute>
        <div className="fixed inset-0 z-50 bg-background">
          <SimpleTrainingPlayer
            trainingType={configuration.trainingType}
            level={configuration.level}
            domain={configuration.domain}
            onComplete={handleTrainingComplete}
            onExit={handleTrainingExit}
          />
        </div>
      </ProtectedTrainingRoute>
    );
  }

  // Interface principale
  return (
    <ProtectedTrainingRoute>
      <TrainingLayout
        selectedAgent={selectedAgent}
        onAgentSelect={handleAgentSelect}
        user={user}
        showConfiguration={showConfiguration}
        onShowConfiguration={handleShowConfiguration}
        onSignOut={handleSignOut}
      >
        {/* NOUVELLE LOGIQUE SIMPLIFIÉE */}
        {shouldShowHero && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="p-6"
          >
            <div className="max-w-7xl mx-auto">
              <HeroSection 
                onStartTraining={handleStartTraining}
                onShowConfiguration={handleShowConfiguration}
                isLoading={isLoading}
                hasSessionData={hasSessionData}
              />
            </div>
          </motion.div>
        )}

        {shouldShowDashboard && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="p-6"
          >
            <div className="max-w-7xl mx-auto">
              <TrainingDashboard 
                sessionData={sessionData} 
                onStartTraining={handleStartTraining}
              />
            </div>
          </motion.div>
        )}

        {/* Configuration Section */}
        {showConfiguration && (
          <TrainingConfiguration
            configuration={configuration}
            onConfigurationChange={setConfiguration}
            onStartTraining={handleStartTraining}
            onBack={handleConfigurationBack}
          />
        )}

        {/* DEBUG PANEL (Développement uniquement) */}
        <DebugPanel
          sessionData={sessionData}
          isEmpty={isEmpty}
          user={user}
          configuration={configuration}
          isTrainingActive={isTrainingActive}
          showConfiguration={showConfiguration}
          isLoading={isLoading}
          onRefresh={refreshSessionData}
          onCreateTestData={handleCreateTestData}
        />
      </TrainingLayout>
    </ProtectedTrainingRoute>
  );
};

export default Training;