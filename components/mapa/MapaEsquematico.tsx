"use client";
import { useMemo, useState } from "react";
import type { Unidade } from "@/types/database";

type Filtro = {
  status?: string[];
  precoMin?: number;
  precoMax?: number;
  quartos?: number;
};

function matches(u: Unidade, f: Filtro): boolean {
  if (f.status && f.status.length > 0 && !f.status.includes(u.status))
    return false;
  if (f.precoMin != null && (u.preco_total ?? 0) < f.precoMin) return false;
  if (f.precoMax != null && (u.preco_total ?? 0) > f.precoMax) return false;
  if (f.quartos != null && u.qtd_quartos !== f.quartos) return false;
  return true;
}

function nomeDoBloco(u: Unidade): string {
  if (u.posicao_no_andar && u.posicao_no_andar.trim()) {
    return u.posicao_no_andar.trim();
  }
  const id = u.identificador;
  const idx = id.indexOf("-");
  return idx > 0 ? id.slice(0, idx) : "Sem bloco";
}

type BlocoData = {
  nome: string;
  unidades: Unidade[];
  disponiveis: number;
  total: number;
};

// Layout do Pipa Aruã
const LAYOUTS_CONHECIDOS: Record<
  string,
  { eixo: 1 | 2 | 3 | "duna"; ordem: number }
> = {
  Náutico: { eixo: 3, ordem: 0 },
  Veleiro: { eixo: 3, ordem: 1 },
  Falésias: { eixo: 3, ordem: 2 },
  Areia: { eixo: 3, ordem: 3 },
  Atlântico: { eixo: 3, ordem: 4 },
  Oceano: { eixo: 3, ordem: 5 },
  Enseada: { eixo: 2, ordem: 0 },
  Concha: { eixo: 2, ordem: 1 },
  Coral: { eixo: 2, ordem: 2 },
  Farol: { eixo: 1, ordem: 0 },
  Maré: { eixo: 1, ordem: 1 },
  Brisa: { eixo: 1, ordem: 2 },
  Duna: { eixo: "duna", ordem: 0 },
};

// Cores das casas individuais por status
const CASA_COR: Record<string, { fill: string; stroke: string }> = {
  disponivel: { fill: "#22c55e", stroke: "#15803d" }, // verde
  reservada: { fill: "#eab308", stroke: "#a16207" }, // amarelo
  vendida: { fill: "#ef4444", stroke: "#b91c1c" }, // vermelho
};

export function MapaEsquematico({
  unidades,
  filtro,
  onSelect,
}: {
  unidades: Unidade[];
  filtro: Filtro;
  onSelect: (u: Unidade) => void;
}) {
  const [blocoAberto, setBlocoAberto] = useState<string | null>(null);

  const blocos: BlocoData[] = useMemo(() => {
    const map = new Map<string, Unidade[]>();
    for (const u of unidades) {
      const b = nomeDoBloco(u);
      const arr = map.get(b) ?? [];
      arr.push(u);
      map.set(b, arr);
    }
    return Array.from(map.entries())
      .map(([nome, lista]) => ({
        nome,
        unidades: lista.sort((a, b) =>
          a.identificador.localeCompare(b.identificador, undefined, {
            numeric: true,
          }),
        ),
        disponiveis: lista.filter(
          (u) => matches(u, filtro) && u.status === "disponivel",
        ).length,
        total: lista.length,
      }))
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [unidades, filtro]);

  const usaLayoutPipa = blocos.every((b) => LAYOUTS_CONHECIDOS[b.nome]);
  const blocoAbertoData = blocos.find((b) => b.nome === blocoAberto) ?? null;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-emerald-50/40 p-3 sm:p-5">
        {usaLayoutPipa ? (
          <LayoutPipa
            blocos={blocos}
            selecionado={blocoAberto}
            filtro={filtro}
            onClickBloco={(nome) =>
              setBlocoAberto((cur) => (cur === nome ? null : nome))
            }
            onClickCasa={onSelect}
          />
        ) : (
          <LayoutGenerico
            blocos={blocos}
            selecionado={blocoAberto}
            filtro={filtro}
            onClickBloco={(nome) =>
              setBlocoAberto((cur) => (cur === nome ? null : nome))
            }
            onClickCasa={onSelect}
          />
        )}
        <Legenda />
      </div>

      {blocoAbertoData && (
        <PainelBlocoExpandido
          bloco={blocoAbertoData}
          filtro={filtro}
          onSelect={onSelect}
          onClose={() => setBlocoAberto(null)}
        />
      )}
    </div>
  );
}

