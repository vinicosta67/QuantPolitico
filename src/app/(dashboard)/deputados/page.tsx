'use client';
// This page has no server-side data on render; ensure static HTML for faster TTFB
export const dynamic = 'force-static';
import * as React from 'react';
import Image from 'next/image';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {Loader2, User, Search} from 'lucide-react';
import type {Deputy} from '@/lib/types';
import {searchDeputies} from './actions';
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';
import {Badge} from '@/components/ui/badge';
import { useDebounce } from 'use-debounce';
import Link from 'next/link';


function getDeputyStatus(
  party: string,
): {text: string; variant: 'default' | 'secondary' | 'destructive'} {
  const governmentParties = ['PT', 'MDB', 'PSD', 'PCdoB', 'PV', 'REDE', 'PSB'];
  const oppositionParties = ['PL', 'PP', 'REPUBLICANOS', 'NOVO'];
  const independentParties = ['UNIÃO', 'PODE', 'PSDB', 'CIDADANIA'];

  if (governmentParties.includes(party.toUpperCase())) {
    return {text: 'Governo', variant: 'default'};
  }
  if (oppositionParties.includes(party.toUpperCase())) {
    return {text: 'Oposição', variant: 'destructive'};
  }
  if (independentParties.includes(party.toUpperCase())) {
    return {text: 'Independente', variant: 'secondary'};
  }
  return {text: 'Outro', variant: 'secondary'};
}

export default function DeputadosPage() {
  const [deputies, setDeputies] = React.useState<Deputy[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [name, setName] = React.useState('');
  const [hasSearched, setHasSearched] = React.useState(false);
  const [debouncedName] = useDebounce(name, 500);

  const handleSearch = React.useCallback(async (searchName: string) => {
    setIsLoading(true);
    setHasSearched(true);
    try {
      const result = await searchDeputies({name: searchName});
      setDeputies(result);
    } catch (error) {
      console.error('Failed to search deputies', error);
      setDeputies([]);
    } finally {
      setIsLoading(false);
    }
  }, []);


  React.useEffect(() => {
    if (debouncedName) {
      handleSearch(debouncedName);
    } else {
        setDeputies([]);
        setHasSearched(false);
    }
  }, [debouncedName, handleSearch]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSearch(name);
  };

  return (
    <div className="container mx-auto max-w-5xl space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          Busca de Parlamentares
        </h1>
        <p className="text-muted-foreground mt-2">
          Encontre informações sobre deputados federais.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="relative mx-auto max-w-2xl">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="name"
          placeholder="Digite o nome do deputado..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-full bg-card py-6 pl-12 shadow-sm"
        />
        {isLoading && (
            <Loader2 className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin" />
        )}
      </form>

      {hasSearched && !isLoading && deputies.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              Nenhum deputado encontrado para "{debouncedName}".
            </p>
          </CardContent>
        </Card>
      )}

      {deputies.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {deputies.map((deputy) => {
            const status = getDeputyStatus(deputy.siglaPartido);
            return (
              <Link key={deputy.id} href={`/deputados/${deputy.id}`} className="block h-full">
                <Card
                  key={deputy.id}
                  className="transition-shadow hover:shadow-md w-full"
                >
                  <CardContent className="flex flex-col items-center p-4 text-center">
                    <Avatar className="ring-primary/20 mb-4 h-24 w-24 ring-2">
                      <AvatarImage src={deputy.urlFoto} alt={deputy.nome} />
                      <AvatarFallback>
                        <User />
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-lg font-bold">{deputy.nome}</p>
                    <p className="text-sm text-muted-foreground">
                      {deputy.siglaPartido} - {deputy.siglaUf}
                    </p>
                    <Badge variant={status.variant} className="mt-3">
                      {status.text}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
