/** Keep the open editor when a stale previous-product close arrives. */
export function resolveDetailProductIdAfterEditorClose(
  currentProductId: string | null,
  closingProductId: string,
): string | null {
  return currentProductId === closingProductId ? null : currentProductId
}

/** True while this save generation still owns the editor session. */
export function isActiveSaveGeneration(
  saveGeneration: number,
  currentGeneration: number,
): boolean {
  return saveGeneration === currentGeneration
}
