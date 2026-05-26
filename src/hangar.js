import { store, actions } from './store.js';
import { db } from './database.js';
import { AccountantAgent } from './accounting.js';
import { levels } from './data/levels.js';

export class HangarManager {
    constructor(game) {
        this.game = game;
        this.accountant = new AccountantAgent();
        this.currentMode = 'missions'; // missions | team | pvp
    }

    init() {
        // Hangar screen is shown by default, sector tabs are wired after UI templates load
        this.currentSector = 'frontier';
    }

    setupSectorTabs() {
        const tabs = document.querySelectorAll('.sector-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const sector = e.target.getAttribute('data-sector');
                this.switchSector(sector);
            });
        });
    }

    setupModeTabs() {
        const modeTabs = document.querySelectorAll('.mode-tab');
        if (!modeTabs.length) return;

        modeTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const mode = e.currentTarget.getAttribute('data-mode');
                this.switchMode(mode);
            });
        });

        // Ensure initial visual state
        this.switchMode(this.currentMode || 'missions');
    }

    switchMode(mode) {
        this.currentMode = mode;

        const modeTabs = document.querySelectorAll('.mode-tab');
        modeTabs.forEach(tab => {
            const isActive = tab.getAttribute('data-mode') === mode;
            if (isActive) tab.classList.add('active');
            else tab.classList.remove('active');
        });

        // Refresh level list immediately so button labels / availability
        // reflect the newly selected gameplay mode (Missions / Team / PvP).
        db.getUserStats()
            .then(stats => this.renderLevelList(stats.highScore))
            .catch(e => {
                console.error('Failed to refresh levels after mode switch:', e);
                // Fallback to last known high score in store if DB fails
                const state = store.getState();
                const high = typeof state?.highScore === 'number' ? state.highScore : 0;
                this.renderLevelList(high);
            });
    }

    switchSector(sector) {
        this.currentSector = sector;
        
        // Update tab styles
        const tabs = document.querySelectorAll('.sector-tab');
        tabs.forEach(tab => {
            const isActive = tab.getAttribute('data-sector') === sector;
            if (isActive) tab.classList.add('active');
            else tab.classList.remove('active');
        });
        
        // Reload levels for this sector using latest stats
        db.getUserStats().then(s => this.renderLevelList(s.highScore));
    }

    show() {
        store.dispatch({ type: actions.SET_STATUS, payload: 'menu' });
        const hangar = document.getElementById('hangar-screen');
        if (hangar) hangar.style.display = 'flex';
        
        const hud = document.getElementById('game-hud');
        if (hud) hud.style.display = 'none';
        
        this.loadUserData();
    }

    hide() {
        const hangar = document.getElementById('hangar-screen');
        if (hangar) hangar.style.display = 'none';
    }

    async fetchMissionBriefing(levelName, sector) {
        const briefingMsg = document.getElementById('briefing-msg');
        const briefingPanel = document.getElementById('briefing-panel');
        if (!briefingMsg || !briefingPanel) return;

        briefingPanel.style.display = 'block';
        briefingMsg.innerText = 'CALIBRATING DEPLOYMENT VECTORS...';

        try {
            const systemPrompt = `You are the United Terran Coalition Tactical AI. 
            Generate a short, intense mission briefing (max 40 words) for a pilot deploying to ${levelName} in the ${sector} sector. 
            Focus on high-stakes military sci-fi flavor. Do not use generic greetings.`;

            const completion = await window.websim.chat.completions.create({
                messages: [{ role: "system", content: systemPrompt }]
            });

            briefingMsg.innerText = completion.content;
        } catch (e) {
            briefingMsg.innerText = `INTEL UNAVAILABLE: PROCEED TO ${levelName} WITH CAUTION.`;
        }
    }

    async loadUserData() {
        try {
            const account = await db.getAccount();
            const stats = await db.getUserStats();
            const inventory = await db.getInventory();
            const equipped = await db.getEquipped();
            
            store.dispatch({ type: actions.SET_CREDITS, payload: account.balance });
            store.dispatch({ type: actions.SET_INVENTORY, payload: inventory });
            if (equipped) store.dispatch({ type: actions.SET_EQUIPPED, payload: equipped });
            
            const creditsEl = document.getElementById('menu-credits');
            if (creditsEl) creditsEl.innerText = account.balance.toLocaleString();
            
            const statsEl = document.getElementById('menu-stats');
            if (statsEl) statsEl.innerText = `High Score: ${stats.highScore.toLocaleString()}`;
            
            const marketBalEl = document.getElementById('market-balance');
            if (marketBalEl) marketBalEl.innerText = account.balance.toLocaleString();

            await this.renderPoliticalSummary();
            this.renderLevelList(stats.highScore);
            await this.updateAccountantMessage();
        } catch (e) {
            console.error("Load Data Error", e);
            // Fallback display for offline/error state
            const creditsEl = document.getElementById('menu-credits');
            if (creditsEl) creditsEl.innerText = '0';
            const statsEl = document.getElementById('menu-stats');
            if (statsEl) statsEl.innerText = 'High Score: 0';
        }
    }

    renderLevelList(highScore) {
        const list = document.getElementById('level-list');
        if (!list) return;

        list.innerHTML = '';
        
        // Ensure default sector if none selected
        if (!this.currentSector) this.currentSector = 'frontier';
        
        // Filter levels by current sector from the data file
        const sectorLevels = levels.filter(l => l.sector === this.currentSector);

        sectorLevels.forEach((lvl, idx) => {
            const container = document.createElement('div');
            container.style.cssText = `
                display: flex;
                gap: 16px;
                margin-bottom: ${idx === sectorLevels.length - 1 ? '0' : '12px'};
            `;
            
            const info = document.createElement('div');
            info.style.cssText = 'flex: 1; display: flex; flex-direction: column;';
            
            const difficultyColor = lvl.difficulty === 'Standard' ? '#4ade80' : 
                                   lvl.difficulty === 'Veteran' ? '#fbbf24' : '#ef4444';
            
            info.innerHTML = `
                <span style="font-size: 10px; color: #888; text-transform: uppercase;">Difficulty</span>
                <span style="font-size: 12px; font-weight: bold; color: ${difficultyColor};">${lvl.difficulty}</span>
            `;
            
            const reward = document.createElement('div');
            reward.style.cssText = 'flex: 1; display: flex; flex-direction: column;';
            reward.innerHTML = `
                <span style="font-size: 10px; color: #888; text-transform: uppercase;">Reward</span>
                <span style="font-size: 12px; font-weight: bold; color: #0ff;">${lvl.reward}</span>
            `;
            
            container.appendChild(info);
            container.appendChild(reward);
            
            const btn = document.createElement('button');
            btn.className = 'toggle-btn level-btn'; // Added class for easier styling if needed
            const isUnlocked = highScore >= lvl.threshold;
            
            btn.style.cssText = `
                width: 100%;
                background: ${isUnlocked ? 'rgba(6,249,249,0.9)' : 'rgba(15,35,35,0.4)'};
                color: ${isUnlocked ? '#000' : '#555'};
                border: 1px solid ${isUnlocked ? '#0ff' : '#333'};
                padding: 16px 24px;
                font-size: 16px;
                font-weight: bold;
                letter-spacing: 0.15em;
                text-transform: uppercase;
                transition: all 0.2s;
                box-shadow: ${isUnlocked ? '0 0 15px rgba(6,249,249,0.3)' : 'none'};
                margin-top: 8px;
                cursor: ${isUnlocked ? 'pointer' : 'not-allowed'};
                display: flex;
                align-items: center;
                justify-content: center;
            `;
            
            if (lvl.locked) {
                btn.innerHTML = `
                    <span style="display: flex; align-items: center; justify-content: center; gap: 12px; opacity: 0.5;">
                        <span>⚠️</span>
                        <span>Coming Soon - ${lvl.name}</span>
                    </span>
                `;
                btn.disabled = true;
                btn.style.cursor = 'not-allowed';
            } else if (highScore >= lvl.threshold) {
                const modeLabel = this.currentMode === 'team'
                    ? 'Team Ops'
                    : this.currentMode === 'pvp'
                        ? 'PvP Skirmish'
                        : 'Mission';

                btn.innerHTML = `
                    <span style="display: flex; align-items: center; justify-content: center; gap: 12px;">
                        <span>🚀</span>
                        <span>${modeLabel}: ${lvl.name}</span>
                    </span>
                `;
                btn.onclick = () => {
                    const deployModal = document.getElementById('deployment-modal');
                    // Ensure the modal is visible and show mission title for clarity
                    // Use shared modal helper to show deployment UI
                    toggleModal('deployment-modal', true);
                    // Ensure modal contains a small title element for mission clarity
                    {
                        const dm = document.getElementById('deployment-modal');
                        let titleEl = dm && dm.querySelector('.deployment-title');
                        if (!titleEl && dm) {
                            titleEl = document.createElement('div');
                            titleEl.className = 'deployment-title';
                            titleEl.style.cssText = 'color:#0ff; font-weight:700; font-size:14px; padding:8px 12px; border-bottom:1px solid rgba(6,249,249,0.08);';
                            const header = dm.querySelector('.sci-fi-header') || dm.firstChild;
                            if (header && header.parentNode) header.parentNode.insertBefore(titleEl, header.nextSibling);
                            else dm.prepend(titleEl);
                        }
                        if (titleEl) titleEl.innerText = `${modeLabel}: ${lvl.name}`;
                    }

                    // Trigger briefing while game starts (async)
                    this.fetchMissionBriefing(lvl.name, lvl.sector);

                    // Start the game
                    this.game.startGame(lvl.id, this.currentMode);
                };
            } else {
                btn.innerText = `🔒 Locked - Req ${lvl.threshold} Pts`;
                btn.disabled = true;
                btn.style.cursor = 'not-allowed';
            }
            
            const wrapper = document.createElement('div');
            wrapper.appendChild(container);
            wrapper.appendChild(btn);
            
            list.appendChild(wrapper);
        });
    }

    async renderPoliticalSummary() {
        const container = document.getElementById('hangar-political-list');
        if (!container) return;

        try {
            const standings = await db.getFactionStandings();
            const { FACTIONS, getPoliticalStandingEffect } = await import('./data/factions.js');
            
            container.innerHTML = '';
            
            Object.values(FACTIONS).slice(0, 4).forEach(faction => {
                const val = standings[faction.id] || 0;
                const effect = getPoliticalStandingEffect(val);
                const color = faction.color;
                
                const row = document.createElement('div');
                row.className = 'flex justify-between items-center';
                row.innerHTML = `
                    <span style="color: ${color}">${faction.name.split(' ').pop().toUpperCase()}</span>
                    <span class="text-white">${val > 0 ? '+' : ''}${val} <span style="font-size:8px; opacity:0.5">[${effect.label.toUpperCase()}]</span></span>
                `;
                container.appendChild(row);
            });
        } catch (e) {
            console.error("Political summary fail", e);
        }
    }

    async updateAccountantMessage() {
        try {
            const report = await this.accountant.generateReport();
            const accountantMsg = document.getElementById('accountant-msg');
            if (accountantMsg) {
                accountantMsg.innerText = `[LEDGER]: "${report}"`;
            }
        } catch (e) {
            console.error("Accountant error", e);
            const accountantMsg = document.getElementById('accountant-msg');
            if (accountantMsg) {
                accountantMsg.innerText = 'Ledger System Offline';
            }
        }
    }
}