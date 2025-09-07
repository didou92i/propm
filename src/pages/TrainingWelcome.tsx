import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TrainingWelcome as TrainingWelcomeComponent } from '@/components/training/TrainingWelcome';
import { ProtectedTrainingRoute } from '@/components/ProtectedTrainingRoute';

const TrainingWelcome = () => {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate('/training/dashboard');
  };

  return (
    <ProtectedTrainingRoute>
      <TrainingWelcomeComponent onStart={handleStart} />
    </ProtectedTrainingRoute>
  );
};

export default TrainingWelcome;