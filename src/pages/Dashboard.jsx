import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Users, Clock, CheckCircle2, AlertTriangle, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import StatusBadge from '@/components/shared/StatusBadge';
import ContatoAvatar from '@/components/shared/ContatoAvatar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function StatCard({ title, value, icon: Icon, description, color }) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <p className="text-3xl font-bold mt-1 tracking-tight">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          <div className={`p-3 rounded-xl ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { data: conversas = [], isLoading: loadingConversas } = useQuery({
    queryKey: ['conversas'],
    queryFn: () => base44.entities.Conversa.list('-updated_date', 100),
  });

  const { data: contatos = [], isLoading: loadingContatos } = useQuery({
    queryKey: ['contatos'],
    queryFn: () => base44.entities.Contato.list('-created_date', 100),
  });

  const isLoading = loadingConversas || loadingContatos;

  const stats = {
    total: conversas.length,
    novos: conversas.filter(c => c.status === 'novo').length,
    emAtendimento: conversas.filter(c => c.status === 'em_atendimento').length,
    aguardando: conversas.filter(c => c.status === 'aguardando').length,
    resolvidos: conversas.filter(c => c.status === 'resolvido').length,
    urgentes: conversas.filter(c => c.prioridade === 'urgente' || c.prioridade === 'alta').length,
  };

  const recentConversas = conversas.slice(0, 5);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Visão geral do seu CRM de atendimento</p>
      </div>

      {/* Stats */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Total de Conversas" 
            value={stats.total} 
            icon={MessageSquare} 
            color="bg-primary/10 text-primary"
            description={`${stats.novos} nova(s)`}
          />
          <StatCard 
            title="Em Atendimento" 
            value={stats.emAtendimento} 
            icon={Clock} 
            color="bg-amber-100 text-amber-600"
            description={`${stats.aguardando} aguardando`}
          />
          <StatCard 
            title="Resolvidas" 
            value={stats.resolvidos} 
            icon={CheckCircle2} 
            color="bg-emerald-100 text-emerald-600"
          />
          <StatCard 
            title="Contatos" 
            value={contatos.length} 
            icon={Users} 
            color="bg-blue-100 text-blue-600"
          />
        </div>
      )}

      {/* Recent Conversations */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Conversas Recentes</CardTitle>
              <Link to="/conversas" className="text-sm text-primary font-medium hover:underline">
                Ver todas
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full" />)}
              </div>
            ) : recentConversas.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p>Nenhuma conversa ainda</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentConversas.map(conversa => (
                  <Link 
                    key={conversa.id} 
                    to={`/conversas/${conversa.id}`}
                    className="flex items-center gap-3 px-6 py-3.5 hover:bg-muted/50 transition-colors"
                  >
                    <ContatoAvatar nome={conversa.contato_nome} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">{conversa.contato_nome}</p>
                        <StatusBadge status={conversa.status} />
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {conversa.ultima_mensagem || 'Sem mensagens'}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {conversa.updated_date 
                        ? format(new Date(conversa.updated_date), "dd MMM HH:mm", { locale: ptBR })
                        : ''}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Urgentes */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              Prioridade Alta/Urgente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1,2].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : stats.urgentes === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhuma conversa urgente</p>
            ) : (
              <div className="space-y-3">
                {conversas
                  .filter(c => c.prioridade === 'urgente' || c.prioridade === 'alta')
                  .slice(0, 5)
                  .map(conversa => (
                    <Link 
                      key={conversa.id}
                      to={`/conversas/${conversa.id}`}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <ContatoAvatar nome={conversa.contato_nome} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{conversa.contato_nome}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {conversa.ultima_mensagem || conversa.contato_whatsapp}
                        </p>
                      </div>
                    </Link>
                  ))
                }
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}