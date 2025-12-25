// UI system

class UIManager {
    constructor() {
        this.setupEventListeners();
        this.cursorTransparency = 50;
        this.autoAttack = true;
        this.screenShake = true;
    }

    setupEventListeners() {
        // Main menu
        document.getElementById('start-btn').addEventListener('click', () => {
            this.hideMenu('main-menu');
            this.showHUD();
            if (window.game) {
                window.game.startGame();
            }
        });

        document.getElementById('options-btn').addEventListener('click', () => {
            this.hideMenu('main-menu');
            this.showMenu('options-menu');
        });

        // Options menu
        document.getElementById('back-btn').addEventListener('click', () => {
            this.hideMenu('options-menu');
            this.showMenu('main-menu');
        });

        const cursorSlider = document.getElementById('cursor-transparency');
        const cursorValue = document.getElementById('cursor-transparency-value');
        cursorSlider.addEventListener('input', (e) => {
            this.cursorTransparency = parseInt(e.target.value);
            cursorValue.textContent = this.cursorTransparency + '%';
            this.updateCursor();
        });

        document.getElementById('auto-attack').addEventListener('change', (e) => {
            this.autoAttack = e.target.checked;
            if (window.game && window.game.player) {
                window.game.player.autoAttack = this.autoAttack;
            }
        });

        document.getElementById('screen-shake').addEventListener('change', (e) => {
            this.screenShake = e.target.checked;
        });

        // Pause menu
        document.getElementById('resume-btn').addEventListener('click', () => {
            this.hideMenu('pause-menu');
            if (window.game) {
                window.game.resume();
            }
        });

        document.getElementById('main-menu-btn').addEventListener('click', () => {
            this.hideMenu('pause-menu');
            this.showMenu('main-menu');
            this.hideHUD();
            if (window.game) {
                window.game.reset();
            }
        });

        // Game over menu
        document.getElementById('restart-btn').addEventListener('click', () => {
            this.hideMenu('game-over-menu');
            this.showHUD();
            if (window.game) {
                window.game.startGame();
            }
        });

        document.getElementById('main-menu-btn-2').addEventListener('click', () => {
            this.hideMenu('game-over-menu');
            this.showMenu('main-menu');
            this.hideHUD();
            if (window.game) {
                window.game.reset();
            }
        });

        // Shop menu
        document.getElementById('close-shop-btn').addEventListener('click', () => {
            this.hideMenu('shop-menu');
            if (window.game) {
                window.game.resume();
            }
        });
    }

    showMenu(menuId) {
        document.getElementById(menuId).classList.remove('hidden');
    }

    hideMenu(menuId) {
        document.getElementById(menuId).classList.add('hidden');
    }

    showHUD() {
        document.getElementById('hud').classList.remove('hidden');
    }

    hideHUD() {
        document.getElementById('hud').classList.add('hidden');
    }

    updateHUD(player) {
        const healthPercent = (player.health / player.maxHealth) * 100;
        document.getElementById('health-bar').style.width = healthPercent + '%';
        document.getElementById('health-text').textContent = 
            Math.ceil(player.health) + '/' + player.maxHealth;
        document.getElementById('gold-display').textContent = 'Gold: ' + player.gold;
        document.getElementById('level-display').textContent = 'Level: ' + player.level;
    }

    showGameOver(message) {
        this.hideHUD();
        document.getElementById('game-over-text').textContent = message;
        this.showMenu('game-over-menu');
    }

    showShop(shop, player) {
        this.showMenu('shop-menu');
        const shopItems = document.getElementById('shop-items');
        shopItems.innerHTML = '';

        // Weapon upgrades
        const weaponSection = document.createElement('div');
        weaponSection.innerHTML = '<h3 style="color: #ffd700; margin-bottom: 10px;">Weapons</h3>';
        shopItems.appendChild(weaponSection);

        shop.weaponTiers.forEach((tier, index) => {
            if (index <= shop.currentWeaponTier) return; // Skip owned/current tiers
            
            const item = document.createElement('div');
            item.className = 'shop-item';
            item.innerHTML = `
                <div>
                    <strong>${tier.name}</strong><br>
                    <small>Damage: ${tier.damage} | Cost: ${tier.cost} gold</small>
                </div>
                <button onclick="window.game.buyWeapon(${index})" ${player.gold < tier.cost ? 'disabled' : ''}>
                    Buy
                </button>
            `;
            shopItems.appendChild(item);
        });

        // Armor upgrades
        const armorSection = document.createElement('div');
        armorSection.innerHTML = '<h3 style="color: #ffd700; margin-top: 20px; margin-bottom: 10px;">Armor</h3>';
        shopItems.appendChild(armorSection);

        shop.armorTiers.forEach((tier, index) => {
            if (index <= shop.currentArmorTier) return; // Skip owned/current tiers
            
            const item = document.createElement('div');
            item.className = 'shop-item';
            item.innerHTML = `
                <div>
                    <strong>${tier.name}</strong><br>
                    <small>Defense: ${tier.defense} | Cost: ${tier.cost} gold</small>
                </div>
                <button onclick="window.game.buyArmor(${index})" ${player.gold < tier.cost ? 'disabled' : ''}>
                    Buy
                </button>
            `;
            shopItems.appendChild(item);
        });
    }

    updateCursor() {
        const canvas = document.getElementById('gameCanvas');
        const opacity = this.cursorTransparency / 100;
        canvas.style.cursor = 'none';
        
        // Create custom cursor if needed
        // For now, we'll just hide the default cursor
    }

    getScreenShakeEnabled() {
        return this.screenShake;
    }
}

