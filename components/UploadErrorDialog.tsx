"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { UploadErrorDetails } from "@/types/upload";

interface UploadErrorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  details: UploadErrorDetails | null;
}

const stageLabels: Record<string, string> = {
  credentials: "Verificação das credenciais do Dropbox",
  client_initialization: "Inicialização do cliente do Dropbox",
  upload: "Envio do arquivo para o Dropbox",
};

function formatStage(stage?: string) {
  if (!stage) {
    return null;
  }

  return stageLabels[stage] ?? stage;
}

export function UploadErrorDialog({
  open,
  onOpenChange,
  details,
}: UploadErrorDialogProps) {
  const formattedStage = formatStage(details?.stage);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto" showCloseButton>
        <DialogHeader>
          <DialogTitle>Falha ao salvar arquivo no Dropbox</DialogTitle>
          <DialogDescription>
            Não foi possível concluir o upload. Confira os detalhes técnicos abaixo
            e tente novamente após corrigir o problema.
          </DialogDescription>
        </DialogHeader>

        {details ? (
          <div className="space-y-4 text-sm text-slate-700">
            <div>
              <h4 className="text-sm font-semibold text-slate-900">
                Motivo principal
              </h4>
              <p className="mt-1 whitespace-pre-line break-words">
                {details.message}
              </p>
            </div>

            {formattedStage && (
              <div>
                <h4 className="text-sm font-semibold text-slate-900">
                  Etapa afetada
                </h4>
                <p className="mt-1 break-words">{formattedStage}</p>
              </div>
            )}

            {details.dropboxPath && (
              <div>
                <h4 className="text-sm font-semibold text-slate-900">
                  Caminho no Dropbox
                </h4>
                <p className="mt-1 break-all font-mono text-xs text-slate-600">
                  {details.dropboxPath}
                </p>
              </div>
            )}

            {details.causeMessage && (
              <div>
                <h4 className="text-sm font-semibold text-slate-900">
                  Detalhes do erro interno
                </h4>
                <p className="mt-1 whitespace-pre-line break-words">
                  {details.causeMessage}
                </p>
              </div>
            )}

            {details.stack && (
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Stack trace</h4>
                <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words rounded-md bg-slate-900/90 p-3 text-xs text-slate-100">
                  {details.stack}
                </pre>
              </div>
            )}

            {details.causeStack && (
              <div>
                <h4 className="text-sm font-semibold text-slate-900">
                  Stack trace da causa
                </h4>
                <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words rounded-md bg-slate-900/80 p-3 text-xs text-slate-100">
                  {details.causeStack}
                </pre>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-600">
            Não foi possível recuperar detalhes adicionais sobre a falha.
          </p>
        )}

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Fechar
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
