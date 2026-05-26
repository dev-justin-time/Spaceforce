// Database abstraction layer for persistent storage
// Acts as our structured data store "file"

export class Database {
    constructor() {
        this.socket = new WebsimSocket();
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;
        await this.socket.initialize();
        this.initialized = true;
    }

    /**
     * Save a completed game session
     * @param {Object} sessionData - { score, shotsFired, etc }
     */
    async saveSession(sessionData) {
        if (!this.initialized) await this.init();
        
        try {
            // Store in 'game_sessions' collection (table)
            const record = await this.socket.collection('game_sessions').create({
                ...sessionData,
                client_version: '1.0.0',
                platform: navigator.platform
            });
            console.log('Session saved to DB:', record.id);
            return record;
        } catch (e) {
            console.error('Database Write Error:', e);
            throw e;
        }
    }

    /**
     * Get aggregated metrics for the current user
     */
    async getUserStats() {
        if (!this.initialized) await this.init();
        
        const sessions = await this.socket.collection('game_sessions').getList();
        const currentUser = await window.websim.getCurrentUser();
        
        // Filter for current user manually to be safe
        const mySessions = sessions.filter(s => s.username === currentUser.username);

        const stats = {
            totalGames: mySessions.length,
            totalScore: 0,
            highScore: 0,
            totalKills: 0
        };

        mySessions.forEach(s => {
            stats.totalScore += (s.score || 0);
            stats.highScore = Math.max(stats.highScore, s.score || 0);
            stats.totalKills += (s.enemiesDestroyed || 0);
        });

        return stats;
    }

    async getAllScores() {
        if (!this.initialized) await this.init();
        
        try {
            const sessions = await this.socket.collection('game_sessions').getList();
            if (!sessions || !sessions.length) {
                return [];
            }
            
            // Group by username and get best score for each
            const userScores = new Map();
            
            sessions.forEach(s => {
                if (typeof s.score !== 'number') return;
                const existing = userScores.get(s.username);
                if (!existing || s.score > existing.score) {
                    userScores.set(s.username, {
                        username: s.username,
                        score: s.score
                    });
                }
            });
            
            // Convert to array and sort by score descending
            return Array.from(userScores.values())
                .sort((a, b) => b.score - a.score);
        } catch (e) {
            console.error('Failed to load scores:', e);
            return [];
        }
    }

    // --- ECONOMY & MARKET ---

    async getAccount() {
        if (!this.initialized) await this.init();
        const currentUser = await window.websim.getCurrentUser();
        
        // Find existing account
        const accounts = await this.socket.collection('accounts').filter({ username: currentUser.username }).getList();
        
        if (accounts.length > 0) {
            return accounts[0];
        } else {
            // Create new account
            return await this.socket.collection('accounts').create({
                username: currentUser.username,
                balance: 100 // Starting bonus
            });
        }
    }

    async addTransaction(type, amount, description) {
        if (!this.initialized) await this.init();
        const account = await this.getAccount();
        
        // Update balance
        const newBalance = Math.max(0, account.balance + amount);
        await this.socket.collection('accounts').update(account.id, {
            balance: newBalance
        });

        // Log transaction
        await this.socket.collection('transactions').create({
            account_id: account.id,
            username: account.username,
            type,
            amount,
            description,
            timestamp: Date.now()
        });

        return newBalance;
    }

    async getTransactions() {
        if (!this.initialized) await this.init();
        const account = await this.getAccount();
        const txs = await this.socket.collection('transactions').filter({ account_id: account.id }).getList();
        return txs.sort((a,b) => b.timestamp - a.timestamp); // Newest first
    }

    async getInventory() {
        if (!this.initialized) await this.init();
        const currentUser = await window.websim.getCurrentUser();
        return await this.socket.collection('inventory').filter({ username: currentUser.username }).getList();
    }

