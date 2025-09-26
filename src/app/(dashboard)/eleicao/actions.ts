'use server';

import {simulateScenario} from '@/ai/flows/simulate-scenario';
import type {SimulateScenarioOutput} from '@/ai/flows/simulate-scenario';

export async function runSimulation(
  hypothesis: string
): Promise<SimulateScenarioOutput> {
  const result = await simulateScenario({hypothesis});
  return result;
}
