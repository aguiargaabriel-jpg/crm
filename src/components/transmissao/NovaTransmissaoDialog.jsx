import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Users } from 'lucide-react';

export default function NovaTransmissaoDialog({ open, onOpenChange }) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    nome: '',
    mensagem: '',
    intervalo_segundos: 30,
    webhook_url: '',
  });
  const [selecionados, setSelecionados] = useState([]);

  const { data: contatos = [] } = useQuery({
    queryKey: ['contatos'],
    queryFn: () => base44.entities.Contato.list('-created_date', 200),
  });

  const { data: webhooks = [] } = useQuery({
    queryKey: ['webhooks'],
    queryFn: () => base44.entities.WebhookConfig.list(),
  });

  const contatosFiltrados = contatos.filter(c =>
    !search ||
    c.nome?.toLowerCase().includes(search.toLowerCase()) ||
    c.whatsapp?.includes(search)
  );

  const toggleContato = (contato) => {
    setSelecionados(prev =>
      prev.find(c => c.contato_id === contato.id)
        ? prev.filter(c => c.contato_id !== contato.id)
        : [...prev, {
            contato_id: contato.id,
            contato_nome: contato.nome,
            contato_whatsapp: contato.whatsapp,
            status: 'pendente',
          }]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selecionados.length === 0) return alert('Selecione ao menos um contato.');
    if (!form.webhook_url) return alert('Informe a URL do webhook.');
    setLoading(true);
    await base44.entities.ListaTransmissao.create({
      ...form,
      intervalo_segundos: Number(form.intervalo_segundos),
      contatos: selecionados,
      status: 'rascunho',
      total_enviados: 0,
    });
    queryClient.invalidateQueries({ queryKey: ['transmissoes'] });
    setLoading(false);
    onOpenChange(false);
    setForm({ nome: '', mensagem: '', intervalo_segundos: 30, webhook_url: '' });
    setSelecionados([]);
    setSearch('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Nova Lista de Transmissão</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 overflow-hidden flex-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Nome da Transmissão</Label>
              <Input
                placeholder="Ex: Promoção de Maio"
                value={form.nome}
                onChange={e => setForm({ ...form, nome: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Intervalo entre envios (segundos)</Label>
              <Input
                type="number"
                min={5}
                value={form.intervalo_segundos}
                onChange={e => setForm({ ...form, intervalo_segundos: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Mensagem</Label>
            <Textarea
              placeholder="Digite a mensagem que será enviada para todos os contatos..."
              value={form.mensagem}
              onChange={e => setForm({ ...form, mensagem: e.target.value })}
              className="h-24 resize-none"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>URL do Webhook (N8N)</Label>
            <div className="flex gap-2">
              <Input
                placeholder="https://seu-n8n.com/webhook/..."
                value={form.webhook_url}
                onChange={e => setForm({ ...form, webhook_url: e.target.value })}
                className="flex-1"
              />
            </div>
            {webhooks.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                <span className="text-xs text-muted-foreground mr-1">Usar:</span>
                {webhooks.filter(w => w.ativo).slice(0, 4).map(w => (
                  <Badge
                    key={w.id}
                    variant="outline"
                    className="text-xs cursor-pointer hover:bg-muted"
                    onClick={() => setForm({ ...form, webhook_url: w.url })}
                  >
                    {w.nome}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Seleção de Contatos */}
          <div className="space-y-2 flex flex-col min-h-0 flex-1">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Contatos
              </Label>
              {selecionados.length > 0 && (
                <Badge className="bg-primary text-primary-foreground text-xs">
                  {selecionados.length} selecionado(s)
                </Badge>
              )}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar contatos..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
            <ScrollArea className="border rounded-lg flex-1 min-h-[150px] max-h-[200px]">
              <div className="p-2 space-y-0.5">
                {contatosFiltrados.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhum contato encontrado</p>
                ) : (
                  contatosFiltrados.map(contato => {
                    const checked = !!selecionados.find(c => c.contato_id === contato.id);
                    return (
                      <label
                        key={contato.id}
                        className="flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-muted cursor-pointer"
                      >
                        <Checkbox checked={checked} onCheckedChange={() => toggleContato(contato)} />
                        <div>
                          <p className="text-sm font-medium">{contato.nome}</p>
                          <p className="text-xs text-muted-foreground">{contato.whatsapp}</p>
                        </div>
                      </label>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Criando...' : 'Criar Transmissão'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}