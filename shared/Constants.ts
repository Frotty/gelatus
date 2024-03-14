export const ARENA_SIZE = 4000;

export function getSpeed(size: number): number {
    return Math.max(1, 6 - (3 * size) / 300);
}
