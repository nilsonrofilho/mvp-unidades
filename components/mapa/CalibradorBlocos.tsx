"use client";
import { useMemo, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Check, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { salvarCoordenadasEmLoteAction } from "@/lib/actions/unidades";
import type { Coordenadas, Unidade } from "@/types/database";

type BlocoUnidades = {
  nome: string;
  unidades: Unidade[];
};

function nomeDoBloco(u: Unidade): string {
  if (u.posicao_no_andar && u.posicao_no_andar.trim()) {
    return u.posicao_no_andar.trim();
  }
  const idx = u.identificador.indexOf("-");
  return idx > 0 ? u.identificador.slice(0, idx) : "Sem bloco";
}

function numeroDaUnidade(u: Unidade): number {
  const m = u.identificador.match(/(\d+)\s*$/);
  return m ? Number(m[1]) : 0;
}

// Mapeia um número de unidade (ex 101, 203) para (col, row) num grid 4×2.
// Convenção do projeto: 1XX = térrea (row 0), 2XX = duplex (row 1).
// Col = (último dígito) - 1, ou 0 se não couber.
function posicaoNoGrid(numero: number): { col: number; row: number } {
  const row = Math.max(0, Math.floor(numero / 100) - 1);
  const col = Math.max(0, (numero % 100) - 1);
  return { col: Math.min(col, 3), row: Math.min(row, 1) };
}

export function CalibradorBlocos({
  plantaUrl,
  unidades,
  empreendimentoId,
}: {
  plantaUrl: string;
  unidades: Unidade[];
  empreendimentoId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);

  // Agrupa unidades por bloco
  const blocos: BlocoUnidades[] = useMemo(() => {
    const map = new Map<string, Unidade[]>();
    for (const u of unidades) {
      const nome = nomeDoBloco(u);
      const arr = map.get(nome) ?? [];
      arr.push(u);
      map.set(nome, arr);
    }
    return Array.from(map.entries())
      .map(([nome, lista]) => ({
        nome,
        unidades: lista.sort((a, b) => numeroDaUnidade(a) - numeroDaUnidade(b)),
      }))
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [unidades]);

  const [blocoAtivo, setBlocoAtivo] = useState<string | null>(
    blocos[0]?.nome ?? null,
  );
  // Cada bloco mapeia para o retângulo desenhado (em coords normalizadas 0-1)
  const [retangulosPorBloco, setRetangulosPorBloco] = useState<
    Map<string, Coordenadas>
  >(new Map());
  const [desenhando, setDesenhando] = useState<{
    startX: number;
    startY: number;
  } | null>(null);

  function coordRelativa(e: React.MouseEvent) {
    const rect = containerRef.current!.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height)),
    };
  }

  function onDown(e: React.MouseEvent) {
    if (!blocoAtivo) return;
    const p = coordRelativa(e);
    setDesenhando({ startX: p.x, startY: p.y });
    setRetangulosPorBloco((prev) => {
      const next = new Map(prev);
      next.set(blocoAtivo, { x: p.x, y: p.y, width: 0, height: 0 });
      return next;
    });
  }

  function onMove(e: React.MouseEvent) {
    if (!desenhando || !blocoAtivo) return;
    const p = coordRelativa(e);
    setRetangulosPorBloco((prev) => {
      const next = new Map(prev);
      next.set(blocoAtivo, {
        x: Math.min(desenhando.startX, p.x),
        y: Math.min(desenhando.startY, p.y),
        width: Math.abs(p.x - desenhando.startX),
        height: Math.abs(p.y - desenhando.startY),
      });
      return next;
    });
  }

  function onUp() {
    setDesenhando(null);
  }

  function limparBlocoAtivo() {
    if (!blocoAtivo) return;
    setRetangulosPorBloco((prev) => {
      const next = new Map(prev);
      next.delete(blocoAtivo);
      return next;
    });
  }

  // Para um retângulo de bloco, gera as 8 (ou N) coordenadas das casas
  // distribuídas em grid 4×2.
  function gerarCoordenadasDoBloco(
    rect: Coordenadas,
    unidadesDoBloco: Unidade[],
  ): Array<{ unidade_id: string; coords: Coordenadas }> {
    const cellW = rect.width / 4;
    const cellH = rect.height / 2;
    return unidadesDoBloco.map((u) => {
      const { col, row } = posicaoNoGrid(numeroDaUnidade(u));
      return {
        unidade_id: u.id,
        coords: {
          x: rect.x + col * cellW,
          y: rect.y + row * cellH,
          width: cellW,
          height: cellH,
        },
      };
    });
  }

  function salvarTudo() {
    const itens: Array<{ unidade_id: string; coords: Coordenadas }> = [];
    for (const bloco of blocos) {
      const rect = retangulosPorBloco.get(bloco.nome);
      if (!rect || rect.width < 0.005 || rect.height < 0.005) continue;
      itens.push(...gerarCoordenadasDoBloco(rect, bloco.unidades));
    }
    if (itens.length === 0) {
      toast.error("Desenhe pelo menos um bloco antes de salvar");
      return;
    }
    startTransition(async () => {
      const res = await salvarCoordenadasEmLoteAction(empreendimentoId, itens);
      if ("error" in res && res.error) {
        toast.error(res.error);
      } else {
        toast.success(`${itens.length} unidades posicionadas`);
        router.push(`/empreendimentos/${empreendimentoId}`);
      }
    });
  }

  // Pré-cálculo das células geradas para o bloco ativo (preview)
  const blocoAtivoData = blocos.find((b) => b.nome === blocoAtivo);
  const rectAtivo = blocoAtivo ? retangulosPorBloco.get(blocoAtivo) : null;
  const previewCelulas =
    blocoAtivoData && rectAtivo
      ? gerarCoordenadasDoBloco(rectAtivo, blocoAtivoData.unidades)
      : [];

  const totalCalibrados = retangulosPorBloco.size;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
      {/* Planta + área de desenho */}
      <div className="space-y-3">
        <div
          ref={containerRef}
          onMouseDown={onDown}
          onMouseMove={onMove}
          onMouseUp={onUp}
          onMouseLeave={onUp}
          className="relative w-full rounded-lg border bg-muted overflow-hidden select-none cursor-crosshair"
        >
          <Image
            src={plantaUrl}
            alt="Planta para calibração"
            width={1600}
            height={1000}
            className="w-full h-auto pointer-events-none"
            draggable={false}
            priority
          />

          {/* Retângulos já desenhados (outros blocos, esmaecidos) */}
          {Array.from(retangulosPorBloco.entries()).map(([nome, rect]) => {
            if (nome === blocoAtivo) return null;
            return (
              <div
                key={nome}
                className="absolute border-2 border-slate-400/70 bg-slate-300/20 pointer-events-none flex items-start justify-start"
                style={{
                  left: `${rect.x * 100}%`,
                  top: `${rect.y * 100}%`,
                  width: `${rect.width * 100}%`,
                  height: `${rect.height * 100}%`,
                }}
              >
                <span className="text-[10px] font-medium bg-slate-700 text-white px-1 rounded-br">
                  {nome}
                </span>
              </div>
            );
          })}

          {/* Retângulo do bloco ativo + preview das células */}
          {rectAtivo && (
            <>
              <div
                className="absolute border-2 border-brand bg-brand/10 pointer-events-none"
                style={{
                  left: `${rectAtivo.x * 100}%`,
                  top: `${rectAtivo.y * 100}%`,
                  width: `${rectAtivo.width * 100}%`,
                  height: `${rectAtivo.height * 100}%`,
                }}
              />
              {previewCelulas.map(({ unidade_id, coords }, idx) => (
                <div
                  key={unidade_id}
                  className="absolute border border-brand/80 bg-brand/30 pointer-events-none flex items-center justify-center"
                  style={{
                    left: `${coords.x * 100}%`,
                    top: `${coords.y * 100}%`,
                    width: `${coords.width * 100}%`,
                    height: `${coords.height * 100}%`,
                  }}
                >
                  <span className="text-[9px] font-semibold text-white drop-shadow">
                    {blocoAtivoData?.unidades[idx]?.identificador
                      .split("-")
                      .slice(1)
                      .join("-") ?? ""}
                  </span>
                </div>
              ))}
            </>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={salvarTudo} disabled={pending || totalCalibrados === 0}>
            <Check className="mr-1 size-4" />
            {pending
              ? "Salvando..."
              : `Salvar todos (${totalCalibrados} bloco${totalCalibrados === 1 ? "" : "s"})`}
          </Button>
          <Button
            variant="ghost"
            onClick={limparBlocoAtivo}
            disabled={!rectAtivo}
          >
            <RotateCcw className="mr-1 size-4" />
            Limpar bloco ativo
          </Button>
          <Button variant="ghost" onClick={() => router.back()}>
            Voltar
          </Button>
        </div>
      </div>

      {/* Lista lateral de blocos */}
      <aside className="space-y-2">
        <div className="rounded-lg border bg-card p-3 space-y-1">
          <p className="text-sm font-medium">Blocos</p>
          <p className="text-xs text-muted-foreground">
            Selecione um bloco e arraste sobre a planta para marcar onde ele
            está. As {blocos[0]?.unidades.length ?? 8} casas dele são posicionadas automaticamente em
            grid 4×2.
          </p>
        </div>
        <ul className="space-y-1 max-h-[60vh] overflow-y-auto pr-1">
          {blocos.map((b) => {
            const calibrado = retangulosPorBloco.has(b.nome);
            const ativo = b.nome === blocoAtivo;
            return (
              <li key={b.nome}>
                <button
                  type="button"
                  onClick={() => setBlocoAtivo(b.nome)}
                  className={
                    "w-full text-left rounded-md border px-3 py-2 text-sm transition-colors flex items-center justify-between " +
                    (ativo
                      ? "border-brand bg-brand/10 font-medium"
                      : "border-border hover:bg-accent")
                  }
                >
                  <span>{b.nome}</span>
                  <span className="text-xs">
                    {calibrado ? (
                      <Check className="size-4 text-emerald-600" />
                    ) : (
                      <span className="text-muted-foreground">
                        {b.unidades.length} und
                      </span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>
    </div>
  );
}
