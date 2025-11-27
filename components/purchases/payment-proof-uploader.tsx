"use client";

import type { ChangeEvent } from "react";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { SerializedPurchase } from "@/lib/purchases";

interface PaymentProofUploaderProps {
  purchaseId: number;
  receiptUrl?: string | null;
  onSuccess?: (purchase: SerializedPurchase) => void;
}

export function PaymentProofUploader({ purchaseId, receiptUrl, onSuccess }: PaymentProofUploaderProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(receiptUrl ?? null);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("proofFile", file);

    setIsUploading(true);

    try {
      const response = await fetch(`/api/purchases/${purchaseId}/proof`, {
        method: "POST",
        body: formData,
      });

      const data = (await response.json().catch(() => null)) as {
        status?: string;
        message?: string;
        purchase?: SerializedPurchase;
      } | null;

      if (!response.ok || data?.status !== "success" || !data.purchase) {
        throw new Error(data?.message ?? "Não foi possível enviar o comprovante.");
      }

      toast.success(data.message ?? "Comprovante enviado!");
      setUploadedUrl(data.purchase.payment?.receiptUrl ?? null);
      onSuccess?.(data.purchase);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao enviar o comprovante.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="font-semibold text-slate-900">Anexar comprovante</p>
          <p className="text-xs text-slate-500">
            Envie o pagamento para adiantar a emissão. Formatos aceitos: JPEG, PNG ou WEBP.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="rounded-full"
          onClick={handleFileSelect}
          disabled={isUploading}
        >
          <UploadCloud className="mr-2 size-4" /> {isUploading ? "Enviando..." : "Selecionar arquivo"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          onChange={handleUpload}
        />
      </div>
      {uploadedUrl ? (
        <p className="text-xs text-emerald-700">Último comprovante salvo: {uploadedUrl}</p>
      ) : null}
    </div>
  );
}
