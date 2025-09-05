import React from 'react';
import { motion } from 'framer-motion';
import { MonitoringDashboard } from '@/components/monitoring';
import { ArrowLeft, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { BetaIndicator } from '@/components/common/BetaIndicator';

const Dashboard = () => {
  const navigate = useNavigate();

  const handleBackToTraining = () => {
    navigate('/training');
  };

  return (
    <div className="min-h-screen bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="p-6"
      >
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header avec navigation */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={handleBackToTraining}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Retour Entraînement</span>
              </Button>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold text-foreground">
                  Dashboard Complet
                </h1>
                <BetaIndicator showMetrics />
              </div>
            </div>
          </div>

          {/* Monitoring Dashboard */}
          <MonitoringDashboard />
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;