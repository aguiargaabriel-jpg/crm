import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Bot, User, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

function MensagemBubble({ mensagem }) {
  const isContato = mensagem.remetente === 'contato';
  const isChatbot = mensagem.remetente === 'chatbot';

  return (
    <div className={cn("flex gap-2 max-w-[80%]", isContato ? "self-start" : "self-end flex-row-reverse")}>
      <div className={cn(
        "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0",
        isContato ? "bg-muted" : isChatbot ? "bg-blue-100" : "bg-primary/10"
      )}>
        {isContato ? <Smartphone className="w-3.5 h-3.5 text-muted-foreground" /> : 
         isChatbot ? <Bot className="w-3.5 h-3.5 text-blue-600" /> :
         <User className="w-3.5 h-3.5 text-primary" />}
      </div>
      <div className={cn(
        "rounded-2xl px-4 py-2.5",
        isContato 
          ? "bg-muted rounded-tl-md" 
          : isChatbot 
            ? "bg-blue-50 text-blue-900 rounded-tr-md border border-blue-100" 
            : "bg-primary text-primary-foreground rounded-tr-md"
      )}>
        <p className="text-sm whitespace-pre-wrap">{mensagem.conteudo}</p>
        <p className={cn(
          "text-[10px] mt-1",
          isContato ? "text-muted-foreground" : isChatbot ? "text-blue-400" : "text-primary-foreground/60"
        )}>
          {mensagem.created_date 
            ? format(new Date(mensagem.created_date), "HH:mm", { locale: ptBR })
            : ''}
        </p>
      </div>
    </div>
  );
}

export default function ConversaChat({ conversaId }) {
  const [mensagemTexto, setMensagemTexto] = useState('');
  const chatEndRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: mensagens = [], isLoading } = useQuery({
    queryKey: ['mensagens', conversaId],
    queryFn: () => base44.entities.Mensagem.filter({ conversa_id: conversaId }, '-created_date', 100),
    enabled: !!conversaId,
    refetchInterval: 5000,
  });

  const enviarMutation = useMutation({
    mutationFn: async (conteudo) => {
      const msg = await base44.entities.Mensagem.create({
        conversa_id: conversaId,
        remetente: 'atendente',
        conteudo,
        tipo: 'texto',
      });
      await base44.entities.Conversa.update(conversaId, {
        ultima_mensagem: conteudo,
        ultima_mensagem_data: new Date().toISOString(),
      });
      return msg;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mensagens', conversaId] });
      queryClient.invalidateQueries({ queryKey: ['conversas'] });
    },
  });

  const handleEnviar = (e) => {
    e.preventDefault();
    if (!mensagemTexto.trim()) return;
    enviarMutation.mutate(mensagemTexto.trim());
    setMensagemTexto('');
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  const sortedMensagens = [...mensagens].reverse();

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col">
        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <Skeleton key={i} className="h-12 w-2/3" />)}
          </div>
        ) : sortedMensagens.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground text-sm">Nenhuma mensagem ainda</p>
          </div>
        ) : (
          sortedMensagens.map(msg => <MensagemBubble key={msg.id} mensagem={msg} />)
        )}
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={handleEnviar} className="p-4 border-t border-border bg-card">
        <div className="flex gap-2">
          <Input 
            value={mensagemTexto}
            onChange={e => setMensagemTexto(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={!mensagemTexto.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
