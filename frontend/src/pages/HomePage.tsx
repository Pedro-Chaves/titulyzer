import React, { useState } from 'react';
import { VideoUpload } from '../components/VideoUpload';
import { LoadingAnalysis } from '../components/LoadingAnalysis';
import { AnalysesList } from '../components/AnalysesList';
import { videoService } from '../services/api';
import { UploadResponse, VideoAnalysis } from '../types';
import './HomePage.css';

export const HomePage: React.FC = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentFile, setCurrentFile] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<UploadResponse | null>(null);
  const [error, setError] = useState<string>('');
  const [showAnalysesList, setShowAnalysesList] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<VideoAnalysis[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchType, setSearchType] = useState<'filename' | 'content' | null>(null);

  const handleFileUpload = async (file: File) => {
    try {
      setError('');
      setCurrentFile(file.name);
      setUploadProgress(0);
      setIsUploading(true);
      
      // Inicia o processo completo (upload + análise)
      setIsAnalyzing(true);

      // Upload e processamento em uma única chamada
      const response = await videoService.uploadVideo(file, (progress) => {
        setUploadProgress(progress);
      });

      // Processamento concluído
      setAnalysisResult(response);
      setIsAnalyzing(false);
      setIsUploading(false);

    } catch (err: any) {
      setIsUploading(false);
      console.error('Erro no upload:', err);
      
      // Verificar se é erro de timeout
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        // Para timeout, manter o estado de análise e mostrar mensagem especial
        setError('A análise está demorando mais que o esperado. O vídeo pode ser grande. Aguarde mais um pouco ou cancele se necessário.');
        // Manter isAnalyzing = true para continuar mostrando o loading
      } else {
        // Para outros erros, parar a análise
        setIsAnalyzing(false);
        setError(err.response?.data?.message || 'Erro ao processar o vídeo. Tente novamente.');
      }
    }
  };

  const handleStartOver = () => {
    setAnalysisResult(null);
    setError('');
    setCurrentFile('');
    setUploadProgress(0);
  };

  const handleStopAnalysis = () => {
    setIsAnalyzing(false);
    setIsUploading(false);
    setError('');
    setCurrentFile('');
    setUploadProgress(0);
  };

  const handleContinueAnalysis = () => {
    setError(''); // Limpa a mensagem de timeout para continuar aguardando
  };

  const handleAnalysisSelect = (analysis: VideoAnalysis) => {
    if (!analysis) {
      setError('Erro: análise inválida selecionada');
      return;
    }
    
    // Converter VideoAnalysis para UploadResponse format
    const result: UploadResponse = {
      success: true,
      message: 'Análise carregada do histórico',
      title: analysis?.filename || 'Arquivo sem nome',
      description: analysis?.analysis || 'Análise não disponível',
      summary: analysis?.transcription || 'Transcrição não disponível',
      tags: [] // VideoAnalysis não tem tags no formato atual
    };
    
    setAnalysisResult(result);
    setCurrentFile(analysis?.filename || 'Arquivo sem nome');
    setShowAnalysesList(false);
  };

  const handleShowAnalyses = () => {
    setShowAnalysesList(true);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      setIsSearching(true);
      setError('');
      
      const { results, searchType: type } = await videoService.searchAnalyses(searchQuery);
      setSearchResults(results);
      setSearchType(type);
      
      // Se encontrou resultados, mostrar a lista com os resultados filtrados
      if (results.length > 0) {
        setShowAnalysesList(true);
      } else {
        setError(`Nenhuma análise encontrada para "${searchQuery}"`);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar busca');
      console.error('Erro na busca:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSearchType(null);
    setError('');
  };

  if (analysisResult) {
    return (
      <div className="homepage-container">
        <div className="result-container">
          <div className="result-header">
            <h1>✅ Análise Concluída!</h1>
            <p className="filename">📹 {currentFile}</p>
          </div>

          <div className="result-content">
            <div className="result-section">
              <h2>🎬 Título</h2>
              <div className="transcription-box">
                <p>
                  {analysisResult.title && analysisResult.title.trim() 
                    ? analysisResult.title 
                    : 'Nenhum título identificado.'}
                </p>
              </div>
            </div>

            <div className="result-section">
              <h2>📝 Descrição</h2>
              <div className="analysis-box">
                <p>
                  {analysisResult.description && analysisResult.description.trim()
                    ? analysisResult.description 
                    : 'Nenhuma descrição disponível.'}
                </p>
              </div>
            </div>

            <div className="result-section">
              <h2>📋 Resumo</h2>
              <div className="analysis-box">
                <p>
                  {analysisResult.summary && analysisResult.summary.trim()
                    ? analysisResult.summary 
                    : 'Nenhum resumo disponível.'}
                </p>
              </div>
            </div>

            <div className="result-section">
              <h2>🏷️ Tags</h2>
              <div className="tags-container">
                {analysisResult.tags && analysisResult.tags.length > 0 ? (
                  analysisResult.tags.map((tag, index) => (
                    <span key={index} className="tag">
                      {tag}
                    </span>
                  ))
                ) : (
                  <p>Nenhuma tag identificada.</p>
                )}
              </div>
            </div>
          </div>

          <div className="result-actions">
            <button className="home-button" onClick={handleStartOver}>
              🏠 Voltar ao Início
            </button>
            <button className="primary-button" onClick={handleStartOver}>
              Analisar Novo Vídeo
            </button>
            <button className="secondary-button" onClick={() => window.print()}>
              Imprimir Resultado
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="homepage-container">
      <div className="homepage-header">
        <div className="header-content">
          <div className="header-text">
            <h1>🎬 Titulyzer</h1>
            <p>Análise inteligente de vídeos com transcrição automática e insights de IA</p>
          </div>
          
          <div className="header-actions">
            <div className="search-container">
              <div className="search-box">
                <input
                  type="text"
                  className="search-input"
                  placeholder="Buscar por nome ou conteúdo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleSearchKeyPress}
                />
                <button 
                  className="search-button" 
                  onClick={handleSearch}
                  disabled={isSearching || !searchQuery.trim()}
                >
                  {isSearching ? '⏳' : '🔍'}
                </button>
              </div>
              
              {searchQuery && searchType && (
                <div className="search-hint">
                  {searchType === 'filename' 
                    ? "🎬 Buscando por nome de arquivo" 
                    : "📝 Buscando no conteúdo das análises"
                  }
                </div>
              )}
            </div>
            
            <button className="history-button" onClick={handleShowAnalyses}>
              📚 Histórico
            </button>
          </div>
        </div>
      </div>

      <VideoUpload
        onFileSelect={handleFileUpload}
        isUploading={isUploading}
        uploadProgress={uploadProgress}
      />

      {error && !isAnalyzing && (
        <div className="error-message">
          <h3>❌ Erro</h3>
          <p>{error}</p>
          <button onClick={() => setError('')} className="error-dismiss">
            Tentar Novamente
          </button>
        </div>
      )}

      <div className="homepage-info">
        <h3>Como funciona?</h3>
        <div className="info-steps">
          <div className="info-step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h4>Upload do Vídeo</h4>
              <p>Faça upload do seu vídeo em formatos MP4, AVI, MOV, WMV ou MKV</p>
            </div>
          </div>
          <div className="info-step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h4>Processamento</h4>
              <p>Extraímos o áudio e fazemos a transcrição automática</p>
            </div>
          </div>
          <div className="info-step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h4>Análise IA</h4>
              <p>Nossa IA analisa o conteúdo e gera insights valiosos</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Loading overlay */}
      {isAnalyzing && (
        <LoadingAnalysis 
          filename={currentFile} 
          error={error}
          onCancel={handleStopAnalysis}
          onContinue={handleContinueAnalysis}
        />
      )}
      
      {/* Analyses List Modal */}
      {showAnalysesList && (
        <AnalysesList 
          onAnalysisSelect={handleAnalysisSelect}
          onClose={() => {
            setShowAnalysesList(false);
            clearSearch();
          }}
          searchResults={searchResults.length > 0 ? searchResults : undefined}
          searchQuery={searchQuery}
          searchType={searchType || undefined}
        />
      )}
    </div>
  );
};
