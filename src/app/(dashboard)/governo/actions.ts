'use server';
import { generateGovernmentProfile } from '@/ai/flows/generate-government-profile';
import type { GovernmentProfileOutput } from '@/ai/flows/generate-government-profile';

export type GovernmentData = GovernmentProfileOutput;

export async function searchGovernmentPolitician(query: string): Promise<GovernmentData> {
  const q = (query || '').trim();
  const name = q.length ? q : 'Jao Silva';
  const data = await generateGovernmentProfile({ query: name });
  return data;
}

