/**
 * Faction & Sub-Faction Database with Political Mechanics
 *
 * Extended with gamification fields:
 * - gamification: { bountyMultiplier, marketMultiplier, spawnModifier }
 * These allow UI & gameplay systems to derive rewards/penalties from standings.
 */

export const FACTIONS = {
    spaceforce: {
        id: 'spaceforce',
        name: 'United Terran SpaceForce',
        icon: '🛡️',
        description: 'The official military arm of the Terran Coalition. Focuses on order and orbital safety.',
        color: '#06f9f9',
        allies: ['dsi', 'atlantic'],
        enemies: ['crimson', 'draconian'],
        subFactions: [
            { id: 'orbital_guard', name: 'Orbital Guard', specialty: 'Planetary Defense', perk: '20% Shield Recharge' },
            { id: 'frontier_scouts', name: 'Frontier Scouts', specialty: 'Long Range Recon', perk: '15% Speed Boost' }
        ],
        benefits: 'Access to military-grade hulls and discounted repairs at HQ.',
        risks: 'Strict engagement protocols; loss of standing for attacking neutrals.',
        // Expanded gamification tuning for downstream systems
        gamification: {
            bountyMultiplier: 1.0,
            marketMultiplier: 1.0,
            spawnModifier: 0.0,
            rewardMultiplier: 1.0,    // scales mission rewards when allied
            spawnBias: 0.0,           // additional bias for faction spawn weighting
            priceBias: 0.0,           // applied as percent to market prices when interacting
            reputationDecay: 0.01     // per-minute passive decay of reputation
        }
    },
    asgardian: {
        id: 'asgardian',
        name: 'Asgardian Vanguard',
        icon: '⚡',
        description: 'A heavy-weapons conglomerate focused on kinetic superiority and ancient Norse tradition.',
        color: '#fbbf24',
        allies: ['atlantic'],
        enemies: ['helix', 'draconian'],
        subFactions: [
            { id: 'valkyrie_corps', name: 'Valkyrie Corps', specialty: 'Precision Strikes', perk: '25% Secondary Damage' },
            { id: 'einherjar_heavy', name: 'Einherjar Heavy', specialty: 'Capital Sieges', perk: '20% Armor Integrity' }
        ],
        benefits: 'Deep discounts on Heavy/Kinetic systems.',
        risks: 'Targeted by Helix Syndicate hackers and Draconian hunters.',
        gamification: {
            bountyMultiplier: 1.1,
            marketMultiplier: 0.95,
            spawnModifier: 0.05,
            rewardMultiplier: 1.05,
            spawnBias: 0.04,
            priceBias: -0.05,
            reputationDecay: 0.012
        }
    },
    helix: {
        id: 'helix',
        name: 'Helix Syndicate',
        icon: '🐍',
        description: 'Trans-stellar corporate entity specializing in biotech, cybernetics, and EW.',
        color: '#22c55e',
        allies: ['crimson'],
        enemies: ['dsi', 'asgardian'],
        subFactions: [
            { id: 'neuro_lab', name: 'Neuro-Link Lab', specialty: 'Pilot Augmentation', perk: '15% Fire Rate' },
            { id: 'shadow_runners', name: 'Shadow Runners', specialty: 'Corporate Sabotage', perk: '30% Jamming Radius' }
        ],
        benefits: 'Exclusive access to experimental AI command buffers.',
        risks: 'Legal pursuit by DSI; higher black market prices due to notoriety.',
        gamification: {
            bountyMultiplier: 1.2,
            marketMultiplier: 1.15,
            spawnModifier: -0.05,
            rewardMultiplier: 1.15,
            spawnBias: -0.02,
            priceBias: 0.12,
            reputationDecay: 0.02
        }
    },
    dsi: {
        id: 'dsi',
        name: 'Deep Space Intelligence',
        icon: '👁️',
        description: 'The Coalition intelligence agency. Operates in the shadows to prevent systemic collapse.',
        color: '#a855f7',
        allies: ['spaceforce'],
        enemies: ['helix', 'crimson'],
        subFactions: [
            { id: 'ghost_unit', name: 'Ghost Unit', specialty: 'Infiltration', perk: '40% Radar Stealth' },
            { id: 'oracle_net', name: 'Oracle Network', specialty: 'Predictive Analysis', perk: '15% Auto-Evasion' }
        ],
        benefits: 'Early warning of threat spawns; identifies elite bounties.',
        risks: 'Disliked by corporate entities; often assigned "suicide" intel missions.',
        gamification: {
            bountyMultiplier: 1.05,
            marketMultiplier: 1.0,
            spawnModifier: -0.1,
            rewardMultiplier: 1.02,
            spawnBias: -0.08,
            priceBias: 0.0,
            reputationDecay: 0.008
        }
    },
    crimson: {
        id: 'crimson',
        name: 'The Crimson Void',
        icon: '🏴‍☠️',
        description: 'A lawless collection of pirates, deserters, and rim-world rebels.',
        color: '#ef4444',
        allies: ['helix'],
        enemies: ['spaceforce', 'dsi', 'asgardian', 'atlantic'],
        subFactions: [
            { id: 'void_raiders', name: 'Void Raiders', specialty: 'Hit and Run', perk: '50% Loot Bonus' },
            { id: 'iron_sabres', name: 'Iron Sabres', specialty: 'Mercenary Ops', perk: '20% Primary Damage' }
        ],
        benefits: 'Highest sell prices for salvaged gear; no regulations.',
        risks: 'Bounty hunters from all other factions will spawn regularly.',
        gamification: {
            bountyMultiplier: 1.5,
            marketMultiplier: 1.4,
            spawnModifier: 0.25,
            rewardMultiplier: 1.4,
            spawnBias: 0.25,
            priceBias: 0.35,
            reputationDecay: 0.03
        }
    },
    atlantic: {
        id: 'atlantic',
        name: 'Atlantic Federation',
        icon: '🌎',
        description: 'Civilian federation focusing on trade, logistics and humanitarian corridors.',
        color: '#3b82f6',
        allies: ['spaceforce', 'asgardian'],
        enemies: ['crimson'],
        subFactions: [
            { id: 'merchant_guild', name: 'Merchant Guild', specialty: 'Trade', perk: '10% Market Prices' },
            { id: 'civ_defense', name: 'Civil Defense', specialty: 'Escort', perk: '10% Shield Support' }
        ],
        benefits: 'Stable markets and lower repair costs at civilian docks.',
        risks: 'Limited access to black ops hardware.',
        gamification: {
            bountyMultiplier: 0.9,
            marketMultiplier: 0.9,
            spawnModifier: -0.05,
            rewardMultiplier: 0.95,
            spawnBias: -0.03,
            priceBias: -0.1,
            reputationDecay: 0.005
        }
    },
    builders: {
        id: 'builders',
        name: 'Ancient Builders',
        icon: '🏛️',
        description: 'Mysterious precursor custodians; control relic caches and prototype artifacts.',
        color: '#ffffff',
        allies: [],
        enemies: [],
        subFactions: [
            { id: 'archon_custodians', name: 'Archon Custodians', specialty: 'Relic Safeguard', perk: 'Unlocks Precursor Codex' }
        ],
        benefits: 'Access to rare artifacts; occasional event missions yield massive score bonuses.',
        risks: 'Relic hunts attract all factions.',
        gamification: {
            bountyMultiplier: 2.0,
            marketMultiplier: 3.0,
            spawnModifier: 0.5,
            rewardMultiplier: 3.0,
            spawnBias: 0.5,
            priceBias: 2.0,
            reputationDecay: 0.001
        }
    }
};

