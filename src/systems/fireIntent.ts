export function computeIsFiring(p: { leftMouseDown: boolean; gameOver: boolean }): boolean {
  return !p.gameOver && p.leftMouseDown
}
