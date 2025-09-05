import React from 'react';
import { motion } from 'framer-motion';
import { ActionButton } from '../atoms/ActionButton';
import { Play, Settings, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HeroActionsProps {
  onStartTraining: () => void;
  onShowConfiguration: () => void;
  isLoading?: boolean;
  hasSessionData?: boolean;
}

export const HeroActions: React.FC<HeroActionsProps> = ({
  onStartTraining,
  onShowConfiguration,
  isLoading = false,
  hasSessionData = false
}) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.6 }}
      className="flex flex-col sm:flex-row gap-4 justify-center items-center"
    >
      <ActionButton
        variant="primary"
        onClick={onStartTraining}
        isLoading={isLoading}
        icon={<Play className="h-5 w-5" />}
        className="px-8 py-3 text-lg font-semibold min-w-[200px]"
      >
        Nouvel Entraînement
      </ActionButton>

      <ActionButton
        variant="outline"
        onClick={onShowConfiguration}
        icon={<Settings className="h-4 w-4" />}
        className="px-6 py-3"
      >
        Entraînement Personnalisé
      </ActionButton>

      {hasSessionData && (
        <ActionButton
          variant="secondary"
          onClick={() => navigate('/dashboard')}
          icon={<BarChart3 className="h-4 w-4" />}
          className="px-6 py-3"
        >
          Mes Statistiques
        </ActionButton>
      )}
    </motion.div>
  );
};