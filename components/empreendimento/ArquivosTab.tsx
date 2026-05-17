"use client";
import { useState, useTransition } from "react";
import type { ArquivoEmpreendimento } from "@/types/database";
import { FileUploaderMultiple } from "@/components/upload/FileUploader";
import {
  registrarArquivoAction,
  excluirArquivoAction,
} from "@/lib/actions/arquivos";
import { Button } from "@/components/ui/button";
import { Trash2, Download, FileText } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function ArquivosTab({
  empreendimentoId,
  arquivos,
  isAdmin,
}: {
  empreendimentoId: string;
  arquivos: ArquivoEmpreendimento[];
  isAdmin: boolean;
}) {
  const [list, setList] = useState(arquivos);
  const [, startTransition] = useTransition();
  const router = useRouter();

  async function onUploaded(url: string, _path: string, file: File) {
    const res = await registrarArquivoAction({
      empreendimento_id: empreendimentoId,
      nome: file.name,
      url,
      tamanho_bytes: file.size,
      tipo_mime: file.type,
    });
    if (res?.error) toast.error(res.error);
    else {
      toast.success("Arquivo adicionado");
      router.refresh();
    }
  }

  function onDelete(id: string) {
    if (!confirm("Excluir arquivo?")) return;
    startTransition(async () => {
      const res = await excluirArquivoAction(id, empreendimentoId);
      if (res?.error) toast.error(res.error);
      else {
        setList((l) => l.filter((a) => a.id !== id));
        toast.success("Arquivo excluído");
      }
    });
  }

  return (
    <div className="space-y-4">
      {isAdmin && (
        <FileUploaderMultiple
          bucket="arquivos"
          kind="document"
          pathPrefix={empreendimentoId}
          onUploaded={onUploaded}
        />
      )}
      {list.length === 0 ? (
        <p className="text-muted-foreground text-center py-8 text-sm">
          Nenhum arquivo ainda.
        </p>
      ) : (
        <ul className="divide-y rounded-lg border bg-background">
          {list.map((a) => (
            <li key={a.id} className="flex items-center gap-3 p-3">
              <FileText className="size-5 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium">{a.nome}</p>
                <p className="text-xs text-muted-foreground">
                  {(a.tamanho_bytes / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <a
                href={a.url}
                download
                target="_blank"
                rel="noopener"
                className="inline-flex h-8 w-8 items-center justify-center rounded hover:bg-accent"
              >
                <Download className="size-4" />
              </a>
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(a.id)}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
