import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Phone, MoreVertical, Trash2 } from 'lucide-react';
import ContatoAvatar from '@/components/shared/ContatoAvatar';
import StatusBadge from '@/components/shared/StatusBadge';
import ConversaChat from '@/components/conversas/ConversaChat';
import ConversaSidebar from '@/components/conversas/ConversaSidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useQueryClient } from '@tanstack/react-query';

export default function ConversaDetalhe() {
  const urlParams = new URLSearchParams(window.location.search);
  const conversaId = window.location.pathname.split('/').pop();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: conversa, isLoading } = useQuery({
    queryKey: ['conversa', conversaId],
    queryFn: async () => {
      const results = await base44.entities.Conversa.filter({ id: conversaId });
      return results[0];
    },
    enabled: !!conversaId,
  });

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir esta conversa?')) return;
    await base44.entities.Conversa.delete(conversaId);
    queryClient.invalidateQueries({ queryKey: ['conversas'] });
    navigate('/conversas');
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Skeleton className="w-20 h-20 rounded-full" />
      </div>
    );
  }

  if (!conversa) {
    return (
      <div className="h-screen flex items-center justify-center flex-col gap-4">
        <p className="text-muted-foreground">Conversa não encontrada</p>
        <Button variant="outline" onClick={() => navigate('/conversas')}>Voltar</Button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="h-16 border-b border-border bg-card flex items-center px-4 gap-3 flex-shrink-0">
        <Button variant="ghost" size="icon" onClick={() => navigate('/conversas')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <ContatoAvatar nome={conversa.contato_nome} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-sm truncate">{conversa.contato_nome}</h2>
            <StatusBadge status={conversa.status} />
          </div>
          <p className="text-xs text-muted-foreground">{conversa.contato_whatsapp}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleDelete} className="text-destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir Conversa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col">
          <ConversaChat conversaId={conversaId} />
        </div>
        <div className="w-72 border-l border-border bg-card hidden lg:block">
          <ConversaSidebar conversa={conversa} />
        </div>
      </div>
    </div>
  );
}