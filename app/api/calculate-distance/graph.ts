type Graph = {
    [node: string]: Array<{
        neighbor: string;
        weight: number | null;
    }>;
};

const postcodes: Set<string> = new Set([
    "G51", "G52", "G53", "G46", "G43",
    "G41", "G42", "G44", "G45", "G73",
    "G5", "G11", "G12", "G22", "G20",
    "G21", "G31", "G32", "G33", "G34",
    "G69", "G71", "G72", "G74", "G75", 
    "G40", "G1", "G2", "G3", "G4", 
    "ML3", "ML1", "ML4", "ML5" // Motherwell
]);

const graph: Graph = {
    G51: [
        { neighbor: "G52", weight: 6 },
        { neighbor: "G11", weight: 5 },
        { neighbor: "G3", weight: 10 },
        { neighbor: "G5", weight: 12 },
        { neighbor: "G41", weight: 11 },
    ],
    G52: [
        { neighbor: "G51", weight: 6 },
        { neighbor: "G53", weight: 11 },
        { neighbor: "G41", weight: 9 },
        { neighbor: "G43", weight: 12 },
    ],
    G53: [
        { neighbor: "G52", weight: 11 },
        { neighbor: "G46", weight: 11 },
        { neighbor: "G43", weight: 8 },
        { neighbor: "G41", weight: 11 },
    ],
    G46: [
        { neighbor: "G53", weight: 11 },
        { neighbor: "G43", weight: 6 },
        { neighbor: "G44", weight: 11 },
    ],
    G43: [
        { neighbor: "G52", weight: 12 },
        { neighbor: "G53", weight: 8 },
        { neighbor: "G46", weight: 6 },
        { neighbor: "G44", weight: 7 },
        { neighbor: "G41", weight: 7 },
        { neighbor: "G42", weight: 10 },
    ],
    G41: [
        { neighbor: "G51", weight: 11 },
        { neighbor: "G52", weight: 9 },
        { neighbor: "G53", weight: 11 },
        { neighbor: "G43", weight: 7 },
        { neighbor: "G42", weight: 7 },
        { neighbor: "G5", weight: 8 },
    ],
    G42: [
        { neighbor: "G41", weight: 7 },
        { neighbor: "G43", weight: 10 },
        { neighbor: "G44", weight: 6 },
        { neighbor: "G73", weight: 10 },
        { neighbor: "G5", weight: 5 },
        { neighbor: "G40", weight: 11 },
    ],
    G44: [
        { neighbor: "G43", weight: 7 },
        { neighbor: "G42", weight: 6 },
        { neighbor: "G46", weight: 11 },
        { neighbor: "G45", weight: 7 },
        { neighbor: "G42", weight: 6 },
        { neighbor: "G73", weight: 8 },
    ],
    G45: [
        { neighbor: "G44", weight: 7 },
        { neighbor: "G73", weight: 9 },
        { neighbor: "G72", weight: 14 },
        { neighbor: "G74", weight: 12 },
    ],
    G73: [
        { neighbor: "G72", weight: 10 },
        { neighbor: "G45", weight: 9 },
        { neighbor: "G44", weight: 8 },
        { neighbor: "G42", weight: 10 },
        { neighbor: "G5", weight: 7 },
        { neighbor: "G40", weight: 6 },
        { neighbor: "G32", weight: 10 }        
    ],
    G5: [
        { neighbor: "G51", weight: 12 },
        { neighbor: "G41", weight: 8 },
        { neighbor: "G42", weight: 5 },
        { neighbor: "G73", weight: 7 },
        { neighbor: "G40", weight: 6 },
        { neighbor: "G1", weight: 7 },
        { neighbor: "G2", weight: 9 },
        { neighbor: "G3", weight: 8 },
    ],
    G11: [
        { neighbor: "G51", weight: 5 },
        { neighbor: "G3", weight: 8 },
        { neighbor: "G12", weight: 6 },
    ],
    G12: [
        { neighbor: "G11", weight: 6 },
        { neighbor: "G20", weight: 6 },
        { neighbor: "G3", weight: 10 },
    ],
    G20: [
        { neighbor: "G12", weight: 6 },
        { neighbor: "G4", weight: 10 },
        { neighbor: "G3", weight: 10 },
        { neighbor: "G22", weight: 7 },
    ],
    G22: [
        { neighbor: "G20", weight: 7 },
        { neighbor: "G21", weight: 5 },
        { neighbor: "G4", weight: 7 },
    ],
    G21: [
        { neighbor: "G22", weight: 5 },
        { neighbor: "G4", weight: 7 },
        { neighbor: "G31", weight: 10 },
        { neighbor: "G33", weight: 10 },
    ],
    G31: [
        { neighbor: "G40", weight: null },
        { neighbor: "G1", weight: null },
        { neighbor: "G4", weight: null },
        { neighbor: "G21", weight: 10 },
        { neighbor: "G33", weight: null },
        { neighbor: "G32", weight: null },
    ],
    G32: [
        { neighbor: "G31", weight: null },
        { neighbor: "G33", weight: null },
        { neighbor: "G34", weight: null },
        { neighbor: "G69", weight: null },
        { neighbor: "G71", weight: null },
        { neighbor: "G72", weight: null },
        { neighbor: "G73", weight: 10 },
        { neighbor: "G40", weight: null },
    ],
    G33: [
        { neighbor: "G21", weight: 10 },
        { neighbor: "G31", weight: null },
        { neighbor: "G32", weight: null },
        { neighbor: "G34", weight: null },
        { neighbor: "G69", weight: null },
    ],
    G34: [
        { neighbor: "G33", weight: null },
        { neighbor: "G32", weight: null },
        { neighbor: "G69", weight: null },
        { neighbor: "ML5", weight: null },
    ],
    G69: [
        { neighbor: "G34", weight: null },
        { neighbor: "G33", weight: null },
        { neighbor: "G32", weight: null },
        { neighbor: "ML5", weight: null },
        { neighbor: "G71", weight: null },
    ],
    G71: [
        { neighbor: "G69", weight: null },
        { neighbor: "G34", weight: null },
        { neighbor: "G32", weight: null },
        { neighbor: "G72", weight: null },
        { neighbor: "ML4", weight: null },
        { neighbor: "ML5", weight: null },
    ],
    G72: [
        { neighbor: "G74", weight: null },
        { neighbor: "G73", weight: 10 },
        { neighbor: "G32", weight: null },
        { neighbor: "G71", weight: null },
        { neighbor: "ML3", weight: null },
    ],
    G74: [
        { neighbor: "G72", weight: null },
        { neighbor: "G75", weight: null },
        { neighbor: "G73", weight: null },
        { neighbor: "G45", weight: 12 },
        { neighbor: "ML3", weight: null },
    ],
    G75: [
        { neighbor: "G74", weight: null },
        { neighbor: "ML3", weight: null },
    ],

    G40: [
        { neighbor: "G42", weight: 11 },
        { neighbor: "G73", weight: 6 },
        { neighbor: "G31", weight: null },
        { neighbor: "G1", weight: null },
        { neighbor: "G5", weight: null },
        { neighbor: "G32", weight: null },
    ],
    G1: [
        { neighbor: "G40", weight: null },
        { neighbor: "G5", weight: 7 },
        { neighbor: "G2", weight: 9 },
        { neighbor: "G4", weight: null },
        { neighbor: "G31", weight: null },
    ],
    G2: [
        { neighbor: "G1", weight: 9 },
        { neighbor: "G3", weight: 5 },
        { neighbor: "G4", weight: 9 },
        { neighbor: "G5", weight: 9 },
    ],
    G3: [
        { neighbor: "G51", weight: 5 },
        { neighbor: "G2", weight: 5 },
        { neighbor: "G5", weight: 8 },
        { neighbor: "G4", weight: null },
        { neighbor: "G20", weight: 10 },
        { neighbor: "G12", weight: 10 },
        { neighbor: "G11", weight: 8 },
    ],
    G4: [
        { neighbor: "G1", weight: null },
        { neighbor: "G2", weight: 9 },
        { neighbor: "G3", weight: null },
        { neighbor: "G20", weight: 10 },
        { neighbor: "G22", weight: 7 },
        { neighbor: "G21", weight: 7 },
        { neighbor: "G31", weight: null },
        { neighbor: "G40", weight: null },
    ],

    ML3: [
        { neighbor: "G75", weight: null },
        { neighbor: "G74", weight: null },
        { neighbor: "G72", weight: null },
        { neighbor: "G71", weight: null },
        { neighbor: "ML4", weight: null },
        { neighbor: "ML1", weight: null },
    ],
    ML1: [
        { neighbor: "ML5", weight: null },
        { neighbor: "ML4", weight: null },
        { neighbor: "ML3", weight: null },
        { neighbor: "G71", weight: null },
    ],
    ML4: [
        { neighbor: "ML5", weight: null },
        { neighbor: "ML1", weight: null },
        { neighbor: "ML3", weight: null },
        { neighbor: "G71", weight: null },
    ],
    ML5: [
        { neighbor: "G34", weight: null },
        { neighbor: "G69", weight: null },
        { neighbor: "G71", weight: null },
        { neighbor: "ML1", weight: null },
        { neighbor: "ML4", weight: null },
        { neighbor: "ML3", weight: null },
    ]
};

export default graph;