// ============== Layouts ==============
const VIEWBOX_W = 900;
const VIEWBOX_H = 640;

function CardBlocoComCasas({
  bloco,
  x,
  y,
  w,
  h,
  selecionado,
  filtro,
  onClickBloco,
  onClickCasa,
}: {
  bloco: BlocoData;
  x: number;
  y: number;
  w: number;
  h: number;
  selecionado: boolean;
  filtro: Filtro;
  onClickBloco: () => void;
  onClickCasa: (u: Unidade) => void;
}) {
  // Layout interno: nome no topo, grid 4x2 das casas, contagem embaixo
  const padding = 6;
  const headerH = 16;
  const footerH = 12;
  const gridY = padding + headerH + 2;
  const gridH = h - gridY - footerH - 4;
  const gridW = w - padding * 2;
  const cols = 4;
  const rows = 2;
  const cellGap = 2;
  const cellW = (gridW - cellGap * (cols - 1)) / cols;
  const cellH = (gridH - cellGap * (rows - 1)) / rows;

  // Garante 8 slots — ordena térreas (101-104) em cima, duplex (201-204) embaixo
  const casas = bloco.unidades.slice(0, 8);

  return (
    <g
      transform={`translate(${x},${y})`}
      style={{ cursor: "pointer" }}
      className="transition-transform"
    >
      {/* Card de fundo */}
      <rect
        width={w}
        height={h}
        rx={8}
        ry={8}
        fill="#ffffff"
        stroke={selecionado ? "#d63b3b" : "#cbd5e1"}
        strokeWidth={selecionado ? 2.5 : 1}
        onClick={onClickBloco}
      />
      {/* Nome do bloco */}
      <text
        x={w / 2}
        y={padding + 11}
        textAnchor="middle"
        fontSize="11"
        fontWeight="700"
        fill="#1a1a1a"
        onClick={onClickBloco}
      >
        {bloco.nome}
      </text>

      {/* Grid de casinhas */}
      {casas.map((u, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const cx = padding + col * (cellW + cellGap);
        const cy = gridY + row * (cellH + cellGap);
        const cor = CASA_COR[u.status] ?? CASA_COR.disponivel;
        const num = u.identificador.includes("-")
          ? u.identificador.split("-").slice(1).join("-")
          : u.identificador;
        const passaFiltro = matches(u, filtro);
        return (
          <g
            key={u.id}
            onClick={(e) => {
              e.stopPropagation();
              onClickCasa(u);
            }}
            style={{ cursor: "pointer", opacity: passaFiltro ? 1 : 0.18 }}
          >
            <rect
              x={cx}
              y={cy}
              width={cellW}
              height={cellH}
              rx={2}
              ry={2}
              fill={cor.fill}
              stroke={cor.stroke}
              strokeWidth={0.7}
              className="hover:opacity-80 transition-opacity"
            />
            <text
              x={cx + cellW / 2}
              y={cy + cellH / 2 + 3}
              textAnchor="middle"
              fontSize={cellH > 14 ? "9" : "7"}
              fontWeight="600"
              fill="#ffffff"
              pointerEvents="none"
            >
              {num}
            </text>
          </g>
        );
      })}

      {/* Contador embaixo */}
      <text
        x={w / 2}
        y={h - 4}
        textAnchor="middle"
        fontSize="9"
        fill="#525252"
        onClick={onClickBloco}
      >
        {bloco.disponiveis} de {bloco.total} disponíveis
      </text>
    </g>
  );
}

