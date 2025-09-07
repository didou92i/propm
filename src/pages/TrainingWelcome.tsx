import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TrainingWelcome as TrainingWelcomeComponent } from '@/components/training/TrainingWelcome';
import { ProtectedRoute } from '@/components/ProtectedRoute';

const TrainingWelcome = () => {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate('/training/dashboard');
  };

  return (
    <ProtectedRoute>
      <TrainingWelcomeComponent onStart={handleStart} />
    </ProtectedRoute>
  );
};

export default TrainingWelcome;