    async getMarketListings() {
        if (!this.initialized) await this.init();
        try {
            // Return all active listings; ensure consistent ordering (newest first)
            const raw = await this.socket.collection('market_listings_v2').filter({ active: true }).getList();
            if (!raw || raw.length === 0) return [];
            // Normalize records and sort by listed_at desc for predictable UI behavior
            const normalized = raw.map(r => ({
                id: r.id,
                seller: r.seller,
                seller_id: r.seller_id,
                item_data: r.item_data,
                price: r.price,
                active: !!r.active,
                listed_at: r.listed_at || 0,
                original_item_id: r.original_item_id || null
            }));
            normalized.sort((a, b) => (b.listed_at || 0) - (a.listed_at || 0));
            return normalized;
        } catch (e) {
            console.error('Failed to load market listings:', e);
            return [];
        }
    }

    /**
     * Subscribe to real-time market updates
     */
    subscribeMarketListings(callback) {
        return this.socket.collection('market_listings_v2').filter({ active: true }).subscribe(callback);
    }

    async createListing(itemId, price) {
        if (!this.initialized) await this.init();
        
        try {
            // NOTE: Websim collections cannot filter directly by the auto-generated `id`,
            // so we fetch the user's inventory and locate the matching record client-side.
            const allItems = await this.socket.collection('inventory').getList();
            const inventoryItem = allItems.find(i => i.id === itemId);
            
            if (!inventoryItem) {
                throw new Error("Item not found in inventory");
            }
            
            // Create listing with v2 schema
            await this.socket.collection('market_listings_v2').create({
                seller: inventoryItem.username,
                item_data: inventoryItem.item_data,
                price: parseInt(price),
                active: true,
                original_item_id: itemId,
                listed_at: Date.now()
            });
            
            // Remove from inventory (escrow)
            await this.socket.collection('inventory').delete(itemId);
        } catch (e) {
            console.error('Failed to create listing:', e);
            throw e;
        }
    }

    async seedMarket() {
        if (!this.initialized) await this.init();
        
        try {
            const { militarySystems } = await import('./data/items.js');
            const { FACTIONS } = await import('./data/factions.js');
            const factions = Object.values(FACTIONS);
            
            // Seed 8-12 random systems
            const numToSeed = 8 + Math.floor(Math.random() * 5);
            const shuffled = [...militarySystems].sort(() => Math.random() - 0.5);
            
            for (let i = 0; i < numToSeed; i++) {
                const item = shuffled[i];
                const basePrice = 150 + (i * 50);
                const variation = Math.floor(Math.random() * 100);

                const classification = (item.classification || '').toUpperCase();
                const category = (item.category || '').toLowerCase();
                let priceMultiplier = 1;

                if (classification === 'TOP SECRET' || category.includes('ancient')) {
                    priceMultiplier = 4;
                } else if (category.includes('orbital') || category.includes('heavy')) {
                    priceMultiplier = 2;
                }

                const finalPrice = (basePrice + variation) * priceMultiplier;
                const randomFaction = factions[Math.floor(Math.random() * factions.length)];
                
                await this.socket.collection('market_listings_v2').create({
                    seller: randomFaction.name + " R&D",
                    seller_id: randomFaction.id,
                    item_data: item,
                    price: finalPrice,
                    active: true,
                    original_item_id: "sys_" + Date.now() + "_" + i,
                    listed_at: Date.now()
                });
            }
        } catch (e) {
            console.error('Failed to seed market:', e);
        }
    }

    async getFactionStandings() {
        if (!this.initialized) await this.init();
        const user = await window.websim.getCurrentUser();
        const records = await this.socket.collection('faction_standings').filter({ username: user.username }).getList();
        
        if (records.length > 0) return records[0].data;
        
        // Initial defaults
        const defaults = { spaceforce: 10, asgardian: 0, helix: -5, dsi: 0, crimson: -50 };
        await this.socket.collection('faction_standings').create({
            username: user.username,
            data: defaults
        });
        return defaults;
    }

