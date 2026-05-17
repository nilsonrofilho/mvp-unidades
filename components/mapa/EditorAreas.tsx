"use client";
import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { salvarCoordenadasAction } from "@/lib/actions/unidades";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { Coordenadas } from "@/types/database";

export function EditorAreas({
  plantaUrl,
  unidadeId,
  identificador,
  empreendimentoId,
  coordsAtuais,
}: {
  plantaUrl: string;
  unidadeId: string;
  identificador: string;
  empreendimentoId: string;
  coordsAtuais: Coordenadas | null;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<Coordenadas | null>(coordsAtuais);
  const [drawing, setDrawing] = useState<{ startX: number; startY: number } | null>(
    null,
  );
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function rel(e: React.MouseEvent) {
    const rect = ref.current!.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    };
  }

  function onDown(e: React.MouseEvent) {
    const p = rel(e);
    setDrawing({ startX: p.x, startY: p.y });
    setCoords({ x: p.x, y: p.y, width: 0, height: 0 });
  }
  function onMove(e: React.MouseEvent) {
    if (!drawing) return;
    const p = rel(e);
    setCoords({
      x: Math.min(drawing.startX, p.x),
      y: Math.min(drawing.startY, p.y),
      width: Math.abs(p.x - drawing.startX),
      height: Math.abs(p.y - drawing.startY),
    });
  }
  function onUp() {
    setDrawing(null);
  }

  function salvar() {
    if (!coords || coords.width < 0.01 || coords.height < 0.01) {
      toast.error("Desenhe uma área primeiro");
      return;
    }
    startTransition(async () => {
      const res = await salvarCoordenadasAction(unidadeId, coords);
      if (res?.error) toast.error(res.error);
      else {
        toast.success("Área salva");
        router.push(`/empreendimentos/${empreendimentoId}`);
      }
    });
  }

  return (
    <div className="space-y-3">
      <p className="text-sm">
        Clique e arraste sobre a planta para marcar a área da unidade{" "}
        <strong>{identificador}</strong>.
      </p>
      <div
        ref={ref}
        onMouseDown={onDown}
        onMouseMove={onMove}
        onMouseUp={onUp}
        onMouseLeave={onUp}
        className="relative w-full rounded-lg border bg-muted overflow-hidden select-none cursor-crosshair"
      >
        <Image
          src={plantaUrl}
          alt="Planta"
          width={1600}
          height={1000}
          className="w-full h-auto pointer-events-none"
          draggable={false}
        />
        {coords && (
          <div
            className="absolute border-2 border-brand bg-brand/30"
            style={{
              left: `${coords.x * 100}%`,
              top: `${coords.y * 100}%`,
              width: `${coords.width * 100}%`,
              height: `${coords.height * 100}%`,
            }}
          />
        )}
      </div>
      <div className="flex gap-2">
        <Button onClick={salvar} disabled={pending}>
          {pending ? "Salvando..." : "Salvar área"}
        </Button>
        <Button variant="ghost" onClick={() => setCoords(null)}>
          Limpar
        </Button>
        <Button variant="ghost" onClick={() => router.back()}>
          Voltar
        </Button>
      </div>
    </div>
  );
}
