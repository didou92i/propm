import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { SimpleTrainingPlayer } from '@/components/training/SimpleTrainingPlayer';
import { TrainingHero, PerformanceDashboard, TrainingConfiguration, TrainingLayout } from '@/components/training';
import { ProtectedTrainingRoute } from '@/components/ProtectedTrainingRoute';
import { useAgentTheme } from "@/hooks/useAgentTheme";
import { useTrainingManager } from '@/hooks/training';
import { DEFAULT_TRAINING_CONFIG } from '@/config/training';

const Training = () => {
  const [selectedAgent, setSelectedAgent] = useState("prepacds");
  
  // Hook principal pour gérer l'entraînement
  const {
    state,
    configuration,
    user,
    currentSessionId,
    setConfiguration,
    handleStartTraining,
    handleTrainingComplete,
    handleTrainingExit,
    handleShowConfiguration,
    handleConfigurationBack,
    handleSignOut,
    isLoading
  } = useTrainingManager(DEFAULT_TRAINING_CONFIG);

  useAgentTheme(selectedAgent);

  const handleAgentSelect = (agentId: string) => {
    setSelectedAgent(agentId);
  };

  // Mode entraînement actif
  if (state.isTrainingActive && currentSessionId) {
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
        showConfiguration={state.showConfiguration}
        onShowConfiguration={handleShowConfiguration}
        onSignOut={handleSignOut}
      >
        {/* Hero Section */}
        {!state.showConfiguration && (
          <TrainingHero 
            onStartTraining={handleStartTraining}
            onShowConfiguration={handleShowConfiguration}
            isLoading={isLoading}
          />
        )}

        {/* Performance Dashboard - Toujours visible */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: state.showConfiguration ? 0 : 0.3 }}
          className="p-6"
        >
          <div className="max-w-7xl mx-auto">
            <PerformanceDashboard onStartTraining={handleStartTraining} />
          </div>
        </motion.div>

        {/* Configuration Section */}
        {state.showConfiguration && (
          <TrainingConfiguration
            configuration={configuration}
            onConfigurationChange={setConfiguration}
            onStartTraining={handleStartTraining}
            onBack={handleConfigurationBack}
          />
        )}
      </TrainingLayout>
    </ProtectedTrainingRoute>
  );
};

export default Training;