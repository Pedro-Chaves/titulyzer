import { Injectable } from '@nestjs/common';
import axios from 'axios';

interface BaseVideoAnalysis {
  title: string;
  description: string;
  summary: string;
  tags: string[];
}

export interface VideoAnalysis extends BaseVideoAnalysis {
  aiModel: string;
}

@Injectable()
export class AiService {
  private readonly openaiApiKey: string | undefined;
  private readonly groqApiKey: string | undefined;
  private readonly geminiApiKey: string | undefined;
  private readonly openaiBaseUrl = 'https://api.openai.com/v1';
  private readonly groqBaseUrl = 'https://api.groq.com/openai/v1';

  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    this.groqApiKey = process.env.GROQ_API_KEY;
    this.geminiApiKey = process.env.GEMINI_API_KEY;

    const configuredApis: string[] = [];

    if (this.groqApiKey) {
      configuredApis.push('Groq');
    }
    if (this.geminiApiKey) {
      configuredApis.push('Google Gemini');
    }
    if (this.openaiApiKey) {
      configuredApis.push('OpenAI');
    }

    if (configuredApis.length === 0) {
      console.error('❌ ERRO: Nenhuma API de IA configurada!');
      console.log(
        '📝 Configure pelo menos uma das seguintes APIs no arquivo .env:',
      );
      console.log('   • GROQ_API_KEY (Gratuito - Recomendado)');
      console.log('   • GEMINI_API_KEY (Gratuito)');
      console.log('   • OPENAI_API_KEY (Pago)');
      throw new Error('Nenhuma API de IA configurada');
    } else {
      console.log(`✅ APIs de IA configuradas: ${configuredApis.join(', ')}`);
    }
  }

  async analyzeVideoContent(
    transcription: string,
    originalFilename?: string,
  ): Promise<VideoAnalysis> {
    if (this.groqApiKey) {
      try {
        console.log('🚀 Gerando com Groq AI (GRATUITO)...');
        return await this.callGroqApi(transcription, originalFilename);
      } catch (error) {
        console.error('❌ Erro no Groq:', error.message);
        if (error.response) {
          console.error('📋 Detalhes do erro Groq:', {
            status: error.response.status,
            data: error.response.data,
          });
        }
      }
    }

    if (this.geminiApiKey) {
      try {
        console.log('🌟 Gerando com Google Gemini (GRATUITO)...');
        return await this.callGeminiApi(transcription, originalFilename);
      } catch (error) {
        console.error('❌ Erro no Gemini:', error.message);
        if (error.response) {
          console.error('📋 Detalhes do erro Gemini:', {
            status: error.response.status,
            data: error.response.data,
          });
        }
      }
    }

    if (this.openaiApiKey) {
      try {
        console.log('🤖 Gerando com OpenAI...');
        return await this.callOpenAiApi(transcription, originalFilename);
      } catch (error) {
        console.error('❌ Erro na OpenAI:', error.message);
        if (error.response) {
          console.error('📋 Detalhes do erro OpenAI:', {
            status: error.response.status,
            data: error.response.data,
          });
        }
      }
    }

    throw new Error(
      'Todas as APIs de IA falharam. Verifique suas chaves de API e conexão com a internet.',
    );
  }

  private async callGroqApi(
    transcription: string,
    originalFilename?: string,
  ): Promise<VideoAnalysis> {
    if (!this.groqApiKey) {
      throw new Error('GROQ_API_KEY não configurada');
    }

    this.validateInputs(this.groqApiKey, transcription, 'GROQ_API_KEY');

    const prompt = this.buildPrompt(transcription, originalFilename);
    const limitedPrompt = this.limitPromptSize(prompt, 8000);

    const models = [
      'llama-3.1-8b-instant',
      'llama-3.2-3b-preview',
      'mixtral-8x7b-32768',
    ];

    for (const model of models) {
      try {
        const response = await this.makeApiRequest(
          `${this.groqBaseUrl}/chat/completions`,
          {
            model,
            messages: [
              {
                role: 'system',
                content:
                  'Você é um especialista em criação de conteúdo para YouTube. Crie títulos chamativos e descrições envolventes baseadas na transcrição do vídeo.',
              },
              {
                role: 'user',
                content: limitedPrompt,
              },
            ],
            max_tokens: 1000,
            temperature: 0.7,
          },
          {
            Authorization: `Bearer ${this.groqApiKey}`,
            'Content-Type': 'application/json',
          },
        );

        const analysis = this.parseAiResponse(
          response.data.choices[0].message.content,
        );
        return { ...analysis, aiModel: 'groq' };
      } catch (error) {
        if (models.indexOf(model) === models.length - 1) {
          throw error;
        }
        continue;
      }
    }

    throw new Error('Todos os modelos Groq falharam');
  }

  private async callGeminiApi(
    transcription: string,
    originalFilename?: string,
  ): Promise<VideoAnalysis> {
    const prompt = this.buildPrompt(transcription, originalFilename);

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${this.geminiApiKey}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1000 },
      },
      { headers: { 'Content-Type': 'application/json' }, timeout: 30000 },
    );

    const analysis = this.parseAiResponse(
      response.data.candidates[0].content.parts[0].text,
    );
    return { ...analysis, aiModel: 'gemini' };
  }

  private async callOpenAiApi(
    transcription: string,
    originalFilename?: string,
  ): Promise<VideoAnalysis> {
    const prompt = this.buildPrompt(transcription, originalFilename);

    const response = await axios.post(
      `${this.openaiBaseUrl}/chat/completions`,
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'Você é um especialista em criação de conteúdo para YouTube. Crie títulos chamativos e descrições envolventes baseadas na transcrição do vídeo.',
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      },
    );

    const analysis = this.parseAiResponse(
      response.data.choices[0].message.content,
    );
    return { ...analysis, aiModel: 'openai' };
  }

  private buildPrompt(
    transcription: string,
    originalFilename?: string,
  ): string {
    const filename = originalFilename
      ? `\nNome do arquivo original: ${originalFilename}`
      : '';

    return `
INSTRUÇÃO CRÍTICA: Responda APENAS com um JSON válido. Não adicione texto antes, depois ou explicações.

Baseado na transcrição de vídeo abaixo, crie conteúdo para YouTube:

${filename}

TRANSCRIÇÃO:
"${transcription}"

RESPONDA SOMENTE COM ESTE JSON (copie a estrutura exata):
{
  "title": "Título chamativo e otimizado para YouTube (máximo 100 caracteres)",
  "description": "Descrição detalhada e envolvente com call-to-action (200-500 palavras)",
  "summary": "Resumo conciso em 1-2 frases sobre o conteúdo principal",
  "tags": ["palavra1", "palavra2", "palavra3", "palavra4", "palavra5"]
}

REGRAS OBRIGATÓRIAS:
1. Use EXATAMENTE essas chaves: "title", "description", "summary", "tags"
2. TODOS os 4 campos são OBRIGATÓRIOS - não deixe nenhum vazio
3. "summary" deve ser uma frase concisa sobre o tema principal
4. "tags" deve ter exatamente 5 palavras-chave relevantes
5. Conteúdo em português brasileiro
6. Retorne APENAS o JSON, sem marcações ou qualquer outro texto

EXEMPLO DO FORMATO ESPERADO:
{
  "title": "exemplo",
  "description": "exemplo longo",
  "summary": "exemplo resumo",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}`;
  }

  private parseAiResponse(aiResponse: string): BaseVideoAnalysis {
    try {
      const jsonMatch = this.extractJsonFromResponse(aiResponse);

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch);
        return this.normalizeAndCleanParsedData(parsed);
      }
    } catch (error) {
      console.error('Erro ao fazer parse da resposta da AI:', error.message);
    }

    return this.extractFromPlainText(aiResponse);
  }

  private extractJsonFromResponse(response: string): string | null {
    // Tenta extrair JSON com diferentes padrões
    let jsonMatch = response.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      // Procura por JSON entre backticks
      const backtickMatch = response.match(
        /```(?:json)?\s*(\{[\s\S]*?\})\s*```/,
      );
      if (backtickMatch) {
        jsonMatch = [backtickMatch[1]];
      }
    }

    if (!jsonMatch) {
      // Busca linha por linha
      const lines = response.split('\n');
      let jsonStart = -1;
      let jsonEnd = -1;

      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('{') && jsonStart === -1) {
          jsonStart = i;
        }
        if (lines[i].trim().endsWith('}') && jsonStart !== -1) {
          jsonEnd = i;
          break;
        }
      }

      if (jsonStart !== -1 && jsonEnd !== -1) {
        return lines.slice(jsonStart, jsonEnd + 1).join('\n');
      }
    }

    return jsonMatch ? jsonMatch[0] : null;
  }

  private normalizeAndCleanParsedData(parsed: any): BaseVideoAnalysis {
    const normalized = {
      title: parsed.title || parsed.título || parsed.titulo,
      description: parsed.description || parsed.descrição || parsed.descricao,
      summary: parsed.summary || parsed.resumo,
      tags: parsed.tags || parsed.etiquetas || [],
    };

    // Validação específica para garantir que campos obrigatórios não fiquem vazios
    const cleanedSummary = this.cleanText(normalized.summary);
    const cleanedTags = Array.isArray(normalized.tags) ? normalized.tags : [];

    return {
      title: this.cleanText(normalized.title) || 'Título não gerado',
      description:
        this.cleanText(normalized.description) || 'Descrição não gerada',
      summary:
        cleanedSummary && cleanedSummary.length > 10
          ? cleanedSummary
          : 'Resumo do conteúdo do vídeo analisado',
      tags:
        cleanedTags.length > 0
          ? cleanedTags
          : ['vídeo', 'análise', 'conteúdo', 'youtube', 'entretenimento'],
    };
  }

  private cleanText(text: string): string {
    if (!text || typeof text !== 'string') return text;

    return (
      text
        // Remove marcações markdown
        .replace(/\*\*([^*]+)\*\*/g, '$1') // **texto** -> texto
        .replace(/\*([^*]+)\*/g, '$1') // *texto* -> texto
        .replace(/`([^`]+)`/g, '$1') // `texto` -> texto
        .replace(/#{1,6}\s*/g, '') // ### -> (remove headers)

        // Remove padrões específicos problemáticos do Groq
        .replace(/^\*{2,4}\s*["""]?/, '') // Remove **** no início
        .replace(/["""]?\s*\*{2,4}$/, '') // Remove **** no final
        .replace(/^["""]/, '') // Remove aspas no início
        .replace(/["""]$/, '') // Remove aspas no final

        // Remove prefixos comuns que as IAs colocam
        .replace(/^(Título:|Title:|TÍTULO:|TITLE:)\s*/i, '')
        .replace(/^(Descrição:|Description:|DESCRIÇÃO:|DESCRIPTION:)\s*/i, '')
        .replace(/^(Resumo:|Summary:|RESUMO:|SUMMARY:)\s*/i, '')

        // Remove estruturas duplicadas que aparecem na descrição
        .replace(/\*\*Título:\*\*[^"]*"/g, '') // Remove **Título:** "texto"
        .replace(/\*\*Descrição:\*\*[^"]*"/g, '') // Remove **Descrição:** "texto"
        .replace(/\*\*Resumo:\*\*[^"]*"/g, '') // Remove **Resumo:** "texto"

        // Remove quebras de linha com marcação
        .replace(/\\n/g, ' ') // Remove \n literais
        .replace(/\n\*\*[^:]+:\*\*/g, '\n') // Remove títulos com ** no meio

        // Remove quebras de linha desnecessárias no início/fim
        .replace(/^\n+/, '')
        .replace(/\n+$/, '')

        // Normaliza quebras de linha múltiplas
        .replace(/\n{3,}/g, '\n\n') // Máximo 2 quebras seguidas

        // Limpa espaços extras
        .trim()
    );
  }

  private extractFromPlainText(text: string): BaseVideoAnalysis {
    const lines = text.split('\n').filter((line) => line.trim());
    let title = 'Título Gerado pela IA';

    // Procura por padrões comuns de título
    for (const line of lines) {
      if (
        line.toLowerCase().includes('título') ||
        line.toLowerCase().includes('title') ||
        line.includes('**')
      ) {
        title = line.replace(/título:?|title:?/gi, '').trim() || title;
        break;
      }
    }

    // Gera um resumo baseado nas primeiras linhas
    const firstLines = lines.slice(0, 3).join(' ');
    const generatedSummary =
      firstLines.length > 20
        ? firstLines.substring(0, 150) + '...'
        : 'Análise de conteúdo de vídeo com insights e discussões relevantes.';

    // Gera tags padrão baseado no conteúdo
    const defaultTags = ['vídeo', 'análise', 'conteúdo', 'youtube', 'review'];

    return {
      title: this.cleanText(title).substring(0, 100),
      description: this.cleanText(text).substring(0, 1000),
      summary: this.cleanText(generatedSummary).substring(0, 200),
      tags: defaultTags,
    };
  }

  // Funções auxiliares
  private validateInputs(
    apiKey: string,
    transcription: string,
    keyName: string,
  ): void {
    if (!apiKey || apiKey.trim() === '') {
      throw new Error(`${keyName} está vazia ou inválida`);
    }
    if (!transcription || transcription.trim() === '') {
      throw new Error('Transcrição está vazia');
    }
  }

  private limitPromptSize(prompt: string, maxLength: number): string {
    return prompt.length > maxLength
      ? prompt.substring(0, maxLength) +
          '\n\n[Transcrição truncada devido ao tamanho]'
      : prompt;
  }

  private async makeApiRequest(
    url: string,
    data: any,
    headers: any,
  ): Promise<any> {
    return axios.post(url, data, {
      headers,
      timeout: 30000,
    });
  }
}