    async updateFactionStanding(factionId, amount) {
        if (!this.initialized) await this.init();
        const user = await window.websim.getCurrentUser();
        const records = await this.socket.collection('faction_standings').filter({ username: user.username }).getList();
        
        if (records.length > 0) {
            const data = records[0].data || {};
            data[factionId] = Math.max(-100, Math.min(100, (data[factionId] || 0) + amount));
            
            // Domino effects: Helping one might hurt another
            const { FACTIONS } = await import('./data/factions.js');
            const fac = FACTIONS[factionId];
            if (fac) {
                fac.enemies.forEach(enemyId => {
                    data[enemyId] = Math.max(-100, Math.min(100, (data[enemyId] || 0) - (amount * 0.5)));
                });
                fac.allies.forEach(allyId => {
                    data[allyId] = Math.max(-100, Math.min(100, (data[allyId] || 0) + (amount * 0.3)));
                });
            }

            await this.socket.collection('faction_standings').update(records[0].id, { data });
            return data;
        }
    }

    async saveEquipped(equipped) {
        if (!this.initialized) await this.init();
        const user = await window.websim.getCurrentUser();
        const records = await this.socket.collection('equipped_config').filter({ username: user.username }).getList();
        
        if (records.length > 0) {
            await this.socket.collection('equipped_config').update(records[0].id, { config: equipped });
        } else {
            await this.socket.collection('equipped_config').create({ username: user.username, config: equipped });
        }
    }

    async getEquipped() {
        if (!this.initialized) await this.init();
        const user = await window.websim.getCurrentUser();
        const records = await this.socket.collection('equipped_config').filter({ username: user.username }).getList();
        return records.length > 0 ? records[0].config : null;
    }

    async saveSubFaction(subData) {
        if (!this.initialized) await this.init();
        const user = await window.websim.getCurrentUser();
        const records = await this.socket.collection('user_subfaction').filter({ username: user.username }).getList();
        if (records.length > 0) {
            await this.socket.collection('user_subfaction').update(records[0].id, { data: subData });
        } else {
            await this.socket.collection('user_subfaction').create({ username: user.username, data: subData });
        }
    }

    async getSubFaction() {
        if (!this.initialized) await this.init();
        const user = await window.websim.getCurrentUser();
        const records = await this.socket.collection('user_subfaction').filter({ username: user.username }).getList();
        return records.length > 0 ? records[0].data : null;
    }

    async purchaseListing(listingId) {
        if (!this.initialized) await this.init();
        
        try {
            // Get listing
            // NOTE: Cannot filter by `id` on the backend, so fetch and resolve locally.
            const allListings = await this.socket.collection('market_listings_v2').getList();
            const listing = allListings.find(l => l.id === listingId);
            
            if (!listing || !listing.active) {
                throw new Error("Listing unavailable or already sold");
            }

            const buyerAccount = await this.getAccount();
            
            if (buyerAccount.balance < listing.price) {
                throw new Error("Insufficient funds");
            }

            // 1. Deduct from buyer
            await this.addTransaction('spend', -listing.price, `Purchased ${listing.item_data?.name || 'item'}`);

            // 2. Add to seller account (if not system)
            if (listing.seller !== "System Supply") {
                const sellerAccounts = await this.socket.collection('accounts').filter({ username: listing.seller }).getList();
                if (sellerAccounts.length > 0) {
                    const sellerAcct = sellerAccounts[0];
                    await this.socket.collection('accounts').update(sellerAcct.id, {
                        balance: sellerAcct.balance + listing.price
                    });
                }
            }

            // 3. Add to buyer inventory
            await this.socket.collection('inventory').create({
                username: buyerAccount.username,
                item_data: listing.item_data,
                acquired_at: Date.now()
            });

            // 4. Mark listing as inactive (soft delete for record keeping)
            await this.socket.collection('market_listings_v2').update(listing.id, {
                active: false,
                sold_at: Date.now(),
                buyer: buyerAccount.username
            });
            
            return true;
        } catch (e) {
            console.error('Purchase failed:', e);
            throw e;
        }
    }
}

export const db = new Database();