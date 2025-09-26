import { config } from 'dotenv';
config();

import '@/ai/flows/interact-with-political-analyst.ts';
import '@/ai/flows/cluster-political-topics.ts';
import '@/ai/flows/analyze-political-sentiment.ts';
import '@/ai/flows/simulate-scenario.ts';
import '@/ai/tools/fetch-news.ts';
import '@/ai/tools/fetch-deputy-data.ts';
import '@/app/(dashboard)/deputados/actions.ts';
import '@/app/(dashboard)/noticias/actions.ts';
