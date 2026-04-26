import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const prioridadeConfig = {
  baixa: { label: 'Baixa', className: 'bg-slate-100 text-slate-600 border-slate-200' },
  media: { label: 'Média', className: 'bg-sky-100 text-sky-700 border-sky-200' },
  alta: { label: 'Alta', className: 'bg-orange-100 text-orange-700 border-orange-200' },
  urgente: { label: 'Urgente', className: 'bg-red-100 text-red-700 border-red-200' },
};

export default function PrioridadeBadge({ prioridade, className }) {
  const config = prioridadeConfig[prioridade] || prioridadeConfig.media;
  return (
    <Badge variant="outline" className={cn("text-xs font-medium border", config.className, className)}>
      {config.label}
    </Badge>
  );
}