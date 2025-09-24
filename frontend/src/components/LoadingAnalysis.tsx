import React, { useState, useEffect } from 'react';
import './LoadingAnalysis.css';

interface LoadingAnalysisProps {
  filename: string;
  error?: string;
  onCancel?: () => void;
  onContinue?: () => void;
}

export const LoadingAnalysis: React.FC<LoadingAnalysisProps> = ({ 
  filename, 
  error,
  onCancel,
  onContinue 
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { icon: '🎬', label: 'Processando vídeo' },
    { icon: '🎵', label: 'Extraindo áudio' },
    { icon: '📝', label: 'Transcrevendo conteúdo' },
    { icon: '🤖', label: 'Analisando com IA' }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length);
    }, 3000); // Alterna entre os steps a cada 3 segundos

    return () => clearInterval(interval);
  }, [steps.length]);

  return (
    <div className="loading-overlay">
      <div className="loading-modal">
        <div className="loading-content">
          <div className="loading-spinner">
            <div className="spinner"></div>
          </div>
          
          <h2>Analisando seu vídeo...</h2>
          <p className="filename">📹 {filename}</p>
          
          <div className="loading-steps">
            {steps.map((step, index) => (
              <div 
                key={index}
                className={`step ${index === currentStep ? 'processing' : ''}`}
              >
                <div className="step-icon">{step.icon}</div>
                <span>{step.label}</span>
              </div>
            ))}
          </div>
          
          <div className="loading-status">
            <p className="status-text">Processando...</p>
            <p className="status-description">Aguarde enquanto analisamos seu vídeo</p>
          </div>
          
          {error ? (
            <div className="timeout-message">
              <p className="timeout-text">⚠️ {error}</p>
              <div className="timeout-actions">
                <button onClick={onContinue} className="continue-button">
                  Continuar Aguardando
                </button>
                {onCancel && (
                  <button onClick={onCancel} className="cancel-button">
                    Cancelar Análise
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="loading-message">
              <p>Este processo pode levar alguns minutos dependendo do tamanho do arquivo...</p>
              <p>Por favor, não feche esta janela.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
