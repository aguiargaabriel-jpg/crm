import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Plus, Pencil, Trash2, Webhook, Copy, CheckCheck, Zap, Globe } from 'lucide-react';

const EVENTOS = [
  { value: 'nova_conversa', label: 'Nova Conversa', cor: 'bg-blue-100 text-blue-700' },
  { value: 'mensagem_recebida', label: 'Mensagem Recebida', cor: 'bg-green-100 text-green-700' },
  { value: 'status_alterado', label: 'Status Alterado', cor: 'bg-amber-100 text-amber-700' },
  { value: 'novo_contato', label: 'Novo Contato', cor: 'bg-purple-100 text-purple-700' },
  { value: 'tag_adicionada', label: 'Tag Adicionada', cor: 'bg-pink-100 text-pink-700' },
  { value: 'prioridade_alterada', label: 'Prioridade Alterada', cor: 'bg-orange-100 text-orange-700' },
  { value: 'conversa_resolvida', label: 'Conversa Resolvida', cor: 'bg-emerald-100 text-emerald-700' },
];

function EventoBadge({ evento }) {
  const config = EVENTOS.find(e => e.value === evento);
  return (
    <Badge variant="outline" className={`text-xs ${config?.cor || ''}`}>
      {config?.label || evento}
    </Badge>
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy}>
      {copied ? <CheckCheck className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
    </Button>
  );
}

