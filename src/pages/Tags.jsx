import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Tags as TagsIcon } from 'lucide-react';

const PRESET_COLORS = [
  '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', 
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
];

export default function Tags() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [form, setForm] = useState({ nome: '', cor: '#10B981' });
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const { data: tags = [], isLoading } = useQuery({
    queryKey: ['tags'],
    queryFn: () => base44.entities.TagPersonalizada.list(),
  });

  const openNew = () => {
    setEditingTag(null);
    setForm({ nome: '', cor: '#10B981' });
    setShowDialog(true);
  };

  const openEdit = (tag) => {
    setEditingTag(tag);
    setForm({ nome: tag.nome, cor: tag.cor });
    setShowDialog(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (editingTag) {
      await base44.entities.TagPersonalizada.update(editingTag.id, form);
    } else {
      await base44.entities.TagPersonalizada.create(form);
    }
    queryClient.invalidateQueries({ queryKey: ['tags'] });
    setLoading(false);
    setShowDialog(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Excluir esta tag?')) return;
    await base44.entities.TagPersonalizada.delete(id);
    queryClient.invalidateQueries({ queryKey: ['tags'] });
  };

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tags Personalizadas</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Organize suas conversas com tags</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Tag
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {tags.length === 0 ? (
            <div className="p-16 text-center">
              <TagsIcon className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground font-medium">Nenhuma tag criada</p>
              <p className="text-sm text-muted-foreground mt-1">
                Crie tags para categorizar suas conversas
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {tags.map(tag => (
                <div key={tag.id} className="flex items-center justify-between px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: tag.cor }} />
                    <Badge 
                      variant="outline" 
                      className="text-sm font-medium"
                      style={{ 
                        backgroundColor: tag.cor + '15', 
                        color: tag.cor, 
                        borderColor: tag.cor + '40' 
                      }}
                    >
                      {tag.nome}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(tag)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(tag.id)} className="text-destructive hover:text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingTag ? 'Editar Tag' : 'Nova Tag'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome da Tag</Label>
              <Input 
                value={form.nome} 
                onChange={e => setForm({...form, nome: e.target.value})}
                placeholder="Ex: Lead Quente"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map(cor => (
                  <button
                    key={cor}
                    type="button"
                    className="w-8 h-8 rounded-full border-2 transition-all"
                    style={{ 
                      backgroundColor: cor,
                      borderColor: form.cor === cor ? '#000' : 'transparent',
                      transform: form.cor === cor ? 'scale(1.15)' : 'scale(1)'
                    }}
                    onClick={() => setForm({...form, cor})}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">Preview:</Label>
              <Badge 
                variant="outline"
                style={{ 
                  backgroundColor: form.cor + '15', 
                  color: form.cor, 
                  borderColor: form.cor + '40' 
                }}
              >
                {form.nome || 'Nome da Tag'}
              </Badge>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}