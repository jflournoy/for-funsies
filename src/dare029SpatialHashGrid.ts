/**
 * The Dare Relay - DARE 029
 * Spatial Hash Grid for 2D Collision Candidate Querying
 */
export interface SpatialItem {
  id: string;
  x: number;
  y: number;
}

export class SpatialHashGrid {
  private grid = new Map<string, SpatialItem[]>();

  constructor(private readonly cellSize: number = 64) {}

  private getCellKey(x: number, y: number): string {
    const cx = Math.floor(x / this.cellSize);
    const cy = Math.floor(y / this.cellSize);
    return `${cx}:${cy}`;
  }

  public insert(item: SpatialItem): void {
    const key = this.getCellKey(item.x, item.y);
    const cell = this.grid.get(key) || [];
    cell.push(item);
    this.grid.set(key, cell);
  }

  public queryNeighbors(x: number, y: number, radius: number): SpatialItem[] {
    const results: SpatialItem[] = [];
    const minX = x - radius;
    const maxX = x + radius;
    const minY = y - radius;
    const maxY = y + radius;

    const minCx = Math.floor(minX / this.cellSize);
    const maxCx = Math.floor(maxX / this.cellSize);
    const minCy = Math.floor(minY / this.cellSize);
    const maxCy = Math.floor(maxY / this.cellSize);

    const radSq = radius * radius;

    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        const cell = this.grid.get(`${cx}:${cy}`);
        if (!cell) continue;
        for (const item of cell) {
          const distSq = (item.x - x) ** 2 + (item.y - y) ** 2;
          if (distSq <= radSq) {
            results.push(item);
          }
        }
      }
    }

    return results;
  }
}
