/**
 * Levels Database
 * Schema: ID | SECTOR | NAME | THRESHOLD | DIFFICULTY | REWARD | TYPE (OPTIONAL)
 */

export const levels = [
    // SECTOR: FRONTIER
    { 
        id: 1, 
        sector: 'frontier', 
        name: "Sector Alpha", 
        threshold: 0, 
        difficulty: "Standard", 
        reward: "500 CR" 
    },
    { 
        id: 2, 
        sector: 'frontier', 
        name: "Saturn Belt", 
        threshold: 1500, 
        difficulty: "Veteran", 
        reward: "1500 CR" 
    },
    { 
        id: 3, 
        sector: 'frontier', 
        name: "Black Hole", 
        threshold: 3000, 
        difficulty: "Elite", 
        reward: "3000 CR" 
    },

    // SECTOR: DEEP SPACE
    { 
        id: 4, 
        sector: 'deep-space', 
        name: "Crimson Void", 
        threshold: 5000, 
        difficulty: "Legendary", 
        reward: "5000 CR" 
    },
    { 
        id: 5, 
        sector: 'deep-space', 
        name: "Crystal Expanse", 
        threshold: 7500, 
        difficulty: "Extreme", 
        reward: "10000 CR" 
    },
    { 
        id: 6, 
        sector: 'deep-space', 
        name: "Quantum Storm", 
        threshold: 10000, 
        difficulty: "Extreme", 
        reward: "15000 CR" 
    },

    // SECTOR: THE VOID
    { 
        id: 7, 
        sector: 'void', 
        name: "Singularity Edge", 
        threshold: 15000, 
        difficulty: "Impossible", 
        reward: "25000 CR" 
    },
    { 
        id: 8, 
        sector: 'void', 
        name: "Event Horizon", 
        threshold: 20000, 
        difficulty: "Impossible", 
        reward: "40000 CR" 
    },

    // SECTOR: EXPERIMENTAL
    { 
        id: 9, 
        sector: 'experimental', 
        name: "Nexus Arena", 
        threshold: 25000, 
        difficulty: "Classified", 
        reward: "60000 CR" 
    },
    { 
        id: 10, 
        sector: 'experimental', 
        name: "Omega Protocol", 
        threshold: 50000, 
        difficulty: "Classified", 
        reward: "100000 CR" 
    },

    // SECTOR: BLACK OPS
    { 
        id: 11, 
        sector: 'black-ops', 
        name: "Cyber Core", 
        threshold: 75000, 
        difficulty: "Inhuman", 
        reward: "150000 CR" 
    },
    { 
        id: 12, 
        sector: 'black-ops', 
        name: "Solar Flare", 
        threshold: 100000, 
        difficulty: "Inferno", 
        reward: "250000 CR" 
    },
    { 
        id: 13, 
        sector: 'black-ops', 
        name: "Derelict Station", 
        threshold: 150000, 
        difficulty: "Nightmare", 
        reward: "500000 CR" 
    },

    // SECTOR: ANCIENT RUINS
    { 
        id: 14, 
        sector: 'ancient-ruins', 
        name: "Temple of Sol", 
        threshold: 200000, 
        difficulty: "Ancient", 
        reward: "750000 CR" 
    },
    { 
        id: 15, 
        sector: 'ancient-ruins', 
        name: "Emerald City", 
        threshold: 350000, 
        difficulty: "Mythic", 
        reward: "1000000 CR" 
    },
    { 
        id: 16, 
        sector: 'ancient-ruins', 
        name: "Stargate Nexus", 
        threshold: 500000, 
        difficulty: "Divine", 
        reward: "2500000 CR" 
    },

    // SECTOR: DOGFIGHT (PvP / PvAI)
    { 
        id: 90, 
        sector: 'dogfight', 
        name: "Drone Simulation", 
        threshold: 0, 
        difficulty: "Training", 
        reward: "500 CR", 
        type: "pvai" 
    },
    { 
        id: 91, 
        sector: 'dogfight', 
        name: "Ace Dogfight", 
        threshold: 5000, 
        difficulty: "Hardcore", 
        reward: "5000 CR", 
        type: "pvai" 
    },
    { 
        id: 92, 
        sector: 'dogfight', 
        name: "Live Fire Arena", 
        threshold: 1000, 
        difficulty: "PvP", 
        reward: "Bounty", 
        type: "pvp" 
    },
    { 
        id: 93, 
        sector: 'dogfight', 
        name: "Elite Squadron", 
        threshold: 7500, 
        difficulty: "Extreme", 
        reward: "7500 CR", 
        type: "pvai" 
    },
    { 
        id: 94, 
        sector: 'dogfight', 
        name: "Endless Swarm", 
        threshold: 10000, 
        difficulty: "Survival", 
        reward: "10000 CR", 
        type: "pvai" 
    }
];