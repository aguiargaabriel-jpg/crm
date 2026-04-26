import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';

export default function NovaConversaDialog({ open, onOpenChange }) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    contato_nome: '',
    contato_whatsapp: '',
    status: 'novo',
    prioridade: 'media',
    canal: 'whatsapp',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Create contact first
    const contato = await base44.entities.Contato.create({
      nome: form.contato_nome,
      whatsapp: form.contato_whatsapp,
    });

    // Create conversation
    await base44.entities.Conversa.create({
      ...form,
      contato_id: contato.id,
    });

    queryClient.invalidateQueries({ queryKey: ['conversas'] });
    queryClient.invalidateQueries({ queryKey: ['contatos'] });
    setLoading(false);
    onOpenChange(false);
    setForm({ contato_nome: '', contato_whatsapp: '', status: 'novo', prioridade: 'media', canal: 'whatsapp' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Conversa</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nome do Contato</Label>
            <Input 
              placeholder="Ex: João Silva"
              value={form.contato_nome}
              onChange={e => setForm({ ...form, contato_nome: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>WhatsApp</Label>
            <Input 
              placeholder="Ex: (11) 99999-9999"
              value={form.contato_whatsapp}
              onChange={e => setForm({ ...form, contato_whatsapp: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select value={form.prioridade} onValueChange={v => setForm({ ...form, prioridade: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Canal</Label>
              <Select value={form.canal} onValueChange={v => setForm({ ...form, canal: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="chatbot">Chatbot</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Criando...' : 'Criar Conversa'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}