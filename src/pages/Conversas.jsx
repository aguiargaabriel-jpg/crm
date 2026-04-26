import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Search, Plus, MessageSquare, Filter } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import ConversaListItem from '@/components/conversas/ConversaListItem';
import NovaConversaDialog from '@/components/conversas/NovaConversaDialog';

export default function Conversas() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [prioridadeFilter, setPrioridadeFilter] = useState('todos');
  const [showNewDialog, setShowNewDialog] = useState(false);

  const { data: conversas = [], isLoading } = useQuery({
    queryKey: ['conversas'],
    queryFn: () => base44.entities.Conversa.list('-updated_date', 200),
  });

  const { data: tags = [] } = useQuery({
    queryKey: ['tags'],
    queryFn: () => base44.entities.TagPersonalizada.list(),
  });

  const filtered = conversas.filter(c => {
    const matchSearch = !search || 
      c.contato_nome?.toLowerCase().includes(search.toLowerCase()) ||
      c.contato_whatsapp?.includes(search);
    const matchStatus = statusFilter === 'todos' || c.status === statusFilter;
    const matchPrioridade = prioridadeFilter === 'todos' || c.prioridade === prioridadeFilter;
    return matchSearch && matchStatus && matchPrioridade;
  });

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Conversas</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{conversas.length} conversa(s) no total</p>
        </div>
        <Button onClick={() => setShowNewDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Conversa
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nome ou WhatsApp..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Status</SelectItem>
            <SelectItem value="novo">Novo</SelectItem>
            <SelectItem value="em_atendimento">Em Atendimento</SelectItem>
            <SelectItem value="aguardando">Aguardando</SelectItem>
            <SelectItem value="resolvido">Resolvido</SelectItem>
            <SelectItem value="arquivado">Arquivado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={prioridadeFilter} onValueChange={setPrioridadeFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Prioridade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas</SelectItem>
            <SelectItem value="baixa">Baixa</SelectItem>
            <SelectItem value="media">Média</SelectItem>
            <SelectItem value="alta">Alta</SelectItem>
            <SelectItem value="urgente">Urgente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="flex gap-3 items-center">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground font-medium">Nenhuma conversa encontrada</p>
            <p className="text-sm text-muted-foreground mt-1">
              {search || statusFilter !== 'todos' ? 'Tente ajustar os filtros' : 'Clique em "Nova Conversa" para começar'}
            </p>
          </div>
        ) : (
          filtered.map(conversa => (
            <ConversaListItem key={conversa.id} conversa={conversa} tags={tags} />
          ))
        )}
      </Card>

      <NovaConversaDialog open={showNewDialog} onOpenChange={setShowNewDialog} />
    </div>
  );
}