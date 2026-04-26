import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const statusConfig = {
  novo: { label: 'Novo', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  em_atendimento: { label: 'Em Atendimento', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  aguardando: { label: 'Aguardando', className: 'bg-purple-100 text-purple-700 border-purple-200' },
  resolvido: { label: 'Resolvido', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  arquivado: { label: 'Arquivado', className: 'bg-gray-100 text-gray-500 border-gray-200' },
};

export default function StatusBadge({ status, className }) {
  const config = statusConfig[status] || statusConfig.novo;
  return (
    <Badge variant="outline" className={cn("text-xs font-medium border", config.className, className)}>
      {config.label}
    </Badge>
  );
}