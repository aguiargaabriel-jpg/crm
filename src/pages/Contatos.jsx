import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Plus, Users, Phone, Mail, Building2, Pencil, Trash2 } from 'lucide-react';
import ContatoAvatar from '@/components/shared/ContatoAvatar';

function ContatoForm({ contato, onSave, onCancel, loading }) {
  const [form, setForm] = useState(contato || {
    nome: '', whatsapp: '', email: '', empresa: '', cargo: '', notas: ''
  });

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Nome *</Label>
          <Input value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} required />
        </div>
        <div className="space-y-2">
          <Label>WhatsApp *</Label>
          <Input value={form.whatsapp} onChange={e => setForm({...form, whatsapp: e.target.value})} required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Email</Label>
          <Input value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
        </div>
        <div className="space-y-2">
          <Label>Empresa</Label>
          <Input value={form.empresa} onChange={e => setForm({...form, empresa: e.target.value})} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Cargo</Label>
        <Input value={form.cargo} onChange={e => setForm({...form, cargo: e.target.value})} />
      </div>
      <div className="space-y-2">
        <Label>Observações</Label>
        <Input value={form.notas} onChange={e => setForm({...form, notas: e.target.value})} />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</Button>
      </DialogFooter>
    </form>
  );
}

export default function Contatos() {
  const [search, setSearch] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingContato, setEditingContato] = useState(null);
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const { data: contatos = [], isLoading } = useQuery({
    queryKey: ['contatos'],
    queryFn: () => base44.entities.Contato.list('-created_date', 200),
  });

  const filtered = contatos.filter(c => 
    !search || 
    c.nome?.toLowerCase().includes(search.toLowerCase()) ||
    c.whatsapp?.includes(search) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async (data) => {
    setLoading(true);
    if (editingContato) {
      await base44.entities.Contato.update(editingContato.id, data);
    } else {
      await base44.entities.Contato.create(data);
    }
    queryClient.invalidateQueries({ queryKey: ['contatos'] });
    setLoading(false);
    setShowDialog(false);
    setEditingContato(null);
  };

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este contato?')) return;
    await base44.entities.Contato.delete(id);
    queryClient.invalidateQueries({ queryKey: ['contatos'] });
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contatos</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{contatos.length} contato(s)</p>
        </div>
        <Button onClick={() => { setEditingContato(null); setShowDialog(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Contato
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Buscar contatos..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <Card key={i}><CardContent className="p-6"><Skeleton className="h-20" /></CardContent></Card>)}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-16 text-center">
            <Users className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground font-medium">Nenhum contato encontrado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(contato => (
            <Card key={contato.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <ContatoAvatar nome={contato.nome} size="md" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate">{contato.nome}</h3>
                    <div className="flex items-center gap-1.5 mt-1 text-muted-foreground">
                      <Phone className="w-3 h-3" />
                      <span className="text-xs">{contato.whatsapp}</span>
                    </div>
                    {contato.email && (
                      <div className="flex items-center gap-1.5 mt-0.5 text-muted-foreground">
                        <Mail className="w-3 h-3" />
                        <span className="text-xs truncate">{contato.email}</span>
                      </div>
                    )}
                    {contato.empresa && (
                      <div className="flex items-center gap-1.5 mt-0.5 text-muted-foreground">
                        <Building2 className="w-3 h-3" />
                        <span className="text-xs">{contato.empresa}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 mt-3 justify-end">
                  <Button variant="ghost" size="sm" onClick={() => { setEditingContato(contato); setShowDialog(true); }}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(contato.id)} className="text-destructive hover:text-destructive">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={v => { setShowDialog(v); if (!v) setEditingContato(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingContato ? 'Editar Contato' : 'Novo Contato'}</DialogTitle>
          </DialogHeader>
          <ContatoForm 
            contato={editingContato} 
            onSave={handleSave} 
            onCancel={() => { setShowDialog(false); setEditingContato(null); }}
            loading={loading}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}