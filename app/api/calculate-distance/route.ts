import { NextRequest, NextResponse } from "next/server";

type Graph = {
    [node: string]: Array<{
        neighbor: string;
        weight: number | null;
    }>;
};

export const postcodes: Set<string> = new Set([
    "G51", "G52", "G53", "G46", "G43",
    "G41", "G42", "G44", "G45", "G73",
    "G5", "G11", "G12", "G22", "G20",
    "G21", "G31", "G32", "G33", "G34",
    "G69", "G71", "G72", "G74", "G75", 
    "G40", "G1", "G2", "G3", "G4", 
    "ML3", "ML1", "ML4", "ML5" // Motherwell
]);

const graph: Graph = {
    "G51": [
        { neighbor: "G52", weight: 6 },
        { neighbor: "G11", weight: 5 },
        { neighbor: "G3", weight: 10 },
        { neighbor: "G5", weight: 12 },
        { neighbor: "G41", weight: 11 },
    ],
    "G52": [
        { neighbor: "G51", weight: 6 },
        { neighbor: "G53", weight: 11 },
        { neighbor: "G41", weight: 9 },
        { neighbor: "G43", weight: 12 },
    ],
    "G53": [
        { neighbor: "G52", weight: 11 },
        { neighbor: "G46", weight: 11 },
        { neighbor: "G43", weight: 8 },
        { neighbor: "G41", weight: 11 },
    ],
    "G46": [
        { neighbor: "G53", weight: 11 },
        { neighbor: "G43", weight: 6 },
        { neighbor: "G44", weight: 11 },
    ],
    "G43": [
        { neighbor: "G52", weight: 12 },
        { neighbor: "G53", weight: 8 },
        { neighbor: "G46", weight: 6 },
        { neighbor: "G44", weight: 7 },
        { neighbor: "G41", weight: 7 },
        { neighbor: "G42", weight: 10 },
    ],
    "G41": [
        { neighbor: "G51", weight: 11 },
        { neighbor: "G52", weight: 9 },
        { neighbor: "G53", weight: 11 },
        { neighbor: "G43", weight: 7 },
        { neighbor: "G42", weight: 7 },
        { neighbor: "G5", weight: 8 },
    ],
    "G42": [
        { neighbor: "G41", weight: 7 },
        { neighbor: "G43", weight: 10 },
        { neighbor: "G44", weight: 6 },
        { neighbor: "G73", weight: 10 },
        { neighbor: "G5", weight: 5 },
        { neighbor: "G40", weight: 11 },
    ],
    "G44": [
        { neighbor: "G43", weight: 7 },
        { neighbor: "G42", weight: 6 },
        { neighbor: "G46", weight: 11 },
        { neighbor: "G45", weight: 7 },
        { neighbor: "G42", weight: 6 },
        { neighbor: "G73", weight: 8 },
    ],
    "G45": [
        { neighbor: "G44", weight: 7 },
        { neighbor: "G73", weight: 9 },
        { neighbor: "G72", weight: 14 },
        { neighbor: "G74", weight: 12 },
    ],
    "G73": [
        { neighbor: "G72", weight: 10 },
        { neighbor: "G74", weight: 11 },
        { neighbor: "G45", weight: 9 },
        { neighbor: "G44", weight: 8 },
        { neighbor: "G42", weight: 10 },
        { neighbor: "G5", weight: 7 },
        { neighbor: "G40", weight: 6 },
        { neighbor: "G32", weight: 10 }        
    ],
    "G5": [
        { neighbor: "G51", weight: 12 },
        { neighbor: "G41", weight: 8 },
        { neighbor: "G42", weight: 5 },
        { neighbor: "G73", weight: 7 },
        { neighbor: "G40", weight: 6 },
        { neighbor: "G1", weight: 7 },
        { neighbor: "G2", weight: 9 },
        { neighbor: "G3", weight: 8 },
    ],
    "G11": [
        { neighbor: "G51", weight: 5 },
        { neighbor: "G3", weight: 8 },
        { neighbor: "G12", weight: 6 },
    ],
    "G12": [
        { neighbor: "G11", weight: 6 },
        { neighbor: "G20", weight: 6 },
        { neighbor: "G3", weight: 10 },
    ],
    "G20": [
        { neighbor: "G12", weight: 6 },
        { neighbor: "G4", weight: 10 },
        { neighbor: "G3", weight: 10 },
        { neighbor: "G22", weight: 7 },
    ],
    "G22": [
        { neighbor: "G20", weight: 7 },
        { neighbor: "G21", weight: 5 },
        { neighbor: "G4", weight: 7 },
    ],
    "G21": [
        { neighbor: "G22", weight: 5 },
        { neighbor: "G4", weight: 7 },
        { neighbor: "G31", weight: 10 },
        { neighbor: "G33", weight: 10 },
    ],
    "G31": [
        { neighbor: "G40", weight: 7 },
        { neighbor: "G1", weight: 9 },
        { neighbor: "G4", weight: 10 },
        { neighbor: "G21", weight: 10 },
        { neighbor: "G33", weight: 9 },
        { neighbor: "G32", weight: 6 },
    ],
    "G32": [
        { neighbor: "G31", weight: 6 },
        { neighbor: "G33", weight: 12 },
        { neighbor: "G34", weight: 11 },
        { neighbor: "G69", weight: 14 }, // Shows 17 but takes you to Gartosch 
        { neighbor: "G71", weight: 12 },
        { neighbor: "G72", weight: 11 },
        { neighbor: "G73", weight: 10 },
        { neighbor: "G40", weight: 9 },
    ],
    "G33": [
        { neighbor: "G21", weight: 10 },
        { neighbor: "G31", weight: 9 },
        { neighbor: "G32", weight: 12 },
        { neighbor: "G34", weight: 8 },
        { neighbor: "G69", weight: 9 },
    ],
    "G34": [
        { neighbor: "G33", weight: 8 },
        { neighbor: "G32", weight: 11 },
        { neighbor: "G69", weight: 5 }, // to Baillieston
        { neighbor: "ML5", weight: 10 },
        { neighbor: "G71", weight: 11 }
    ],
    "G69": [ // Weird borders 
        { neighbor: "G34", weight: 5 }, // From Baillieston
        { neighbor: "G33", weight: 9 },
        { neighbor: "G32", weight: 14 }, // Deducting 3 mins to keep it within 15 mins 
        { neighbor: "ML5", weight: 12 },
        { neighbor: "G71", weight: 11 }, // From Baillieston
    ],
    "G71": [
        { neighbor: "G69", weight: 11 }, // To Baillieston
        { neighbor: "G34", weight: 11 },
        { neighbor: "G32", weight: 12 },
        { neighbor: "G72", weight: 13 },
        { neighbor: "ML1", weight: 12 }, // To Motherwell
        { neighbor: "ML3", weight: 13 },
        { neighbor: "ML4", weight: 7 },
        { neighbor: "ML5", weight: 12 },
    ],
    "G72": [
        { neighbor: "G74", weight: 12 },
        { neighbor: "G73", weight: 10 },
        { neighbor: "G32", weight: 11 },
        { neighbor: "G71", weight: 13 },
        { neighbor: "ML3", weight: 12 }, // To Hamilton
        { neighbor: "G45", weight: 14 },
    ],
    "G74": [
        { neighbor: "G72", weight: 12 },
        { neighbor: "G75", weight: 10 },
        { neighbor: "G73", weight: 11 },
        { neighbor: "G45", weight: 12 },
        { neighbor: "ML3", weight: 12 },
    ],
    "G75": [
        { neighbor: "G74", weight: 10 },
        { neighbor: "ML3", weight: 13 },
    ],

    "G40": [
        { neighbor: "G42", weight: 11 },
        { neighbor: "G73", weight: 6 },
        { neighbor: "G31", weight: 7 },
        { neighbor: "G1", weight: 8 },
        { neighbor: "G4", weight: 13 }, 
        { neighbor: "G5", weight: 6 },
        { neighbor: "G32", weight: 9 },
    ],
    "G1": [
        { neighbor: "G40", weight: 8 },
        { neighbor: "G5", weight: 7 },
        { neighbor: "G2", weight: 9 },
        { neighbor: "G4", weight: 10 }, // Recheck bc road closure
        { neighbor: "G31", weight: 9 },
    ],
    "G2": [
        { neighbor: "G1", weight: 9 },
        { neighbor: "G3", weight: 5 },
        { neighbor: "G4", weight: 9 },
        { neighbor: "G5", weight: 9 },
    ],
    "G3": [
        { neighbor: "G51", weight: 10 },
        { neighbor: "G2", weight: 5 },
        { neighbor: "G5", weight: 8 },
        { neighbor: "G4", weight: 6 }, // Recheck bc road closure
        { neighbor: "G20", weight: 10 },
        { neighbor: "G12", weight: 10 },
        { neighbor: "G11", weight: 8 },
    ],
    "G4": [
        { neighbor: "G1", weight: 10 },
        { neighbor: "G2", weight: 9 },
        { neighbor: "G3", weight: 6 }, // Recheck bc road closure
        { neighbor: "G20", weight: 10 },
        { neighbor: "G22", weight: 7 },
        { neighbor: "G21", weight: 7 },
        { neighbor: "G31", weight: 10 },
        { neighbor: "G40", weight: 13 },
    ],

    "ML3": [
        { neighbor: "G75", weight: 13 },
        { neighbor: "G74", weight: 12 },
        { neighbor: "G72", weight: 12 },
        { neighbor: "G71", weight: 13 },
        { neighbor: "ML4", weight: 10 },
        { neighbor: "ML1", weight: 8 }, // To Motherwell
        { neighbor: "ML5", weight: 15 }
    ],
    "ML1": [
        { neighbor: "ML5", weight: 7 },
        { neighbor: "ML4", weight: 8 },
        { neighbor: "ML3", weight: 8 },
        { neighbor: "G71", weight: 12 },
    ],
    "ML4": [
        { neighbor: "ML5", weight: 10 },
        { neighbor: "ML1", weight: 8 },
        { neighbor: "ML3", weight: 10 },
        { neighbor: "G71", weight: 7 },
    ],
    "ML5": [
        { neighbor: "G34", weight: 10 },
        { neighbor: "G69", weight: 12 },
        { neighbor: "G71", weight: 12 },
        { neighbor: "ML1", weight: 7 },
        { neighbor: "ML4", weight: 10 },
        { neighbor: "ML3", weight: 15 },
    ]
};



