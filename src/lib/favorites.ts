"use client";

import {
  addFavorite,
  getFavoriteIds,
  getToken,
  removeFavorite,
} from "@/lib/api";

type Listener = () => void;

let cachedIds: Set<string> | null = null;
let inflight: Promise<Set<string>> | null = null;
const listeners = new Set<Listener>();

function notify() {
  for (const listener of listeners) listener();
}

export function subscribeFavoriteIds(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function peekFavoriteIds(): Set<string> | null {
  return cachedIds;
}

export function clearFavoriteIdsCache() {
  cachedIds = null;
  inflight = null;
  notify();
}

export async function ensureFavoriteIds(force = false): Promise<Set<string>> {
  if (!getToken()) {
    cachedIds = new Set();
    notify();
    return cachedIds;
  }
  if (!force && cachedIds) return cachedIds;
  if (!force && inflight) return inflight;

  inflight = getFavoriteIds()
    .then((ids) => {
      cachedIds = new Set(ids);
      notify();
      return cachedIds;
    })
    .catch(() => {
      cachedIds = cachedIds ?? new Set();
      return cachedIds;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

export async function toggleFavoritePet(
  petId: string,
  next: boolean,
): Promise<boolean> {
  if (!getToken()) {
    throw new Error("AUTH_REQUIRED");
  }

  const previous = new Set(cachedIds ?? []);
  const optimistic = new Set(previous);
  if (next) optimistic.add(petId);
  else optimistic.delete(petId);
  cachedIds = optimistic;
  notify();

  try {
    if (next) await addFavorite(petId);
    else await removeFavorite(petId);
    return next;
  } catch (err) {
    cachedIds = previous;
    notify();
    throw err;
  }
}
