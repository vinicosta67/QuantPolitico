import { ChatClient } from './chat-client';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AgentePage() {
  return (
    <div className="h-[calc(100vh-10rem)] flex flex-col">
      <CardHeader className="px-0">
          <CardTitle>Assistente de Análise Política</CardTitle>
          <CardDescription>
            Faça perguntas estratégicas, peça análises ou simule cenários.
            Ex: "Qual o impacto da notícia X no candidato Y?" ou "Resuma a percepção pública sobre a reforma tributária."
          </CardDescription>
        </CardHeader>
      <ChatClient />
    </div>
  );
}