/** Audits the graph for bidirectional consistency.
 *  - Missing reverse edges (A→B exists but B→A does not)
 *  - Weight mismatches (A→B has a different weight than B→A)
 */
export function auditBidirectional(): {
  missingReverse: Array<{ from: string; to: string; weight: number | null }>;
  weightMismatches: Array<{ from: string; to: string; weightForward: number | null; weightReverse: number | null }>;
} {
  const missingReverse: Array<{ from: string; to: string; weight: number | null }> = [];
  const weightMismatches: Array<{ from: string; to: string; weightForward: number | null; weightReverse: number | null }> = [];
  const seen = new Set<string>();

  for (const [node, neighbors] of Object.entries(graph)) {
    for (const { neighbor, weight } of neighbors) {
      const reverseEdges = graph[neighbor];
      if (!reverseEdges) {
        missingReverse.push({ from: node, to: neighbor, weight });
        continue;
      }

      const reverseEdge = reverseEdges.find((e) => e.neighbor === node);
      if (!reverseEdge) {
        missingReverse.push({ from: node, to: neighbor, weight });
        continue;
      }

      // Only report each pair once (A-B, not also B-A)
      const pairKey = [node, neighbor].sort().join("-");
      if (reverseEdge.weight !== weight && !seen.has(pairKey)) {
        seen.add(pairKey);
        weightMismatches.push({
          from: node,
          to: neighbor,
          weightForward: weight,
          weightReverse: reverseEdge.weight,
        });
      }
    }
  }

  return { missingReverse, weightMismatches };
}



