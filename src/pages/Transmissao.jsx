import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Radio, Play, Pause, Eye, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import NovaTransmissaoDialog from '@/components/transmissao/NovaTransmissaoDialog';
import TransmissaoDetalheDialog from '@/components/transmissao/TransmissaoDetalheDialog';

const statusConfig = {
  rascunho: { label: 'Rascunho', className: 'bg-gray-100 text-gray-600' },
  em_andamento: { label: 'Em Andamento', className: 'bg-blue-100 text-blue-700' },
  concluido: { label: 'Concluído', className: 'bg-emerald-100 text-emerald-700' },
  pausado: { label: 'Pausado', className: 'bg-amber-100 text-amber-700' },
};

export default function Transmissao() {
  const [showNova, setShowNova] = useState(false);
  const [detalhe, setDetalhe] = useState(null);
  const queryClient = useQueryClient();

  const { data: listas = [], isLoading } = useQuery({
    queryKey: ['transmissoes'],
    queryFn: () => base44.entities.ListaTransmissao.list('-created_date', 100),
  });

  const handleDelete = async (id) => {
    if (!confirm('Excluir esta lista de transmissão?')) return;
    await base44.entities.ListaTransmissao.delete(id);
    queryClient.invalidateQueries({ queryKey: ['transmissoes'] });
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lista de Transmissão</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Envie mensagens em sequência para múltiplos contatos via webhook
          </p>
        </div>
        <Button onClick={() => setShowNova(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Transmissão
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Card key={i}><CardContent className="p-5"><Skeleton className="h-16" /></CardContent></Card>)}
        </div>
      ) : listas.length === 0 ? (
        <Card>
          <CardContent className="p-16 text-center">
            <Radio className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="font-medium text-muted-foreground">Nenhuma transmissão criada</p>
            <p className="text-sm text-muted-foreground mt-1">
              Crie uma lista para disparar mensagens em sequência
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {listas.map(lista => {
            const cfg = statusConfig[lista.status] || statusConfig.rascunho;
            const total = lista.contatos?.length || 0;
            const enviados = lista.contatos?.filter(c => c.status === 'enviado').length || 0;

            return (
              <Card key={lista.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Radio className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold">{lista.nome}</p>
                        <Badge variant="outline" className={`text-xs ${cfg.className}`}>
                          {cfg.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{lista.mensagem}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>👥 {total} contato(s)</span>
                        <span>✅ {enviados} enviado(s)</span>
                        <span>⏱️ {lista.intervalo_segundos || 30}s entre envios</span>
                        {lista.created_date && (
                          <span>📅 {format(new Date(lista.created_date), "dd/MM/yy HH:mm", { locale: ptBR })}</span>
                        )}
                      </div>
                      {total > 0 && (
                        <div className="mt-2 w-full bg-muted rounded-full h-1.5">
                          <div
                            className="bg-primary h-1.5 rounded-full transition-all"
                            style={{ width: `${(enviados / total) * 100}%` }}
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setDetalhe(lista)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(lista.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <NovaTransmissaoDialog open={showNova} onOpenChange={setShowNova} />
      {detalhe && (
        <TransmissaoDetalheDialog
          lista={detalhe}
          open={!!detalhe}
          onOpenChange={v => { if (!v) setDetalhe(null); }}
          onUpdate={() => queryClient.invalidateQueries({ queryKey: ['transmissoes'] })}
        />
      )}
    </div>
  );
}