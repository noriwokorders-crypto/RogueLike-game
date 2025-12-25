// Core game loop and state management

const GameState = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    SHOP: 'shop',
    GAME_OVER: 'game_over'
};

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.state = GameState.MENU;
        
        // Setup canvas
        this.resizeCanvas();
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            // Update camera if player exists
            if (this.player && this.roomManager) {
                const currentRoom = this.roomManager.getCurrentRoom();
                if (currentRoom) {
                    this.camera.follow(this.player, this.canvas.width, this.canvas.height, 
                                      currentRoom.width, currentRoom.height);
                }
            }
        });
        
        // Game systems
        this.input = new InputManager();
        this.camera = new Camera();
        this.ui = new UIManager();
        this.shop = new Shop();
        this.roomManager = new RoomManager();
        
        // Game objects
        this.player = null;
        this.newGamePlus = false;
        
        // Canvas dimensions (initialize to prevent undefined)
        this.canvasWidth = 0;
        this.canvasHeight = 0;
        
        // Game loop
        this.lastTime = 0;
        this.running = false;
    }

    resizeCanvas() {
        // Check if mobile (touch device or small screen)
        const isMobile = 'ontouchstart' in window || window.innerWidth <= 768;
        
        let canvasWidth, canvasHeight;
        
        if (isMobile) {
            // Mobile: Fill entire screen on any size phone
            canvasWidth = window.innerWidth;
            canvasHeight = window.innerHeight;
        } else {
            // Desktop: Maintain 2:3 aspect ratio (width:height = 2:3, so height = width * 1.5)
            const maxWidth = window.innerWidth;
            const maxHeight = window.innerHeight;
            
            // Try to fit by width first
            canvasWidth = maxWidth;
            canvasHeight = canvasWidth * 1.5;
            
            // If height doesn't fit, fit by height instead
            if (canvasHeight > maxHeight) {
                canvasHeight = maxHeight;
                canvasWidth = canvasHeight / 1.5;
            }
            
            // Ensure minimum size
            canvasWidth = Math.max(320, canvasWidth);
            canvasHeight = Math.max(480, canvasHeight);
        }
        
        // Set canvas size (both CSS and internal resolution match for simplicity)
        this.canvas.width = canvasWidth;
        this.canvas.height = canvasHeight;
        
        // Store for calculations (always update these)
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        
        // Update camera bounds if game is running
        if (this.player && this.roomManager) {
            const currentRoom = this.roomManager.getCurrentRoom();
            if (currentRoom) {
                // Force instant camera update on resize
                this.camera.smoothFollow = false;
                this.camera.follow(this.player, canvasWidth, canvasHeight, 
                                  currentRoom.width, currentRoom.height);
                this.camera.smoothFollow = false; // Keep instant follow
            }
        }
    }

    async startGame() {
        this.state = GameState.PLAYING;
        this.running = true;
        
        // Resize canvas first to ensure correct dimensions
        this.resizeCanvas();
        
        // Initialize rooms first (now async)
        await this.roomManager.initialize();
        
        // Initialize player
        const startRoom = this.roomManager.getCurrentRoom();
        this.player = new Player(startRoom.width / 2, startRoom.height / 2);
        this.player.autoAttack = this.ui.autoAttack;
        
        // Apply shop upgrades
        const currentWeapon = this.shop.getCurrentWeapon();
        const currentArmor = this.shop.getCurrentArmor();
        this.player.damage = currentWeapon.damage;
        this.player.defense = currentArmor.defense;
        
        // Initialize camera to center on player (use stored canvas dimensions)
        const canvasW = this.canvasWidth || this.canvas.width || window.innerWidth;
        const canvasH = this.canvasHeight || this.canvas.height || (window.innerWidth * 1.5);
        
        // Force camera to center on player immediately
        this.camera.smoothFollow = false;
        this.camera.x = this.player.x - canvasW / 2;
        this.camera.y = this.player.y - canvasH / 2;
        
        // Clamp camera to room bounds
        const maxX = Math.max(0, startRoom.width - canvasW);
        const maxY = Math.max(0, startRoom.height - canvasH);
        this.camera.x = Math.max(0, Math.min(this.camera.x, maxX));
        this.camera.y = Math.max(0, Math.min(this.camera.y, maxY));
        
        // Call follow to ensure everything is set up correctly
        this.camera.follow(this.player, canvasW, canvasH, 
                          startRoom.width, startRoom.height);
        
        // Start game loop
        this.gameLoop(0);
    }

    reset() {
        this.state = GameState.MENU;
        this.running = false;
        this.player = null;
        this.shop = new Shop();
        this.roomManager = new RoomManager();
    }

    pause() {
        if (this.state === GameState.PLAYING) {
            this.state = GameState.PAUSED;
            this.ui.showMenu('pause-menu');
        }
    }

    resume() {
        if (this.state === GameState.PAUSED || this.state === GameState.SHOP) {
            this.state = GameState.PLAYING;
            this.ui.hideMenu('pause-menu');
            this.ui.hideMenu('shop-menu');
        }
    }

    gameLoop(currentTime) {
        if (!this.running) return;
        
        const deltaTime = Math.min(0.033, (currentTime - this.lastTime) / 1000);
        this.lastTime = currentTime;
        
        if (this.state === GameState.PLAYING) {
            this.update(deltaTime);
        }
        
        this.render();
        requestAnimationFrame((t) => this.gameLoop(t));
    }

    update(deltaTime) {
        if (!this.player || !this.player.isAlive()) {
            this.gameOver();
            return;
        }

        // Input handling
        if (this.input.isKeyPressed('escape') || this.input.isKeyPressed('m')) {
            this.pause();
        }

        // Get current room
        const currentRoom = this.roomManager.getCurrentRoom();
        
        // Check for shop room (only open once when first entering)
        if (currentRoom.type === 'shop' && this.state === GameState.PLAYING && !currentRoom.shopOpened) {
            this.state = GameState.SHOP;
            this.ui.showShop(this.shop, this.player);
            currentRoom.shopOpened = true;
        }
        
        // Update player
        this.player.update(deltaTime, this.input, currentRoom.enemies, currentRoom.bullets, this.camera);
        
        // Clamp player to room bounds
        this.player.x = Math.max(this.player.width / 2, Math.min(this.player.x, currentRoom.width - this.player.width / 2));
        this.player.y = Math.max(this.player.height / 2, Math.min(this.player.y, currentRoom.height - this.player.height / 2));
        
        // Update room
        const screenShakeEnabled = this.ui.getScreenShakeEnabled();
        currentRoom.update(deltaTime, this.player, this.camera, screenShakeEnabled);
        
        // Check collisions
        currentRoom.checkCollisions(this.player, this.camera, screenShakeEnabled);
        
        // Check door collisions
        const doorDirection = currentRoom.checkDoorCollision(this.player);
        if (doorDirection && !currentRoom.locked) {
            if (this.roomManager.changeRoom(doorDirection)) {
                // Move player to appropriate position based on door direction
                const newRoom = this.roomManager.getCurrentRoom();
                
                // Position player at the opposite door of the one they entered through
                // If going through bottom door, appear at top of next room
                // If going through top door, appear at bottom of next room
                // If going through right door, appear at left of next room
                // If going through left door, appear at right of next room
                const TILE_SIZE = 64;
                const doorSize = 64;
                const doorThickness = 20;
                const centerX = Math.floor(newRoom.width / 2 / TILE_SIZE) * TILE_SIZE;
                const centerY = Math.floor(newRoom.height / 2 / TILE_SIZE) * TILE_SIZE;
                
                if (doorDirection === 'down') {
                    // Entered through bottom door, appear at top
                    this.player.x = centerX;
                    this.player.y = doorThickness + this.player.height / 2;
                } else if (doorDirection === 'up') {
                    // Entered through top door, appear at bottom
                    this.player.x = centerX;
                    this.player.y = newRoom.height - doorThickness - this.player.height / 2;
                } else if (doorDirection === 'right') {
                    // Entered through right door, appear at left
                    this.player.x = doorThickness + this.player.width / 2;
                    this.player.y = centerY;
                } else if (doorDirection === 'left') {
                    // Entered through left door, appear at right
                    this.player.x = newRoom.width - doorThickness - this.player.width / 2;
                    this.player.y = centerY;
                } else {
                    // Fallback to center
                    this.player.x = newRoom.width / 2;
                    this.player.y = newRoom.height / 2;
                }
                
                // Reset shop opened state if entering shop
                if (newRoom.type === 'shop') {
                    newRoom.shopOpened = false;
                }
                // Immediately update camera for new room
                const canvasW = this.canvasWidth || this.canvas.width;
                const canvasH = this.canvasHeight || this.canvas.height;
                this.camera.follow(this.player, canvasW, canvasH, 
                                  newRoom.width, newRoom.height);
            }
        }
        
        // Update camera - always follow player (use stored canvas dimensions)
        const canvasW = this.canvasWidth || this.canvas.width;
        const canvasH = this.canvasHeight || this.canvas.height;
        this.camera.follow(this.player, canvasW, canvasH, 
                          currentRoom.width, currentRoom.height);
        
        // Check for gold drops (enemies drop gold on death)
        currentRoom.enemies.forEach(enemy => {
            if (!enemy.active && enemy.health <= 0 && !enemy.goldDropped) {
                enemy.goldDropped = true;
                const goldAmount = enemy.type === 'mushroom_boss' ? randomInt(100, 200) : 
                                  enemy.type === 'golem' ? randomInt(20, 40) :
                                  enemy.type === 'dog' ? randomInt(10, 25) :
                                  randomInt(5, 15);
                this.player.gold += goldAmount;
            }
        });
        
        // Update UI
        this.ui.updateHUD(this.player);
        
        // Screen shake on damage
        if (this.ui.getScreenShakeEnabled() && this.player.health < this.player.maxHealth) {
            // Add shake when taking damage (handled in player.takeDamage if needed)
        }
    }

    render() {
        // Get canvas dimensions
        const canvasW = this.canvasWidth || this.canvas.width;
        const canvasH = this.canvasHeight || this.canvas.height;
        
        // Clear canvas
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, canvasW, canvasH);
        
        if (this.state === GameState.PLAYING && this.player) {
            // Ensure camera is updated before rendering
            const currentRoom = this.roomManager.getCurrentRoom();
            if (currentRoom) {
                this.camera.follow(this.player, canvasW, canvasH, 
                                  currentRoom.width, currentRoom.height);
            }
            
            // Apply zoom out 20% (see 20% more area)
            const zoomOutFactor = 1.25; // 1.25x = 20% zoom out
            
            this.ctx.save();
            
            // Apply zoom by scaling the world (scale down to zoom out)
            const scale = 1.0 / zoomOutFactor; // Scale down to show more area
            // Center the scaled view
            this.ctx.translate(canvasW / 2, canvasH / 2);
            this.ctx.scale(scale, scale);
            this.ctx.translate(-canvasW / 2, -canvasH / 2);
            
            this.ctx.translate(-this.camera.getX(), -this.camera.getY());
            
            // Draw current room
            currentRoom.draw(this.ctx, this.camera);
            
            // Draw player
            this.player.draw(this.ctx, this.camera);
            
            this.ctx.restore();
            
            // Draw mobile controls (joystick) on top
            this.drawMobileControls();
        }
    }
    
    drawMobileControls() {
        // Only draw on mobile (when joystick is active or touch is available)
        if (!this.input.joystick.active && !('ontouchstart' in window)) return;
        
        const joystick = this.input.joystick;
        
        if (joystick.active) {
            // Draw joystick base
            this.ctx.fillStyle = 'rgba(100, 100, 100, 0.5)';
            this.ctx.beginPath();
            this.ctx.arc(joystick.startX, joystick.startY, joystick.radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Draw joystick handle
            const dx = joystick.currentX - joystick.startX;
            const dy = joystick.currentY - joystick.startY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const clampedDistance = Math.min(distance, joystick.radius);
            const angle = Math.atan2(dy, dx);
            
            const handleX = joystick.startX + Math.cos(angle) * clampedDistance;
            const handleY = joystick.startY + Math.sin(angle) * clampedDistance;
            
            this.ctx.fillStyle = 'rgba(200, 200, 200, 0.7)';
            this.ctx.beginPath();
            this.ctx.arc(handleX, handleY, 25, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    gameOver() {
        this.state = GameState.GAME_OVER;
        this.running = false;
        this.ui.showGameOver('You have been defeated!');
    }

    buyWeapon(tierIndex) {
        if (this.shop.buyWeapon(tierIndex, this.player)) {
            // Refresh shop UI
            this.ui.showShop(this.shop, this.player);
        }
    }

    buyArmor(tierIndex) {
        if (this.shop.buyArmor(tierIndex, this.player)) {
            // Refresh shop UI
            this.ui.showShop(this.shop, this.player);
        }
    }
}

