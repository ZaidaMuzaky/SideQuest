export function xpForLevel(level: number) { return BigInt(Math.max(0, level - 1)) * BigInt(Math.max(1, level)) * 100n / 2n; }
export function levelForXp(xp: bigint) {
  if (xp <= 0n) return 1;
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level += 1;
  return level;
}
