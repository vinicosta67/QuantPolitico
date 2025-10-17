'use client';

import * as React from 'react';
import { CornerDownLeft, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Message } from '@/lib/types';
import { getAiResponse } from './actions';
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast"


export function ChatClient() {
  const { toast } = useToast()
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input || isLoading) return;

    const newUserMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input,
    };
    const newMessages = [...messages, newUserMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
        // console.log('newMessages,skuce: ', newMessages.slice(-5))
        const aiResponse = await getAiResponse(newMessages.slice(-5)); // Send last 5 messages for context
        
        const newAiMessage: Message = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: aiResponse,
        };
        setMessages((prev) => [...prev, newAiMessage]);

    } catch (error) {
        toast({
            variant: "destructive",
            title: "Erro de comunicação",
            description: "Não foi possível obter uma resposta do assistente.",
        })
    } finally {
        setIsLoading(false);
    }
  };

  React.useEffect(() => {
    if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTo({
            top: scrollAreaRef.current.scrollHeight,
            behavior: 'smooth'
        });
    }
  }, [messages])

  return (
    <div className="relative flex flex-1 flex-col rounded-xl bg-card/60 p-4 shadow-sm">
      <ScrollArea className="flex-1 mb-4 pr-4" ref={scrollAreaRef}>
        <div className="space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex items-start gap-4',
                message.role === 'user' ? 'justify-end' : ''
              )}
            >
              {message.role === 'assistant' && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback><Bot /></AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  'max-w-[75%] rounded-lg p-3 text-sm',
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                )}
              >
                {message.content}
              </div>
              {message.role === 'user' && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback><User /></AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
           {isLoading && (
            <div className="flex items-start gap-4">
              <Avatar className="h-8 w-8">
                <AvatarFallback><Bot /></AvatarFallback>
              </Avatar>
              <div className="max-w-[75%] rounded-lg bg-muted p-3 text-sm">
                <div className="flex items-center gap-2">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-foreground/50" style={{ animationDelay: '0s' }} />
                    <span className="h-2 w-2 animate-pulse rounded-full bg-foreground/50" style={{ animationDelay: '0.2s' }} />
                    <span className="h-2 w-2 animate-pulse rounded-full bg-foreground/50" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      <form
        onSubmit={handleSubmit}
        className="relative overflow-hidden rounded-lg border bg-background focus-within:ring-1 focus-within:ring-ring"
      >
        <Label htmlFor="message" className="sr-only">
          Message
        </Label>
        <Input
          id="message"
          placeholder="Digite sua pergunta aqui..."
          className="min-h-12 resize-none border-0 p-3 shadow-none focus-visible:ring-0"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
        />
        <div className="flex items-center p-3 pt-0">
          <Button type="submit" size="sm" className="ml-auto gap-1.5" disabled={isLoading}>
            Enviar
            <CornerDownLeft className="h-3.5 w-3.5" />
          </Button>
        </div>
      </form>
    </div>
  );
}