function LayoutPipa({
  blocos,
  selecionado,
  filtro,
  onClickBloco,
  onClickCasa,
}: {
  blocos: BlocoData[];
  selecionado: string | null;
  filtro: Filtro;
  onClickBloco: (nome: string) => void;
  onClickCasa: (u: Unidade) => void;
}) {
  // Espaçamento generoso, sem área de lazer.
  const cardW = 200;
  const cardH = 110;
  const gapY = 12;

  // 3 eixos centralizados horizontalmente.
  const eixo3X = 30;
  const eixo2X = 280;
  const eixo1X = 530;
  const eixo3StartY = 30;
  // Eixos 2 e 1 têm 3 blocos cada — centraliza no meio dos 6 do eixo 3.
  const totalAltura = 6 * cardH + 5 * gapY; // altura ocupada pelo eixo 3
  const eixo23StartY =
    eixo3StartY + (totalAltura - 3 * cardH - 2 * gapY) / 2;

  function colYDe(startY: number, ordem: number) {
    return startY + ordem * (cardH + gapY);
  }

  const viewBoxH = eixo3StartY + totalAltura + 80; // espaço para Duna e label

  return (
    <svg
      viewBox={`0 0 ${VIEWBOX_W} ${viewBoxH}`}
      className="w-full h-auto"
      role="img"
      aria-label="Mapa esquemático"
    >
      {/* Terreno */}
      <rect width={VIEWBOX_W} height={viewBoxH} fill="#f0fdf4" rx={12} />

      {/* Vias verticais entre eixos */}
      <rect
        x={eixo3X + cardW + 10}
        y={20}
        width={eixo2X - (eixo3X + cardW) - 20}
        height={viewBoxH - 50}
        fill="#e5e7eb"
        rx={4}
      />
      <rect
        x={eixo2X + cardW + 10}
        y={20}
        width={eixo1X - (eixo2X + cardW) - 20}
        height={viewBoxH - 50}
        fill="#e5e7eb"
        rx={4}
      />

      {/* Faixa tracejada central das vias */}
      <line
        x1={eixo3X + cardW + (eixo2X - eixo3X - cardW) / 2}
        y1={30}
        x2={eixo3X + cardW + (eixo2X - eixo3X - cardW) / 2}
        y2={viewBoxH - 40}
        stroke="#ffffff"
        strokeWidth={2}
        strokeDasharray="8 10"
      />
      <line
        x1={eixo2X + cardW + (eixo1X - eixo2X - cardW) / 2}
        y1={30}
        x2={eixo2X + cardW + (eixo1X - eixo2X - cardW) / 2}
        y2={viewBoxH - 40}
        stroke="#ffffff"
        strokeWidth={2}
        strokeDasharray="8 10"
      />

      {/* Blocos por eixo */}
      {blocos.map((b) => {
        const pos = LAYOUTS_CONHECIDOS[b.nome];
        if (!pos) return null;
        let x = 0;
        let y = 0;
        if (pos.eixo === 3) {
          x = eixo3X;
          y = colYDe(eixo3StartY, pos.ordem);
        } else if (pos.eixo === 2) {
          x = eixo2X;
          y = colYDe(eixo23StartY, pos.ordem);
        } else if (pos.eixo === 1) {
          x = eixo1X;
          y = colYDe(eixo23StartY, pos.ordem);
        } else if (pos.eixo === "duna") {
          // Duna fica logo abaixo do eixo 1 (separada por pequena via).
          x = eixo1X;
          y = colYDe(eixo23StartY, 3) + 16;
        }
        return (
          <CardBlocoComCasas
            key={b.nome}
            bloco={b}
            x={x}
            y={y}
            w={cardW}
            h={cardH}
            selecionado={selecionado === b.nome}
            filtro={filtro}
            onClickBloco={() => onClickBloco(b.nome)}
            onClickCasa={onClickCasa}
          />
        );
      })}

      {/* Rótulos dos eixos */}
      {[
        { x: eixo3X + cardW / 2, label: "Eixo 3" },
        { x: eixo2X + cardW / 2, label: "Eixo 2" },
        { x: eixo1X + cardW / 2, label: "Eixo 1" },
      ].map((e) => (
        <text
          key={e.label}
          x={e.x}
          y={viewBoxH - 14}
          textAnchor="middle"
          fontSize="12"
          fill="#737373"
          fontWeight="500"
        >
          {e.label}
        </text>
      ))}

      {/* Bússola */}
      <g transform={`translate(${VIEWBOX_W - 50}, 40)`}>
        <circle r={20} fill="white" stroke="#d6d3d1" strokeWidth={1.2} />
        <text
          textAnchor="middle"
          y={-4}
          fontSize="10"
          fill="#737373"
          fontWeight="600"
        >
          N
        </text>
        <path
          d="M 0 6 L 0 -10"
          stroke="#1a1a1a"
          strokeWidth={2}
          strokeLinecap="round"
        />
        <path
          d="M -4 -6 L 0 -10 L 4 -6"
          stroke="#1a1a1a"
          strokeWidth={2}
          strokeLinecap="round"
          fill="none"
        />
      </g>
    </svg>
  );
}

