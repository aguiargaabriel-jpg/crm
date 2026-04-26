import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Play, Pause, CheckCircle2, Clock, AlertCircle, Loader2, Radio } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

function ContatoStatusIcon({ status }) {
  if (status === 'enviado') return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
  if (status === 'erro') return <AlertCircle className="w-4 h-4 text-red-500" />;
  return <Clock className="w-4 h-4 text-muted-foreground" />;
}

export default function TransmissaoDetalheDialog({ lista, open, onOpenChange, onUpdate }) {
  const [rodando, setRodando] = useState(false);
  const [pausado, setPausado] = useState(false);
  const [contatosLocal, setContatosLocal] = useState(lista.contatos || []);
  const [timerLabel, setTimerLabel] = useState('');
  const [indiceAtual, setIndiceAtual] = useState(null);
  const pausaRef = useRef(false);
  const queryClient = useQueryClient();

  const sleep = (ms) => new Promise(resolve => {
    let elapsed = 0;
    const interval = setInterval(() => {
      if (pausaRef.current) return;
      elapsed += 100;
      const restante = Math.ceil((ms - elapsed) / 1000);
      setTimerLabel(restante > 0 ? `Próximo em ${restante}s...` : '');
      if (elapsed >= ms) {
        clearInterval(interval);
        resolve();
      }
    }, 100);
  });

  const disparar = async () => {
    if (rodando) {
      pausaRef.current = !pausaRef.current;
      setPausado(pausaRef.current);
      return;
    }

    setRodando(true);
    pausaRef.current = false;
    setPausado(false);

    const contatos = [...contatosLocal];
    const pendentes = contatos.map((c, i) => ({ ...c, _idx: i })).filter(c => c.status === 'pendente');

    await base44.entities.ListaTransmissao.update(lista.id, { status: 'em_andamento' });
    onUpdate();

    for (let i = 0; i < pendentes.length; i++) {
      // Aguarda se pausado
      while (pausaRef.current) {
        await sleep(200);
      }

      const item = pendentes[i];
      setIndiceAtual(item._idx);
      setTimerLabel('Enviando...');

      // Dispara webhook
      let novoStatus = 'enviado';
      if (lista.webhook_url) {
        const res = await fetch(lista.webhook_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            evento: 'transmissao',
            lista_nome: lista.nome,
            mensagem: lista.mensagem,
            contato_nome: item.contato_nome,
            contato_whatsapp: item.contato_whatsapp,
            contato_id: item.contato_id,
            indice: i + 1,
            total: pendentes.length,
          }),
        }).catch(() => null);
        if (!res || !res.ok) novoStatus = 'erro';
      }

      // Atualiza status localmente
      contatos[item._idx] = { ...contatos[item._idx], status: novoStatus, enviado_em: new Date().toISOString() };
      setContatosLocal([...contatos]);

      // Salva no banco
      const enviados = contatos.filter(c => c.status === 'enviado').length;
      await base44.entities.ListaTransmissao.update(lista.id, {
        contatos: contatos,
        total_enviados: enviados,
      });

      // Timer antes do próximo
      if (i < pendentes.length - 1) {
        await sleep((lista.intervalo_segundos || 30) * 1000);
      }
    }

    setTimerLabel('');
    setIndiceAtual(null);
    setRodando(false);
    setPausado(false);

    const todosConcluidos = contatos.every(c => c.status !== 'pendente');
    if (todosConcluidos) {
      await base44.entities.ListaTransmissao.update(lista.id, { status: 'concluido' });
    }
    onUpdate();
    queryClient.invalidateQueries({ queryKey: ['transmissoes'] });
  };

  const enviados = contatosLocal.filter(c => c.status === 'enviado').length;
  const erros = contatosLocal.filter(c => c.status === 'erro').length;
  const pendentes = contatosLocal.filter(c => c.status === 'pendente').length;
  const total = contatosLocal.length;

  return (
    <Dialog open={open} onOpenChange={v => { if (!rodando) onOpenChange(v); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-primary" />
            {lista.nome}
          </DialogTitle>
        </DialogHeader>

        {/* Mensagem */}
        <div className="bg-muted rounded-lg p-3 text-sm">
          <p className="text-xs text-muted-foreground mb-1 font-medium">MENSAGEM</p>
          <p>{lista.mensagem}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-muted/50 rounded-lg p-2">
            <p className="text-lg font-bold text-emerald-600">{enviados}</p>
            <p className="text-xs text-muted-foreground">Enviados</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-2">
            <p className="text-lg font-bold text-muted-foreground">{pendentes}</p>
            <p className="text-xs text-muted-foreground">Pendentes</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-2">
            <p className="text-lg font-bold text-red-500">{erros}</p>
            <p className="text-xs text-muted-foreground">Erros</p>
          </div>
        </div>

        {/* Barra de progresso */}
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all"
            style={{ width: total > 0 ? `${(enviados / total) * 100}%` : '0%' }}
          />
        </div>

        {/* Timer */}
        {timerLabel && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            {timerLabel}
          </div>
        )}

        {/* Lista de contatos */}
        <ScrollArea className="border rounded-lg max-h-56">
          <div className="p-2 space-y-0.5">
            {contatosLocal.map((c, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 px-2 py-1.5 rounded-md text-sm ${indiceAtual === i ? 'bg-primary/10' : ''}`}
              >
                <ContatoStatusIcon status={c.status} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{c.contato_nome}</p>
                  <p className="text-xs text-muted-foreground">{c.contato_whatsapp}</p>
                </div>
                {indiceAtual === i && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                )}
                {c.status === 'enviado' && (
                  <span className="text-xs text-muted-foreground">✓</span>
                )}
                {c.status === 'erro' && (
                  <span className="text-xs text-red-500">Erro</span>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex gap-2 justify-end">
          {!rodando && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          )}
          <Button
            onClick={disparar}
            disabled={pendentes === 0 && !rodando}
            className={pausado ? 'bg-amber-500 hover:bg-amber-600' : ''}
          >
            {rodando ? (
              pausado ? (
                <><Play className="w-4 h-4 mr-2" />Retomar</>
              ) : (
                <><Pause className="w-4 h-4 mr-2" />Pausar</>
              )
            ) : (
              <><Play className="w-4 h-4 mr-2" />Iniciar Disparo</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}