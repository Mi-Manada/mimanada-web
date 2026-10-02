"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ConfirmationModal } from "@/components/admin/ConfirmationModal";
import { StatusBadge } from "@/components/admin/StatusBadge";
import {
  formatAdminDate,
  MODERATION_STATUS_LABELS,
} from "@/components/admin/labels";
import {
  ApiError,
  getAdminModerationPets,
  mediaUrl,
  setAdminPetStatus,
  type AdminPet,
  type PetModerationStatus,
} from "@/lib/api";

const FILTERS = [
  { id: "pending", label: "Pendientes" },
  { id: "reported", label: "Reportadas" },
  { id: "approved", label: "Aprobadas" },
  { id: "hidden", label: "Ocultas" },
  { id: "deleted", label: "Eliminadas" },
];

export function AdminModerationScreen() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const filter = searchParams.get("filter") ?? "pending";
  const [items, setItems] = useState<AdminPet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{
    petId: string;
    status: PetModerationStatus;
    title: string;
    message: string;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const rows = await getAdminModerationPets(filter);
      setItems(rows);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "No se pudo cargar la cola.",
      );
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  async function applyStatus(petId: string, status: PetModerationStatus) {
    setBusyId(petId);
    try {
      await setAdminPetStatus(petId, status);
      await load();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "No se pudo actualizar el estado.",
      );
    } finally {
      setBusyId(null);
      setConfirm(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[1.4rem] text-[#222] [font-weight:800]">Moderación</h1>
        <p className="mt-1 text-[0.9rem] text-[#777]">
          Cola de publicaciones para revisar, ocultar o eliminar.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = filter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => router.replace(`/admin/moderacion?filter=${f.id}`)}
              className={`rounded-full px-3.5 py-1.5 text-[0.8rem] [font-weight:700] ${
                active
                  ? "bg-[var(--color-primary)] text-white"
                  : "border border-[#e4e4e4] bg-white text-[#555]"
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {error ? (
        <p className="text-[0.9rem] text-[var(--color-primary)]">{error}</p>
      ) : null}

      {loading ? (
        <p className="text-[#666]">Cargando publicaciones…</p>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#ddd] bg-white p-10 text-center text-[#888]">
          No hay publicaciones en este filtro.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {items.map((pet) => {
            const photo = mediaUrl(pet.photoUrls[0]);
            return (
              <article
                key={pet.id}
                className="overflow-hidden rounded-2xl border border-[#ececec] bg-white shadow-sm"
              >
                <div className="flex gap-3 p-3">
                  <div className="h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-[#f0f0f0]">
                    {photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={photo}
                        alt={pet.name}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-[1rem] text-[#222] [font-weight:800]">
                        {pet.name}
                      </h2>
                      <StatusBadge
                        kind="moderation"
                        value={pet.moderationStatus}
                        label={
                          MODERATION_STATUS_LABELS[pet.moderationStatus] ??
                          pet.moderationStatus
                        }
                      />
                    </div>
                    <p className="mt-1 text-[0.8rem] text-[#777]">
                      {pet.ownerName ?? "Usuario"} · {formatAdminDate(pet.createdAt)}
                    </p>
                    <p className="mt-2 line-clamp-2 text-[0.85rem] text-[#555]">
                      {pet.description || "Sin descripción"}
                    </p>
                    <p className="mt-2 text-[0.78rem] text-[#888]">
                      Reportes: {pet.reportCount} · Escaneo:{" "}
                      {pet.moderationScanStatus}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 border-t border-[#f0f0f0] px-3 py-3">
                  <Link
                    href={`/admin/moderacion/${pet.id}`}
                    className="rounded-full border border-[#e4e4e4] px-3 py-1.5 text-[0.78rem] text-[#444] [font-weight:700]"
                  >
                    Ver completa
                  </Link>
                  <Link
                    href={`/usuarios/${pet.ownerId}`}
                    className="rounded-full border border-[#e4e4e4] px-3 py-1.5 text-[0.78rem] text-[#444] [font-weight:700]"
                  >
                    Ver usuario
                  </Link>
                  <button
                    type="button"
                    disabled={busyId === pet.id}
                    onClick={() =>
                      void applyStatus(pet.id, "active")
                    }
                    className="rounded-full bg-emerald-600 px-3 py-1.5 text-[0.78rem] text-white [font-weight:700] disabled:opacity-60"
                  >
                    Aprobar
                  </button>
                  <button
                    type="button"
                    disabled={busyId === pet.id}
                    onClick={() =>
                      void applyStatus(pet.id, "hidden")
                    }
                    className="rounded-full bg-slate-600 px-3 py-1.5 text-[0.78rem] text-white [font-weight:700] disabled:opacity-60"
                  >
                    Ocultar
                  </button>
                  <button
                    type="button"
                    disabled={busyId === pet.id}
                    onClick={() =>
                      setConfirm({
                        petId: pet.id,
                        status: "deleted",
                        title: "Eliminar publicación",
                        message: `¿Eliminar “${pet.name}”? Quedará como soft delete y se puede restaurar.`,
                      })
                    }
                    className="rounded-full bg-red-600 px-3 py-1.5 text-[0.78rem] text-white [font-weight:700] disabled:opacity-60"
                  >
                    Eliminar
                  </button>
                  <Link
                    href={`/admin/usuarios?focus=${pet.ownerId}`}
                    className="rounded-full border border-red-200 px-3 py-1.5 text-[0.78rem] text-red-700 [font-weight:700]"
                  >
                    Suspender usuario
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <ConfirmationModal
        open={Boolean(confirm)}
        title={confirm?.title ?? ""}
        message={confirm?.message ?? ""}
        confirmLabel="Eliminar"
        danger
        busy={Boolean(confirm && busyId === confirm.petId)}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm) void applyStatus(confirm.petId, confirm.status);
        }}
      />
    </div>
  );
}
