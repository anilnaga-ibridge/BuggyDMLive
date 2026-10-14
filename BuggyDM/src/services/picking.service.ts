export interface PickItem {
  id: string;
  itemId: string;
  name: string;
  quantity: number;
  rackCode: string;
  status: string;
  pickSessionId: string;
}

export class PickingService {
  // Parse rack code into sorting key (aisle and numerical slot)
  private static parseRack(rackCode: string): { aisle: string; slot: number } {
    const code = rackCode.trim();
    // Match pattern like "Rack A12" or "A12" or "A-12"
    const match = code.match(/([a-zA-Z]+)-?(\d+)/);
    if (match) {
      return {
        aisle: match[1].toUpperCase(),
        slot: parseInt(match[2], 10)
      };
    }
    // Fallback if formatting doesn't match
    return { aisle: "ZZZ", slot: 9999 };
  }

  // Sort picking list to minimize walking back-and-forth
  static optimizeRoute(items: PickItem[]): PickItem[] {
    return [...items].sort((a, b) => {
      const locA = this.parseRack(a.rackCode);
      const locB = this.parseRack(b.rackCode);

      // First sort by Aisle (alphabetical)
      if (locA.aisle !== locB.aisle) {
        return locA.aisle.localeCompare(locB.aisle);
      }

      // Then sort by Slot (numerical)
      return locA.slot - locB.slot;
    });
  }

  // Calculate approximate walking distance in meters between racks (for productivity KPI)
  static calculateDistance(items: PickItem[]): number {
    if (items.length <= 1) return 0;

    let totalDistance = 0;
    let prev = this.parseRack(items[0].rackCode);

    for (let i = 1; i < items.length; i++) {
      const curr = this.parseRack(items[i].rackCode);
      
      // Rough warehouse layout distance model:
      // - Walking between aisles: 10 meters per aisle jump
      // - Walking within the same aisle: 2 meters per slot gap
      const aisleDiff = Math.abs(prev.aisle.charCodeAt(0) - curr.aisle.charCodeAt(0));
      const slotDiff = Math.abs(prev.slot - curr.slot);

      totalDistance += (aisleDiff * 10) + (slotDiff * 2);
      prev = curr;
    }

    return totalDistance;
  }
}
