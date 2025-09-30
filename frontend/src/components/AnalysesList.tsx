import React, { useState, useEffect } from 'react';
import { VideoAnalysis } from '../types';
import { videoService } from '../services/api';
import './AnalysesList.css';

interface AnalysesListProps {
  onAnalysisSelect?: (analysis: VideoAnalysis) => void;
  onClose?: () => void;
  searchResults?: VideoAnalysis[];
  searchQuery?: string;
  searchType?: 'filename' | 'content';
}

export const AnalysesList: React.FC<AnalysesListProps> = ({ 
  onAnalysisSelect, 
  onClose,
  searchResults,
  searchQuery,
  searchType
}) => {
  const [analyses, setAnalyses] = useState<VideoAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (searchResults) {
      // Se tem resultados de busca, usar eles
      setAnalyses(searchResults);
      setLoading(false);
    } else {
      // Caso contrário, carregar todas as análises
      loadAnalyses();
    }
  }, [searchResults]);

  const loadAnalyses = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await videoService.getAllAnalyses();
      setAnalyses(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Erro ao carregar análises:', err);
      setError(err.message || 'Erro ao carregar análises');
      setAnalyses([]); // Garantir que analyses seja sempre um array
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Data não disponível';
    
    try {
      return new Date(dateString).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Data inválida';
    }
  };

  const truncateText = (text: string, maxLength: number = 150) => {
    if (!text || text.length <= maxLength) return text || '';
    return text.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div className="analyses-overlay">
        <div className="analyses-modal">
          <div className="analyses-header">
            <h2>
              {searchQuery 
                ? `🔍 Resultados: "${searchQuery}"` 
                : '📚 Histórico de Análises'
              }
            </h2>
            {onClose && (
              <button onClick={onClose} className="close-button">
                ✕
              </button>
            )}
          </div>
          <div className="loading-analyses">
            <div className="spinner-small"></div>
            <p>Carregando análises...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="analyses-overlay">
      <div className="analyses-modal">
        <div className="analyses-header">
          <h2>
            {searchQuery 
              ? `� Resultados: "${searchQuery}"` 
              : '�📚 Histórico de Análises'
            }
          </h2>
          {searchQuery && searchType && (
            <div className="search-type-indicator">
              {searchType === 'filename' 
                ? "🎬 Busca por nome de arquivo" 
                : "📝 Busca por conteúdo"
              }
            </div>
          )}
          {onClose && (
            <button onClick={onClose} className="close-button">
              ✕
            </button>
          )}
        </div>

        {error && (
          <div className="error-message">
            <p>❌ {error}</p>
            <button onClick={loadAnalyses} className="retry-button">
              Tentar Novamente
            </button>
          </div>
        )}

        {!error && (
          <div className="analyses-content">
            {!analyses || analyses.length === 0 ? (
              <div className="empty-state">
                <p>📝 Nenhuma análise encontrada</p>
                <p className="empty-description">
                  Faça upload de um vídeo para criar sua primeira análise
                </p>
              </div>
            ) : (
              <div className="analyses-list">
                {analyses.map((analysis) => (
                  <div
                    key={analysis.id}
                    className="analysis-item"
                    onClick={() => onAnalysisSelect?.(analysis)}
                  >
                    <div className="analysis-header">
                      <h3 className="analysis-filename">
                        🎬 {analysis?.filename || 'Arquivo sem nome'}
                      </h3>
                      <span className="analysis-date">
                        {analysis?.createdAt ? formatDate(analysis.createdAt) : 'Data desconhecida'}
                      </span>
                    </div>
                    
                    <div className="analysis-preview">
                      <div className="preview-section">
                        <h4>📝 Transcrição</h4>
                        <p>{truncateText(analysis?.transcription || 'Transcrição não disponível')}</p>
                      </div>
                      
                      <div className="preview-section">
                        <h4>🤖 Análise</h4>
                        <p>{truncateText(analysis?.analysis || 'Análise não disponível')}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};