import React from 'react';
import { Link } from 'react-router-dom';
import ContatoAvatar from '@/components/shared/ContatoAvatar';
import StatusBadge from '@/components/shared/StatusBadge';
import PrioridadeBadge from '@/components/shared/PrioridadeBadge';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Phone } from 'lucide-react';

export default function ConversaListItem({ conversa, tags = [] }) {
  const conversaTags = (conversa.tags || []).map(tagNome => 
    tags.find(t => t.nome === tagNome)
  ).filter(Boolean);

  return (
    <Link 
      to={`/conversas/${conversa.id}`}
      className="flex items-center gap-4 px-5 py-4 hover:bg-muted/50 transition-colors border-b border-border last:border-0"
    >
      <ContatoAvatar nome={conversa.contato_nome} size="md" />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-sm">{conversa.contato_nome}</p>
          <StatusBadge status={conversa.status} />
          {conversa.prioridade && conversa.prioridade !== 'media' && (
            <PrioridadeBadge prioridade={conversa.prioridade} />
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <Phone className="w-3 h-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{conversa.contato_whatsapp}</span>
        </div>
        <p className="text-xs text-muted-foreground truncate mt-1">
          {conversa.ultima_mensagem || 'Sem mensagens'}
        </p>
        {conversaTags.length > 0 && (
          <div className="flex gap-1 mt-1.5 flex-wrap">
            {conversaTags.map(tag => (
              <Badge 
                key={tag.id} 
                variant="outline" 
                className="text-[10px] px-1.5 py-0 border"
                style={{ 
                  backgroundColor: tag.cor + '20', 
                  color: tag.cor, 
                  borderColor: tag.cor + '40' 
                }}
              >
                {tag.nome}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="text-right flex-shrink-0">
        <span className="text-xs text-muted-foreground">
          {conversa.updated_date 
            ? format(new Date(conversa.updated_date), "dd/MM HH:mm", { locale: ptBR })
            : ''}
        </span>
      </div>
    </Link>
  );
}