/** Finds the shortest path between two nodes using Dijkstra's algorithm.
 *  Returns the total weight and the ordered path, or null if unreachable.
 */
export function dijkstra(
  start: string,
  end: string
): { weight: number; path: string[] } | null {
  if (!graph[start] || !graph[end]) return null;
  if (start === end) return { weight: 0, path: [start] };

  const dist = new Map<string, number>();
  const prev = new Map<string, string>();
  const visited = new Set<string>();

  // Initialise all nodes to infinity
  for (const node of Object.keys(graph)) {
    dist.set(node, Infinity);
  }
  dist.set(start, 0);

  while (true) {
    // Pick the unvisited node with the smallest distance
    let current: string | null = null;
    let smallest = Infinity;
    for (const [node, d] of dist) {
      if (!visited.has(node) && d < smallest) {
        smallest = d;
        current = node;
      }
    }

    if (current === null || current === end) break;

    visited.add(current);

    for (const { neighbor, weight } of graph[current]) {
      if (visited.has(neighbor) || weight === null) continue;

      const alt = smallest + weight;
      if (alt < (dist.get(neighbor) ?? Infinity)) {
        dist.set(neighbor, alt);
        prev.set(neighbor, current);
      }
    }
  }

  const totalWeight = dist.get(end) ?? Infinity;
  if (totalWeight === Infinity) return null;

  // Reconstruct path
  const path: string[] = [];
  let step: string | undefined = end;
  while (step !== undefined) {
    path.unshift(step);
    step = prev.get(step);
  }

  // Apply a 10% reduction for each intermediate stop (nodes between start and end)
  // to account for highway usage on longer journeys
  const intermediateStops = path.length - 2;
  const discount = intermediateStops > 0 ? Math.max(0.7, 1 - 0.10 * intermediateStops) : 1;
  const adjustedWeight = Math.ceil(totalWeight * discount);

  return { weight: adjustedWeight, path };
}

export async function POST(request: NextRequest) {
  const { start, end } = await request.json() as { start: string; end: string };
  const startArea = start.slice(0, -3).trim(); // Remove last 3 chars to get area
  const endArea = end.slice(0, -3).trim(); // Remove last 3 chars to get area

  const result = dijkstra(startArea, endArea);
  return NextResponse.json<{ distance: number | null }>({
    distance: result ? result.weight : null,
  })
};