function WebhookForm({ webhook, onSave, onCancel, loading }) {
  const [form, setForm] = useState(webhook || {
    nome: '', url: '', evento: '', segredo: '', ativo: true
  });

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="space-y-4">
      <div className="space-y-2">
        <Label>Nome do Webhook</Label>
        <Input
          placeholder="Ex: N8N - Nova Conversa"
          value={form.nome}
          onChange={e => setForm({ ...form, nome: e.target.value })}
          required
        />
      </div>
      <div className="space-y-2">
        <Label>URL do Webhook</Label>
        <Input
          placeholder="https://seu-n8n.com/webhook/..."
          value={form.url}
          onChange={e => setForm({ ...form, url: e.target.value })}
          required
        />
      </div>
      <div className="space-y-2">
        <Label>Evento</Label>
        <Select value={form.evento} onValueChange={v => setForm({ ...form, evento: v })}>
          <SelectTrigger><SelectValue placeholder="Selecione o evento..." /></SelectTrigger>
          <SelectContent>
            {EVENTOS.map(e => (
              <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Segredo (opcional)</Label>
        <Input
          placeholder="Chave secreta para validação"
          value={form.segredo}
          onChange={e => setForm({ ...form, segredo: e.target.value })}
        />
      </div>
      <div className="flex items-center gap-3">
        <Switch
          checked={form.ativo}
          onCheckedChange={v => setForm({ ...form, ativo: v })}
        />
        <Label>Webhook ativo</Label>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={loading || !form.evento}>
          {loading ? 'Salvando...' : 'Salvar'}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function Webhooks() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState(null);
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const { data: webhooks = [], isLoading } = useQuery({
    queryKey: ['webhooks'],
    queryFn: () => base44.entities.WebhookConfig.list('-created_date', 100),
  });

  const handleSave = async (data) => {
    setLoading(true);
    if (editingWebhook) {
      await base44.entities.WebhookConfig.update(editingWebhook.id, data);
    } else {
      await base44.entities.WebhookConfig.create(data);
    }
    queryClient.invalidateQueries({ queryKey: ['webhooks'] });
    setLoading(false);
    setShowDialog(false);
    setEditingWebhook(null);
  };

  const handleDelete = async (id) => {
    if (!confirm('Excluir este webhook?')) return;
    await base44.entities.WebhookConfig.delete(id);
    queryClient.invalidateQueries({ queryKey: ['webhooks'] });
  };

  const toggleAtivo = async (webhook) => {
    await base44.entities.WebhookConfig.update(webhook.id, { ativo: !webhook.ativo });
    queryClient.invalidateQueries({ queryKey: ['webhooks'] });
  };

  const openEdit = (webhook) => {
    setEditingWebhook(webhook);
    setShowDialog(true);
  };

  const openNew = () => {
    setEditingWebhook(null);
    setShowDialog(true);
  };

  const gruposPorEvento = EVENTOS.map(evento => ({
    ...evento,
    webhooks: webhooks.filter(w => w.evento === evento.value),
  })).filter(g => g.webhooks.length > 0);

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Webhooks</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Configure endpoints para integrar com N8N e outros serviços
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Webhook
        </Button>
      </div>

      {/* Info Card */}
      <Card className="border-primary/20 bg-accent/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Zap className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">Como funciona</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Quando um evento ocorre no CRM (nova conversa, mensagem recebida, etc.), o sistema envia um <strong>POST</strong> automático para a URL configurada com os dados do evento em JSON. Use isso para integrar com N8N e criar fluxos automáticos no WhatsApp.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payload de Exemplo */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="w-4 h-4 text-muted-foreground" />
            Exemplo de Payload (JSON enviado)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative bg-muted rounded-lg p-4 font-mono text-xs overflow-auto">
            <pre className="text-foreground/80">{JSON.stringify({
              evento: "nova_conversa",
              timestamp: "2026-04-24T18:00:00Z",
              dados: {
                conversa_id: "abc123",
                contato_nome: "Maria Oliveira",
                contato_whatsapp: "(11) 98765-4321",
                status: "novo",
                prioridade: "media",
                canal: "whatsapp",
                ultima_mensagem: "Olá, preciso de ajuda!"
              }
            }, null, 2)}</pre>
            <CopyButton text={JSON.stringify({
              evento: "nova_conversa",
              timestamp: "2026-04-24T18:00:00Z",
              dados: {
                conversa_id: "abc123",
                contato_nome: "Maria Oliveira",
                contato_whatsapp: "(11) 98765-4321",
                status: "novo",
                prioridade: "media",
                canal: "whatsapp",
                ultima_mensagem: "Olá, preciso de ajuda!"
              }
            }, null, 2)} />
          </div>
        </CardContent>
      </Card>

      {/* Webhooks List */}
      {isLoading ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">Carregando...</CardContent></Card>
      ) : webhooks.length === 0 ? (
        <Card>
          <CardContent className="p-16 text-center">
            <Webhook className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="font-medium text-muted-foreground">Nenhum webhook configurado</p>
            <p className="text-sm text-muted-foreground mt-1">
              Adicione seu primeiro webhook para integrar com N8N
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {webhooks.map(webhook => (
            <Card key={webhook.id} className={!webhook.ativo ? 'opacity-60' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${webhook.ativo ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm">{webhook.nome}</p>
                      <EventoBadge evento={webhook.evento} />
                      {!webhook.ativo && (
                        <Badge variant="outline" className="text-xs text-muted-foreground">Inativo</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-1.5">
                      <code className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground truncate max-w-xs lg:max-w-lg">
                        {webhook.url}
                      </code>
                      <CopyButton text={webhook.url} />
                    </div>
                    {webhook.segredo && (
                      <p className="text-xs text-muted-foreground mt-1">
                        🔒 Segredo configurado
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Switch
                      checked={!!webhook.ativo}
                      onCheckedChange={() => toggleAtivo(webhook)}
                      className="scale-90"
                    />
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(webhook)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(webhook.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={v => { setShowDialog(v); if (!v) setEditingWebhook(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingWebhook ? 'Editar Webhook' : 'Novo Webhook'}</DialogTitle>
          </DialogHeader>
          <WebhookForm
            webhook={editingWebhook}
            onSave={handleSave}
            onCancel={() => { setShowDialog(false); setEditingWebhook(null); }}
            loading={loading}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}