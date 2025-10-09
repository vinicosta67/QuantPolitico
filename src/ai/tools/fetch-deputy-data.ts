/**
 * @fileOverview Tools for fetching data about Brazilian deputies from the "Dados Abertos" API.
 *
 * - fetchDeputies - Fetches a list of deputies.
 * - fetchDeputyExpenses - Fetches the expenses for a specific deputy.
 * - fetchParties - Fetches a list of political parties.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
// Reusable fetch with timeout and Next cache hints
async function timedFetch(url: string, init?: RequestInit & { next?: { revalidate?: number } }, timeoutMs = 8000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      // Prefer caching between requests; override per-call if needed
      cache: 'force-cache',
      next: { revalidate: 60 * 30, ...(init?.next ?? {}) },
      ...(init ?? {}),
      signal: controller.signal,
    } as any);
    return res;
  } finally {
    clearTimeout(id as any);
  }
}

async function fetchAllDeputies() {
  let allDeputies: any[] = [];
  let page = 1;
  const BATCH_SIZE = 100;
  let hasMore = true;

  // console.log('Fetching all deputies from API...');

  while (hasMore) {
    const params = new URLSearchParams({
      ordem: 'ASC',
      ordenarPor: 'nome',
      itens: BATCH_SIZE.toString(),
      pagina: page.toString(),
    });
    
    try {
      const response = await timedFetch(`https://dadosabertos.camara.leg.br/api/v2/deputados?${params.toString()}`);
      if (!response.ok) {
        console.error(`API call failed for page ${page} with status: ${response.status}`);
        break; // Stop if there's an error
      }
      
      const data = await response.json();
      
      if (data.dados && data.dados.length > 0) {
        allDeputies = allDeputies.concat(data.dados);
        page++;
      } else {
        hasMore = false;
      }

      // Check the 'next' link to see if there are more pages
      const nextLink = data.links.find((link: any) => link.rel === 'next');
      if (!nextLink) {
        hasMore = false;
      }

    } catch (error) {
      console.error(`Error fetching page ${page} of deputies:`, error);
      hasMore = false; // Stop on network or parsing error
    }
  }
  
  // console.log(`Finished fetching. Total deputies found: ${allDeputies.length}`);
  return allDeputies;
}

export const fetchDeputies = ai.defineTool(
  {
    name: 'fetchDeputies',
    description: 'Fetches a list of current Brazilian federal deputies. If a name is provided, it filters by that name. Otherwise, it returns the complete list of all deputies.',
    inputSchema: z.object({
      name: z.string().optional().describe('Filter deputies by name.'),
      party: z.string().optional().describe('Filter deputies by party acronym (e.g., PT, PL).'),
      uf: z.string().optional().describe('Filter deputies by state acronym (e.g., SP, RJ).'),
    }),
    outputSchema: z.array(z.object({
        id: z.number(),
        nome: z.string(),
        siglaPartido: z.string(),
        siglaUf: z.string(),
        urlFoto: z.string(),
    })),
  },
  async (input) => {
    // If a specific name is provided, perform a targeted search
    if (input.name) {
      // Some queries with diacritics (e.g., João) may not match; try a few normalized variants
      const stripAccents = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '');
      const original = input.name.trim();
      const normalized = stripAccents(original);
      const firstToken = original.split(/\s+/)[0] || original;
      const firstTokenNorm = stripAccents(firstToken);
      const attempts = Array.from(new Set([original, normalized, firstToken, firstTokenNorm])).filter(Boolean);

      const results: any[] = [];
      for (const nameAttempt of attempts) {
        const params = new URLSearchParams();
        params.append('nome', nameAttempt);
        if (input.party) params.append('siglaPartido', input.party);
        if (input.uf) params.append('siglaUf', input.uf);
        params.append('ordem', 'ASC');
        params.append('ordenarPor', 'nome');
        try {
          const response = await timedFetch(`https://dadosabertos.camara.leg.br/api/v2/deputados?${params.toString()}`, { next: { revalidate: 60 * 10 } });
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`API call failed with status: ${response.status}`, errorText);
            continue;
          }
          const data = await response.json();
          if (Array.isArray(data?.dados) && data.dados.length) {
            results.push(...data.dados);
            // If we already have hits, no need to try further variants
            break;
          }
        } catch (error) {
          console.error('Error fetching specific deputy attempt:', nameAttempt, error);
          // try next attempt
        }
      }
      // Deduplicate by id
      const dedup = new Map<number, any>();
      for (const d of results) dedup.set(d.id, d);
      let finalList = Array.from(dedup.values());

      // Fallback: if still empty, fetch the full list once and filter client-side (diacritics-insensitive)
      if (finalList.length === 0) {
        try {
          const all = await fetchAllDeputies();
          const nrm = (s: string) => (s || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
          const qn = nrm(original);
          finalList = all.filter((d: any) => nrm(d.nome).includes(qn));
        } catch (e) {
          console.error('Fallback fetchAllDeputies failed:', e);
        }
      }

      return finalList;
    }

    try {
      // Cache the full list aggressively; callers can still filter in-memory
      let allDeputies = await fetchAllDeputies();

      if (input.party) {
        allDeputies = allDeputies.filter(d => d.siglaPartido === input.party);
      }
      if (input.uf) {
        allDeputies = allDeputies.filter(d => d.siglaUf === input.uf);
      }

      return allDeputies;
    } catch (error) {
      console.error('Error fetching all deputies:', error);
      return [];
    }
  }
);

export const getDeputyDetailsAndAnalytics = ai.defineTool(
   {
     name: 'getDeputyDetailsAndAnalytics',
     description: 'Fetches detailed information and simulated analytics for a specific deputy by their ID.',
     inputSchema: z.object({
      id: z.number().describe('The unique ID of the deputy.'),
     }),
     outputSchema: z.object({
     basicInfo: z.object({
       id: z.number(),
       nome: z.string(),
       siglaPartido: z.string(),
       siglaUf: z.string(),
       urlFoto: z.string(),
     }),
     analytics: z.object({
       popularidade: z.object({
       favoravel: z.number(),
       provavel: z.number(),
       desfavoravel: z.number(),
     }),
     aprovacao: z.array(z.object({ month: z.string(), value: z.number() })),
     analiseSentimento: z.array(z.object({ month: z.string(), value: z.number() })),
     tendenciasNarrativas: z.array(z.string()),
          noticias: z.array(z.object({
              title: z.string(),
              source: z.string(),
              time: z.string(),
          })),
     }),
     }),
    },
    async (input) => {
      const response = await timedFetch(`https://dadosabertos.camara.leg.br/api/v2/deputados/${input.id}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch deputy with ID: ${input.id}`);
      }
      const data = await response.json();
      const deputyDataFromApi = data.dados;
  
    const formattedBasicInfo = {
      id: deputyDataFromApi.id,
      nome: deputyDataFromApi.ultimoStatus.nome,
      siglaPartido: deputyDataFromApi.ultimoStatus.siglaPartido,
      siglaUf: deputyDataFromApi.ultimoStatus.siglaUf,
      urlFoto: deputyDataFromApi.ultimoStatus.urlFoto,
    };

      const analytics = {
        popularidade: {
          favoravel: Math.floor(Math.random() * 30) + 10, // 10-39
          provavel: Math.floor(Math.random() * 20) + 30,  // 30-49
          desfavoravel: Math.floor(Math.random() * 20) + 10, // 10-29
        },
        aprovacao: [
          { month: 'Jul', value: Math.floor(Math.random() * 20) + 25 },
          { month: 'Ago', value: Math.floor(Math.random() * 20) + 30 },
          { month: 'Set', value: Math.floor(Math.random() * 20) + 32 },
          { month: 'Out', value: Math.floor(Math.random() * 20) + 28 },
        ],
        analiseSentimento: [
          { month: 'Jan', value: Math.floor(Math.random() * 400) + 200 },
          { month: 'Abr', value: Math.floor(Math.random() * 400) + 300 },
          { month: 'Jul', value: Math.floor(Math.random() * 400) + 250 },
          { month: 'Set', value: Math.floor(Math.random() * 400) + 400 },
        ],
        tendenciasNarrativas: ['Reforma da Previdência', 'Saúde Pública', 'Economia', 'Segurança', 'Meio Ambiente'],
        noticias: [
          { title: 'Reforma da Previdência, novo projeto e apresentação', source: 'Causa Polític', time: '10h ago' },
          { title: 'Desemprego tem queda no último trimestre', source: 'ABC', time: '1 dia ago' },
          { title: 'Ares camento fos ser queada apos ultimos dados', source: 'Dis', time: '2 dias ago' },
        ]
      };
  
      return { basicInfo: formattedBasicInfo, analytics };
    }
  );

export const fetchDeputyExpenses = ai.defineTool(
  {
    name: 'fetchDeputyExpenses',
    description: "Fetches the monthly expenses for a specific deputy in a given year.",
    inputSchema: z.object({
      deputyId: z.number().describe('The ID of the deputy.'),
      year: z.number().describe('The year to fetch expenses for.'),
    }),
    outputSchema: z.array(z.object({
        ano: z.number(),
        mes: z.number(),
        tipoDespesa: z.string(),
        valorDocumento: z.number(),
    })),
  },
  async ({ deputyId, year }) => {
    try {
        const response = await timedFetch(`https://dadosabertos.camara.leg.br/api/v2/deputados/${deputyId}/despesas?ano=${year}&itens=100&ordem=DESC&ordenarPor=dataDocumento`, { next: { revalidate: 60 * 60 } });
        if (!response.ok) {
            throw new Error(`API call failed with status: ${response.status}`);
        }
        const data = await response.json();
        return data.dados.map((expense: any) => ({
            ano: expense.ano,
            mes: expense.mes,
            tipoDespesa: expense.tipoDespesa,
            valorDocumento: expense.valorLiquido,
        }));
    } catch (error) {
        console.error(`Error fetching expenses for deputy ${deputyId}:`, error);
        // Return an empty array on failure
        return [];
    }
  }
);

export const fetchParties = ai.defineTool(
    {
      name: 'fetchParties',
      description: 'Fetches a list of Brazilian political parties.',
      inputSchema: z.object({}),
      outputSchema: z.array(z.object({
          id: z.number(),
          sigla: z.string(),
          nome: z.string(),
      })),
    },
    async () => {
      try {
        const response = await timedFetch(`https://dadosabertos.camara.leg.br/api/v2/partidos?ordem=ASC&ordenarPor=sigla`, { next: { revalidate: 60 * 60 * 24 } });
        if (!response.ok) {
          throw new Error(`API call failed with status: ${response.status}`);
        }
        const data = await response.json();
        return data.dados;
      } catch (error) {
        console.error('Error fetching parties:', error);
        return [];
      }
    }
  );

  export const getElectionAnalytics = ai.defineTool(
    {
      name: 'getElectionAnalytics',
      description: 'Generates a simulated analysis for an election scenario based on role, state, and party.',
      inputSchema: z.object({
        cargo: z.string().optional(),
        estado: z.string().optional(),
        partido: z.string().optional(),
      }),
      outputSchema: z.object({
        kpis: z.object({
          iap: z.number(),
          iapP: z.number(),
          its: z.number(),
        }),
        mapaTemas: z.array(z.object({
          tema: z.string(),
          valor: z.number(),
        })),
        redesSociais: z.array(z.object({
          tema: z.string(),
          twitter: z.number(),
          facebook: z.number(),
          instagram: z.number(),
        })),
        stakeholders: z.array(z.object({
          nome: z.string(),
          cargo: z.string(),
          papel: z.string(),
          impacto: z.number(),
          proximoEvento: z.string(),
        })),
      }),
    },
    async (input) => {
      console.log(`Simulating election data for:`, input);
  
      const rand = (min: number, max: number, decimals = 0) => {
          const str = (Math.random() * (max - min) + min).toFixed(decimals);
          return parseFloat(str);
      }
  
      return {
        kpis: {
          iap: rand(35, 55),
          iapP: rand(30, 50),
          its: rand(0.5, 0.8, 2),
        },
        mapaTemas: [
          { tema: 'Economia', valor: rand(70, 95) },
          { tema: 'Segurança', valor: rand(80, 98) },
          { tema: 'Educação', valor: rand(60, 85) },
          { tema: 'Meio Ambiente', valor: rand(40, 75) },
        ],
        redesSociais: [
            { tema: 'Economia', twitter: rand(1,5), facebook: rand(1,5), instagram: rand(1,5) },
            { tema: 'Segurança', twitter: rand(1,5), facebook: rand(1,5), instagram: rand(1,5) },
            { tema: 'Saúde', twitter: rand(1,5), facebook: rand(1,5), instagram: rand(1,5) },
            { tema: 'Educação', twitter: rand(1,5), facebook: rand(1,5), instagram: rand(1,5) },
        ],
        stakeholders: [
          { nome: 'Beltrano', cargo: 'Apoiante', papel: 'Autor', impacto: rand(0.5, 1.2, 2), proximoEvento: 'Prontos em...' },
          { nome: 'Ciclano', cargo: 'Presidente', papel: 'Influente', impacto: -rand(0.3, 0.8, 2), proximoEvento: 'Ação...' },
          { nome: 'Maria da Silva', cargo: 'Autor', papel: 'Influenciado', impacto: rand(0.7, 1.0, 2), proximoEvento: 'Partido...' },
          { nome: 'João Souza', cargo: 'Influencer', papel: 'Positivo', impacto: -rand(0.05, 0.2, 2), proximoEvento: 'Já...' },
        ],
      };
    }
  );

  export const analyzeDeputyWithAI = ai.defineFlow(
    {
      name: 'analyzeDeputyWithAI',
      inputSchema: z.object({
        deputyId: z.number(),
        question: z.string(),
      }),
      outputSchema: z.string(), 
    },
    async ({ deputyId, question }) => {
      const deputyData = await getDeputyDetailsAndAnalytics({ id: deputyId });
  
      if (!deputyData) {
        console.error(`[Flow] Falha ao buscar dados para o deputado ID: ${deputyId}`);
        return `Não foi possível encontrar os dados para o deputado com ID ${deputyId}. A API da Câmara pode estar offline ou o ID é inválido.`;
      }
  
      const analystPrompt = ai.definePrompt({
        name: 'deputyAnalystPrompt',
        input: { schema: z.object({ deputyDataStr: z.string(), question: z.string() }) },
        output: { schema: z.object({ response: z.string() }) },
        model: 'openai/gpt-4o',
        prompt: `Você é um analista político sênior... (seu prompt completo aqui)`,
      });
  
      try {
        const deputyDataStr = JSON.stringify(deputyData, null, 2);
        console.log(`[Flow] Enviando ${deputyDataStr.length} caracteres para a IA... lalalal`);
  
        const { output } = await analystPrompt({
          deputyDataStr,
          question,
        });
  
        if (!output?.response) {
          return "A análise da IA não retornou uma resposta. Isso pode ser causado por dados de entrada muito longos (excesso de tokens) ou filtros de conteúdo da OpenAI.";
        }
  
        return output.response;
  
      } catch (error) {

        console.error("[Flow] Erro CRÍTICO durante a execução do prompt da IA:", error);
  

        return `Erro ao se comunicar com a IA: ${(error as Error).message}`;
      }
    }
  );
