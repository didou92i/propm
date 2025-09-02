import React from 'react';
import { motion } from 'framer-motion';

interface TestTrainingComponentProps {
  trainingType: string;
  onComplete: (score: number, answers: any[]) => void;
  onExit: () => void;
}

export const TestTrainingComponent: React.FC<TestTrainingComponentProps> = ({
  trainingType,
  onComplete,
  onExit
}) => {
  return (
    <motion.div 
      className="fixed inset-0 bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 max-w-md text-center text-white">
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <h2 className="text-2xl font-bold mb-4">🎮 Test Training Component</h2>
          <p className="mb-4">Type d'entraînement: <span className="font-bold text-blue-300">{trainingType}</span></p>
          
          <div className="space-y-4">
            <div className="p-4 bg-green-500/20 rounded-lg">
              <p className="text-green-300">✅ Composant de test fonctionnel</p>
            </div>
            
            <div className="p-4 bg-blue-500/20 rounded-lg">
              <p className="text-blue-300">🔧 Validation du flux de données</p>
            </div>
            
            <div className="flex gap-4 mt-6">
              <button
                onClick={() => onComplete(85, [])}
                className="flex-1 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors"
              >
                Terminer (Score: 85%)
              </button>
              
              <button
                onClick={onExit}
                className="flex-1 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors"
              >
                Quitter
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};