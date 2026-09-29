import type { SeoConfig } from "./seo";

type Listener = () => void;

let override: Partial<SeoConfig> | null = null;
const listeners = new Set<Listener>();

export function setSeoOverride(next: Partial<SeoConfig> | null): void {
  override = next;
  listeners.forEach((fn) => fn());
}

export function getSeoOverride(): Partial<SeoConfig> | null {
  return override;
}

export function subscribeSeoOverride(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
