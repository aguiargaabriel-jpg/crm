import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import ContatoAvatar from '@/components/shared/ContatoAvatar';
import StatusBadge from '@/components/shared/StatusBadge';
import PrioridadeBadge from '@/components/shared/PrioridadeBadge';
import { Phone, Mail, Building2, Briefcase, Save, X, Plus } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';

export default function ConversaSidebar({ conversa }) {
  const queryClient = useQueryClient();
  const [notas, setNotas] = useState(conversa?.contato_id ? '' : '');

  const { data: contato } = useQuery({
    queryKey: ['contato', conversa?.contato_id],
    queryFn: () => base44.entities.Contato.filter({ id: conversa.contato_id }),
    enabled: !!conversa?.contato_id,
    select: data => data[0],
  });

  const { data: tags = [] } = useQuery({
    queryKey: ['tags'],
    queryFn: () => base44.entities.TagPersonalizada.list(),
  });

  const updateConversa = async (data) => {
    await base44.entities.Conversa.update(conversa.id, data);
    queryClient.invalidateQueries({ queryKey: ['conversa', conversa.id] });
    queryClient.invalidateQueries({ queryKey: ['conversas'] });
  };

  const toggleTag = async (tagNome) => {
    const currentTags = conversa.tags || [];
    const newTags = currentTags.includes(tagNome)
      ? currentTags.filter(t => t !== tagNome)
      : [...currentTags, tagNome];
    await updateConversa({ tags: newTags });
  };

  if (!conversa) return null;

  const conversaTags = (conversa.tags || []).map(tagNome => 
    tags.find(t => t.nome === tagNome)
  ).filter(Boolean);

  return (
    <div className="h-full overflow-y-auto p-5 space-y-6">
      {/* Contact Info */}
      <div className="text-center">
        <ContatoAvatar nome={conversa.contato_nome} size="xl" className="mx-auto" />
        <h3 className="font-semibold text-lg mt-3">{conversa.contato_nome}</h3>
        <div className="flex items-center justify-center gap-1.5 mt-1 text-muted-foreground">
          <Phone className="w-3.5 h-3.5" />
          <span className="text-sm">{conversa.contato_whatsapp}</span>
        </div>
        {contato?.email && (
          <div className="flex items-center justify-center gap-1.5 mt-1 text-muted-foreground">
            <Mail className="w-3.5 h-3.5" />
            <span className="text-sm">{contato.email}</span>
          </div>
        )}
        {contato?.empresa && (
          <div className="flex items-center justify-center gap-1.5 mt-1 text-muted-foreground">
            <Building2 className="w-3.5 h-3.5" />
            <span className="text-sm">{contato.empresa}</span>
          </div>
        )}
      </div>

      <Separator />

      {/* Status */}
      <div className="space-y-3">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</Label>
        <Select value={conversa.status} onValueChange={v => updateConversa({ status: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="novo">Novo</SelectItem>
            <SelectItem value="em_atendimento">Em Atendimento</SelectItem>
            <SelectItem value="aguardando">Aguardando</SelectItem>
            <SelectItem value="resolvido">Resolvido</SelectItem>
            <SelectItem value="arquivado">Arquivado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Priority */}
      <div className="space-y-3">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Prioridade</Label>
        <Select value={conversa.prioridade || 'media'} onValueChange={v => updateConversa({ prioridade: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="baixa">Baixa</SelectItem>
            <SelectItem value="media">Média</SelectItem>
            <SelectItem value="alta">Alta</SelectItem>
            <SelectItem value="urgente">Urgente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Tags */}
      <div className="space-y-3">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tags</Label>
        <div className="flex flex-wrap gap-1.5">
          {conversaTags.map(tag => (
            <Badge 
              key={tag.id}
              variant="outline"
              className="text-xs cursor-pointer hover:opacity-70"
              style={{ 
                backgroundColor: tag.cor + '20', 
                color: tag.cor, 
                borderColor: tag.cor + '40' 
              }}
              onClick={() => toggleTag(tag.nome)}
            >
              {tag.nome} <X className="w-3 h-3 ml-1" />
            </Badge>
          ))}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-6 text-xs">
                <Plus className="w-3 h-3 mr-1" /> Tag
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2">
              <div className="space-y-1">
                {tags.map(tag => (
                  <label key={tag.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer">
                    <Checkbox 
                      checked={(conversa.tags || []).includes(tag.nome)}
                      onCheckedChange={() => toggleTag(tag.nome)}
                    />
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.cor }} />
                    <span className="text-sm">{tag.nome}</span>
                  </label>
                ))}
                {tags.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">Nenhuma tag criada</p>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}