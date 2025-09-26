'use server';
import { fetchDeputies } from "@/ai/tools/fetch-deputy-data";
import type { Deputy } from "@/lib/types";

type SearchFilters = {
    name?: string;
    party?: string;
    uf?: string;
}

export async function searchDeputies(filters: SearchFilters): Promise<Deputy[]> {
    try {
        const deputies = await fetchDeputies({ 
            name: filters.name || undefined,
            party: filters.party || undefined,
            uf: filters.uf || undefined,
        });
        // The API returns a limited list, so we'll just return what we get.
        // In a real application, we might implement pagination.
        return deputies;
    } catch (error) {
        console.error("Error fetching deputies:", error);
        return [];
    }
}