function LayoutGenerico({
  blocos,
  selecionado,
  filtro,
  onClickBloco,
  onClickCasa,
}: {
  blocos: BlocoData[];
  selecionado: string | null;
  filtro: Filtro;
  onClickBloco: (nome: string) => void;
  onClickCasa: (u: Unidade) => void;
}) {
  const cols = 4;
  const cardW = 180;
  const cardH = 120;
  const gapX = 14;
  const gapY = 14;
  const startX = 30;
  const startY = 30;
  const rows = Math.ceil(blocos.length / cols);
  return (
    <svg
      viewBox={`0 0 ${VIEWBOX_W} ${Math.max(VIEWBOX_H, startY + rows * (cardH + gapY))}`}
      className="w-full h-auto"
    >
      <rect width="100%" height="100%" fill="#f0fdf4" rx={12} />
      {blocos.map((b, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = startX + col * (cardW + gapX);
        const y = startY + row * (cardH + gapY);
        return (
          <CardBlocoComCasas
            key={b.nome}
            bloco={b}
            x={x}
            y={y}
            w={cardW}
            h={cardH}
            selecionado={selecionado === b.nome}
            filtro={filtro}
            onClickBloco={() => onClickBloco(b.nome)}
            onClickCasa={onClickCasa}
          />
        );
      })}
    </svg>
  );
}

function Legenda() {
  const itens = [
    { cor: "#22c55e", label: "Disponível" },
    { cor: "#eab308", label: "Reservada" },
    { cor: "#ef4444", label: "Vendida" },
  ];
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-3 px-1">
      {itens.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-1.5">
          <span
            className="inline-block size-3 rounded-sm border"
            style={{ background: i.cor, borderColor: "rgba(0,0,0,0.1)" }}
            aria-hidden
          />
          {i.label}
        </span>
      ))}
      <span className="ml-auto text-muted-foreground/70">
        Toque numa casinha para abrir
      </span>
    </div>
  );
}

function PainelBlocoExpandido({
  bloco,
  filtro,
  onSelect,
  onClose,
}: {
  bloco: BlocoData;
  filtro: Filtro;
  onSelect: (u: Unidade) => void;
  onClose: () => void;
}) {
  return (
    <div className="rounded-2xl border bg-background p-4 sm:p-5 shadow-sm space-y-4">
      <div className="flex items-baseline justify-between">
        <div>
          <p className="font-semibold text-lg">{bloco.nome}</p>
          <p className="text-xs text-muted-foreground">
            {bloco.disponiveis} de {bloco.total}{" "}
            {bloco.disponiveis === 1 ? "disponível" : "disponíveis"}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-sm text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-accent"
        >
          Fechar ×
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {bloco.unidades.map((u) => {
          const cor = CASA_COR[u.status] ?? CASA_COR.disponivel;
          const numero = u.identificador.includes("-")
            ? u.identificador.split("-").slice(1).join("-")
            : u.identificador;
          const dimmed = !matches(u, filtro);
          return (
            <button
              key={u.id}
              onClick={() => onSelect(u)}
              className={
                "group relative rounded-xl border bg-background hover:shadow-md hover:border-primary/40 p-4 text-left transition-all overflow-hidden " +
                (dimmed ? "opacity-40" : "")
              }
            >
              <div
                className="absolute top-0 left-0 w-full h-1"
                style={{ background: cor.fill }}
              />
              <div className="flex items-center justify-between">
                <span className="text-2xl font-semibold leading-none">
                  {numero}
                </span>
                <span
                  className="size-3 rounded-full"
                  style={{ background: cor.fill }}
                  aria-hidden
                />
              </div>
              <p className="text-xs mt-2 text-muted-foreground">
                {u.status === "disponivel"
                  ? "Disponível"
                  : u.status === "reservada"
                    ? "Reservada"
                    : "Vendida"}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
