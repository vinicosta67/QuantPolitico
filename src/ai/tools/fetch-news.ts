/**
 * @fileOverview A tool for fetching recent political news from Brazil.
 * 
 * - fetchPoliticalNews - Fetches news based on a query.
 */
'use server';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const fetchPoliticalNews = ai.defineTool(
  {
    name: 'fetchPoliticalNews',
    description: 'Fetches recent political news from Brazil. Can be filtered by a query. This tool simulates a real news API.',
    inputSchema: z.object({
      query: z.string().optional().describe('A search term to filter news articles. E.g., "reforma tributária", "PL 2630", "Jair Bolsonaro", "Lula", "Tarcísio"'),
    }),
    outputSchema: z.array(z.object({
      title: z.string().describe('The headline of the news article.'),
      source: z.string().describe('The source of the news article (e.g., news agency).'),
      url: z.string().describe('The URL to the full article.'),
      summary: z.string().describe('A brief summary of the article.'),
      publishedAt: z.string().describe('The publication date and time in ISO 8601 format.'),
    })),
  },
  async (input) => {
    // console.log(`(MOCK) Fetching news with query: ${input.query}`);
    const response = fetch('https://trademachine.blob.core.windows.net/base-dados/noticias_politica_broadcast.json')
    const result = (await response).json()
    // console.log('result: ', result)

    const allNews = [
        { id: '1', title: 'Lula defende reforma tributária em evento com empresários', source: 'Valor Econômico', summary: 'Presidente afirma que a reforma é essencial para o crescimento do país e promete diálogo com o Congresso.', url: '#lula-reforma', publishedAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString() },
        { id: '2', title: 'Tarcísio critica proposta de imposto único e defende modelo dual', source: 'Folha de S.Paulo', summary: 'Governador de São Paulo aponta riscos da proposta federal e apresenta alternativas em debate sobre a reforma tributária.', url: '#tarcisio-reforma', publishedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString() },
        { id: '3', title: 'Governo anuncia novo plano de segurança para fronteiras', source: 'O Globo', summary: 'Plano prevê aumento do efetivo e uso de tecnologia para combater o crime organizado na fronteira.', url: '#seguranca-fronteira', publishedAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString() },
        { id: '4', title: 'Oposição articula para obstruir votação de pauta econômica', source: 'Estadão', summary: 'Partidos de oposição, liderados pelo PL, tentam adiar votações importantes para o governo na Câmara.', url: '#oposicao-congresso', publishedAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString() },
        { id: '5', title: 'Meio ambiente: Ministra se reúne com governadores da Amazônia', source: 'Agência Brasil', summary: 'Encontro visa alinhar estratégias de combate ao desmatamento e desenvolvimento sustentável da região.', url: '#meio-ambiente-amazonia', publishedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString() },
        { id: '6', title: 'Tarcísio de Freitas inaugura nova linha de metrô em São Paulo', source: 'G1', summary: 'Nova linha beneficiará milhares de passageiros na capital paulista, com promessa de mais investimentos em transporte público.', url: '#tarcisio-metro', publishedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString() },
        { id: '7', title: 'Lula participa de cúpula do Mercosul e discute acordo com União Europeia', source: 'UOL Notícias', summary: 'Presidente busca avançar nas negociações comerciais, mas enfrenta resistências de países europeus em questões ambientais.', url: '#lula-mercosul', publishedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString() },
        { id: '8', title: 'Câmara aprova regime de urgência para projeto que regula redes sociais', source: 'Poder360', summary: 'Projeto de Lei 2630, conhecido como PL das Fake News, avança na Câmara e divide opiniões entre os parlamentares.', url: '#pl-2630', publishedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString() },
    ];
    
    if (!input.query || input.query.trim() === '') {
      return allNews.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    }

    const queryLower = input.query.toLowerCase();
    const filteredNews = allNews.filter(article => 
      article.title.toLowerCase().includes(queryLower) || 
      article.summary.toLowerCase().includes(queryLower)
    );

    return filteredNews.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  }
);