export function getPoliticalStandingEffect(standing) {
    // Returns label, discount, threat and actionable gamification multipliers
    // (bountyMultiplier: adjusts rewards, marketMultiplier: affects seller/buyer prices, spawnModifier: changes chance of hostile hit-squads)
    if (standing > 75) {
        return {
            label: 'Exalted',
            discount: 0.30,
            threat: 0.0,
            gamification: { bountyMultiplier: 1.5, marketMultiplier: 0.85, spawnModifier: -0.25 }
        };
    }
    if (standing > 25) {
        return {
            label: 'Friendly',
            discount: 0.10,
            threat: 0.05,
            gamification: { bountyMultiplier: 1.2, marketMultiplier: 0.95, spawnModifier: -0.1 }
        };
    }
    if (standing > -25) {
        return {
            label: 'Neutral',
            discount: 0.0,
            threat: 0.10,
            gamification: { bountyMultiplier: 1.0, marketMultiplier: 1.0, spawnModifier: 0.0 }
        };
    }
    if (standing > -75) {
        return {
            label: 'Unfriendly',
            discount: -0.20,
            threat: 0.30,
            gamification: { bountyMultiplier: 0.9, marketMultiplier: 1.1, spawnModifier: 0.2 }
        };
    }
    return {
        label: 'Hostile',
        discount: -0.50,
        threat: 0.60,
        gamification: { bountyMultiplier: 0.7, marketMultiplier: 1.4, spawnModifier: 0.5 }
    };
}