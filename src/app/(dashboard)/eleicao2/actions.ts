'use server';

import { simulateScenario } from "@/ai/flows/simulate-scenario";
import { buildElectionData, type ElectionFilters, type ElectionSources } from "@/lib/election-mock";

export async function fetchElectionData(filters: Partial<ElectionFilters> & { fontes?: Partial<ElectionSources> }) {
    try {
        const finalFilters: ElectionFilters = {
            cargo: (filters.cargo as any) || 'governador',
            estado: (filters.estado as any) || 'sp',
            partido: (filters.partido as any) || 'partido_a',
        }
        const fontes: ElectionSources = {
            midia: filters.fontes?.midia ?? true,
            redes: filters.fontes?.redes ?? true,
            legislativo: filters.fontes?.legislativo ?? false,
        }
        const data = buildElectionData(finalFilters, fontes);
        return data as any;
    } catch (error) {
        console.error("Error fetching election analytics:", error);
        return null;
    }
}

export async function runScenario({ hypothesis }: { hypothesis: string }) {
    try {
        if (!hypothesis || !hypothesis.trim()) {
            return { impactAnalysis: 'Forneça uma hipótese para simular.', kpiChanges: [] } as any;
        }
        if (!process.env.OPENAI_API_KEY) {
            return { impactAnalysis: 'Configuração ausente: defina OPENAI_API_KEY para habilitar o simulador.', kpiChanges: [] } as any;
        }
        const res = await simulateScenario({ hypothesis });
        return res;
    } catch (error) {
        console.error('Scenario simulation failed:', error);
        return { impactAnalysis: `Falha ao simular: ${(error as Error).message}`, kpiChanges: [] } as any;
    }
}
