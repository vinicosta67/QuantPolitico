'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { getAgentResponseForDeputy } from './actions';

// ... (interface AgentCardProps)
interface AgentCardProps {
    deputyId: number;
    deputyName: string;
  }

export function AgentCard({ deputyId, deputyName }: AgentCardProps) {
  const initialQuestion = `Quais temas mais afetam a popularidade de ${deputyName}?`;
  
  const [question, setQuestion] = React.useState(initialQuestion);
  const [analysis, setAnalysis] = React.useState(''); // Para guardar a resposta ou o erro
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    setAnalysis(''); 
    
    const result = await getAgentResponseForDeputy({ deputyId, question });
    setAnalysis(result);

    setIsLoading(false);
  };

  return (
    <Card>
      <CardHeader><CardTitle>Agente</CardTitle></CardHeader>
      <CardContent className="text-center">
        <Textarea
          // ... (props da Textarea)
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="mb-4"
        />
        <Button
          className="w-full"
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isLoading ? 'Analisando...' : 'Simule o modelo de uma crise'}
        </Button>

        {analysis && (
          <div className="mt-4 p-3 bg-slate-100 rounded-lg text-left text-sm text-gray-800 whitespace-pre-wrap">
            <p className='font-bold mb-2'>Análise do Agente:</p>
            {analysis}
          </div>
        )}
      </CardContent>
    </Card>
  );
}