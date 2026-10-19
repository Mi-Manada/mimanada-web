"use client";

import { useEffect, useState } from "react";

export type ReasonPreset = {
  code: string;
  label: string;
  text: string;
};

export function AdminActionModal({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  danger,
  busy,
  reasonRequired = false,
  reasonLabel = "Mensaje para el usuario",
  reasonPlaceholder = "Explica el motivo…",
  showDuration,
  presets,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  busy?: boolean;
  reasonRequired?: boolean;
  reasonLabel?: string;
  reasonPlaceholder?: string;
  showDuration?: boolean;
  presets?: ReasonPreset[];
  onConfirm: (payload: {
    reason: string;
    days: number | null;
    policyCode: string | null;
  }) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState("");
  const [days, setDays] = useState<number | null>(7);
  const [policyCode, setPolicyCode] = useState<string | null>(null);
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    if (!open) return;
    setReason("");
    setDays(7);
    setPolicyCode(null);
    setLocalError("");
  }, [open]);

  if (!open) return null;

  function submit() {
    const trimmed = reason.trim();
    if (reasonRequired && !trimmed) {
      setLocalError("Escribe el motivo que verá el usuario.");
      return;
    }
    setLocalError("");
    onConfirm({
      reason: trimmed,
      days: showDuration ? days : null,
      policyCode,
    });
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"
      >
        <h2 className="text-[1.05rem] text-[#333] [font-weight:800]">{title}</h2>
        <p className="mt-2 text-[0.9rem] text-[#666]">{description}</p>

        {presets && presets.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {presets.map((preset) => {
              const active = policyCode === preset.code;
              return (
                <button
                  key={preset.code}
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setPolicyCode(preset.code);
                    setReason(preset.text);
                    setLocalError("");
                  }}
                  className={`rounded-full px-3 py-1.5 text-[0.75rem] [font-weight:700] ${
                    active
                      ? "bg-[var(--color-primary)] text-white"
                      : "border border-[#e4e4e4] text-[#555]"
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        ) : null}

        {showDuration ? (
          <div className="mt-4">
            <p className="mb-2 text-[0.8rem] text-[#666] [font-weight:700]">
              Duración
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 1, label: "24 horas" },
                { value: 7, label: "7 días" },
                { value: 30, label: "30 días" },
                { value: null, label: "Indefinida" },
              ].map((opt) => {
                const active = days === opt.value;
                return (
                  <button
                    key={String(opt.value)}
                    type="button"
                    disabled={busy}
                    onClick={() => setDays(opt.value)}
                    className={`rounded-xl border px-3 py-2.5 text-left text-[0.85rem] [font-weight:700] ${
                      active
                        ? "border-[var(--color-primary)] bg-[var(--color-primary)]/8 text-[var(--color-primary)]"
                        : "border-[#e8e8e8] text-[#555]"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        <label className="mt-4 block">
          <span className="mb-1.5 block text-[0.8rem] text-[#666] [font-weight:700]">
            {reasonLabel}
            {reasonRequired ? " *" : " (opcional)"}
          </span>
          <textarea
            value={reason}
            onChange={(e) => {
              setReason(e.target.value.slice(0, 500));
              setPolicyCode(null);
            }}
            rows={4}
            disabled={busy}
            placeholder={reasonPlaceholder}
            className="w-full resize-none rounded-[12px] border border-[#e8e8e8] bg-[#fafafa] px-3.5 py-3 text-[0.9rem] outline-none focus:border-[var(--color-primary)] focus:bg-white"
          />
        </label>

        {localError ? (
          <p className="mt-2 text-[0.8rem] text-[var(--color-primary)]">
            {localError}
          </p>
        ) : null}

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="h-11 flex-1 rounded-full border border-[#e0e0e0] text-[0.9rem] text-[#555] [font-weight:700] disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={submit}
            className={`h-11 flex-1 rounded-full text-[0.9rem] text-white [font-weight:700] disabled:opacity-60 ${
              danger
                ? "bg-red-600 hover:bg-red-700"
                : "bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]"
            }`}
          >
            {busy ? "Procesando…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
