import { getDeputyPageData } from './actions'; 
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User } from 'lucide-react';
import { ApprovalChart, PopularityChart, SentimentChart } from './charts';
import { AgentCard } from './AgentCard'; // 👈 PASSO 1: Importe o novo componente

const NewsItem = ({ title, source, time }: { title: string, source: string, time: string }) => (
    <div className="py-3 border-b last:border-b-0">
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground">{source} • {time}</p>
    </div>
);


export default async function DeputyDetailPage({ params }: { params: { id: string } }) {
    const deputyId = parseInt(params.id, 10);
    const data = await getDeputyPageData(deputyId);

    if (!data) {
        return <div className="container mx-auto text-center py-10">Deputado não encontrado.</div>;
    }

    const { basicInfo, analytics } = data;

    return (
        <div className="container mx-auto max-w-7xl space-y-6 p-4 bg-slate-50">
            {/* ... (Cabeçalho e primeira linha de cards continuam iguais) ... */}
             <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                    <AvatarImage src={basicInfo.urlFoto} alt={basicInfo.nome} />
                    <AvatarFallback><User /></AvatarFallback>
                </Avatar>
                <div>
                    <h1 className="text-3xl font-bold">{basicInfo.nome}</h1>
                    <p className="text-muted-foreground">{basicInfo.siglaPartido} - {basicInfo.siglaUf} • Exaa Base SP</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <PopularityChart data={analytics.popularidade} />
                
                <ApprovalChart data={analytics.aprovacao} />

                <Card className="lg:col-span-2">
                    <CardHeader><CardTitle>Notícias</CardTitle></CardHeader>
                    <CardContent>
                        {analytics.noticias.map(news => (
                             <NewsItem key={news.title} {...news} />
                        ))}
                    </CardContent>
                </Card>
            </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                <Card className="lg:col-span-1">
                    <CardHeader><CardTitle className="text-base font-medium">Tendências Narrativas</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                        {analytics.tendenciasNarrativas.map(tema => (
                            <div key={tema} className="text-sm p-2 bg-gray-100 rounded">{tema}</div>
                        ))}
                    </CardContent>
                </Card>

                {/* 👇 PASSO 2: Substitua o Card antigo pelo novo componente AgentCard */}
                <AgentCard 
                    deputyId={deputyId} 
                    deputyName={basicInfo.nome.split(' ')[0]} 
                />
             </div>
        </div>
    );
}