/**
 * The Dare Relay - DARE 026
 * A* 2D Grid Pathfinder with Euclidean/Manhattan Heuristics
 */
export interface Node2D {
  x: number;
  y: number;
}

export function findAStarPath(
  grid: number[][],
  start: Node2D,
  target: Node2D,
  allowDiagonal: boolean = false
): Node2D[] | null {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  if (rows === 0 || cols === 0) return null;
  const inBounds = (node: Node2D): boolean =>
    Number.isInteger(node.x) &&
    Number.isInteger(node.y) &&
    node.x >= 0 &&
    node.x < cols &&
    node.y >= 0 &&
    node.y < rows;

  if (!inBounds(start) || !inBounds(target)) return null;
  if (grid[start.y]?.[start.x] !== 0 || grid[target.y]?.[target.x] !== 0) return null;

  const heuristic = (a: Node2D, b: Node2D) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  const openSet: Node2D[] = [start];
  const cameFrom = new Map<string, Node2D>();
  const gScore = new Map<string, number>();
  const fScore = new Map<string, number>();

  const key = (n: Node2D) => `${n.x},${n.y}`;
  gScore.set(key(start), 0);
  fScore.set(key(start), heuristic(start, target));

  const directions: ReadonlyArray<readonly [number, number]> = allowDiagonal
    ? [[0, 1], [1, 0], [0, -1], [-1, 0], [1, 1], [-1, 1], [1, -1], [-1, -1]]
    : [[0, 1], [1, 0], [0, -1], [-1, 0]];

  while (openSet.length > 0) {
    openSet.sort((a, b) => (fScore.get(key(a)) ?? Infinity) - (fScore.get(key(b)) ?? Infinity));
    const current = openSet.shift()!;

    if (current.x === target.x && current.y === target.y) {
      const path: Node2D[] = [current];
      let curr = current;
      while (cameFrom.has(key(curr))) {
        curr = cameFrom.get(key(curr))!;
        path.unshift(curr);
      }
      return path;
    }

    for (const [dx, dy] of directions) {
      const nx = current.x + dx;
      const ny = current.y + dy;
      if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && grid[ny]?.[nx] === 0) {
        const neighbor = { x: nx, y: ny };
        const tentativeG = (gScore.get(key(current)) ?? Infinity) + 1;
        if (tentativeG < (gScore.get(key(neighbor)) ?? Infinity)) {
          cameFrom.set(key(neighbor), current);
          gScore.set(key(neighbor), tentativeG);
          fScore.set(key(neighbor), tentativeG + heuristic(neighbor, target));
          if (!openSet.some(n => n.x === nx && n.y === ny)) {
            openSet.push(neighbor);
          }
        }
      }
    }
  }

  return null;
}
