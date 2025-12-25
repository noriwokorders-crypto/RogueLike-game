// Room/Level system

// Pre-defined room layouts
const ROOM_LAYOUTS = {
    // Shop layout
    shop: [
        { x: 300, y: 200, width: 80, height: 80 },
        { x: 500, y: 300, width: 100, height: 100 },
        { x: 700, y: 200, width: 80, height: 80 },
        { x: 450, y: 500, width: 90, height: 90 }
    ],
    
    // Normal room layouts (10 different designs)
    normal_1: [
        { x: 200, y: 150, width: 60, height: 60 },
        { x: 400, y: 300, width: 70, height: 70 },
        { x: 600, y: 450, width: 60, height: 60 },
        { x: 800, y: 200, width: 80, height: 80 }
    ],
    
    normal_2: [
        { x: 150, y: 300, width: 50, height: 50 },
        { x: 350, y: 150, width: 60, height: 60 },
        { x: 550, y: 500, width: 70, height: 70 },
        { x: 750, y: 350, width: 60, height: 60 },
        { x: 950, y: 200, width: 50, height: 50 }
    ],
    
    normal_3: [
        { x: 300, y: 100, width: 80, height: 80 },
        { x: 500, y: 250, width: 60, height: 60 },
        { x: 700, y: 400, width: 70, height: 70 },
        { x: 900, y: 550, width: 60, height: 60 }
    ],
    
    normal_4: [
        { x: 250, y: 400, width: 70, height: 70 },
        { x: 450, y: 200, width: 60, height: 60 },
        { x: 650, y: 350, width: 80, height: 80 },
        { x: 850, y: 500, width: 60, height: 60 },
        { x: 1050, y: 150, width: 50, height: 50 }
    ],
    
    normal_5: [
        { x: 200, y: 250, width: 60, height: 60 },
        { x: 400, y: 450, width: 70, height: 70 },
        { x: 600, y: 200, width: 60, height: 60 },
        { x: 800, y: 400, width: 80, height: 80 },
        { x: 1000, y: 300, width: 60, height: 60 }
    ],
    
    normal_6: [
        { x: 150, y: 500, width: 50, height: 50 },
        { x: 350, y: 300, width: 60, height: 60 },
        { x: 550, y: 100, width: 70, height: 70 },
        { x: 750, y: 450, width: 60, height: 60 },
        { x: 950, y: 250, width: 70, height: 70 }
    ],
    
    normal_7: [
        { x: 300, y: 350, width: 80, height: 80 },
        { x: 500, y: 150, width: 60, height: 60 },
        { x: 700, y: 500, width: 70, height: 70 },
        { x: 900, y: 300, width: 60, height: 60 }
    ],
    
    normal_8: [
        { x: 200, y: 100, width: 60, height: 60 },
        { x: 400, y: 400, width: 70, height: 70 },
        { x: 600, y: 250, width: 60, height: 60 },
        { x: 800, y: 550, width: 80, height: 80 },
        { x: 1000, y: 200, width: 60, height: 60 }
    ],
    
    normal_9: [
        { x: 250, y: 300, width: 70, height: 70 },
        { x: 450, y: 500, width: 60, height: 60 },
        { x: 650, y: 150, width: 80, height: 80 },
        { x: 850, y: 350, width: 60, height: 60 }
    ],
    
    normal_10: [
        { x: 150, y: 200, width: 50, height: 50 },
        { x: 350, y: 450, width: 60, height: 60 },
        { x: 550, y: 300, width: 70, height: 70 },
        { x: 750, y: 100, width: 60, height: 60 },
        { x: 950, y: 500, width: 70, height: 70 },
        { x: 1100, y: 250, width: 50, height: 50 }
    ],
    
    // Boss room layout
    boss: [
        { x: 300, y: 200, width: 100, height: 100 },
        { x: 500, y: 400, width: 100, height: 100 },
        { x: 700, y: 200, width: 100, height: 100 },
        { x: 900, y: 400, width: 100, height: 100 }
    ]
};

class Room {
    constructor(width, height, type = 'normal', layoutId = null, customMap = null) {
        this.width = width;
        this.height = height;
        this.type = type; // normal, boss, shop
        this.layoutId = layoutId; // ID for the room layout
        this.customMap = customMap; // Custom tile map data
        this.enemies = [];
        this.bullets = [];
        this.obstacles = [];
        this.doors = [];
        this.cleared = false;
        this.locked = false;
        this.bossDefeated = false;
        this.shopOpened = false;
        
        // Store boss initial health for restoration
        this.bossInitialHealth = null;
        
        // Random trees and stones outside room boundaries
        this.randomTrees = [];
        this.randomStones = [];
        
        this.generateRoom();
    }

    generateRoom() {
        // If custom map is provided, load from map data
        if (this.customMap) {
            console.log(`Room ${this.type} (layoutId: ${this.layoutId}) using custom map`);
            this.loadFromCustomMap(this.customMap);
            return;
        } else {
            console.log(`Room ${this.type} (layoutId: ${this.layoutId}) using default layout (no custom map)`);
        }
        
        // Generate obstacles from pre-defined layout
        if (this.layoutId && ROOM_LAYOUTS[this.layoutId]) {
            // Use pre-defined layout
            this.obstacles = ROOM_LAYOUTS[this.layoutId].map(obs => ({
                x: obs.x,
                y: obs.y,
                width: obs.width,
                height: obs.height
            }));
        } else if (this.type === 'normal') {
            // Fallback to random if no layout specified
            this.generateObstacles();
        } else if (this.type === 'boss') {
            this.locked = true;
            if (ROOM_LAYOUTS.boss) {
                this.obstacles = ROOM_LAYOUTS.boss.map(obs => ({
                    x: obs.x,
                    y: obs.y,
                    width: obs.width,
                    height: obs.height
                }));
            }
        } else if (this.type === 'shop') {
            if (ROOM_LAYOUTS.shop) {
                this.obstacles = ROOM_LAYOUTS.shop.map(obs => ({
                    x: obs.x,
                    y: obs.y,
                    width: obs.width,
                    height: obs.height
                }));
            }
        }
        
        // Generate doors (exits)
        this.generateDoors();
    }
    
    loadFromCustomMap(mapData) {
        console.log('Loading room from custom map:', mapData);
        
        if (!mapData) {
            console.error('loadFromCustomMap called with null/undefined mapData');
            this.generateDoors();
            return;
        }
        
        // Load doors FIRST so we can use them to exclude door areas from obstacles
        if (mapData.doors && Array.isArray(mapData.doors)) {
            // Custom door positions from map
            this.doors = mapData.doors.map(door => ({
                x: door.x,
                y: door.y,
                width: door.width || 64,
                height: door.height || 20,
                direction: door.direction || 'up'
            }));
            console.log(`Loaded ${this.doors.length} doors from map data`);
        } else {
            // Generate default doors if not specified
            console.log('No doors in map data, generating default doors');
            this.generateDoors();
        }
        
        // Load obstacles from tile map
        // Clear any existing obstacles first
        const oldObstacleCount = this.obstacles.length;
        this.obstacles = [];
        console.log(`Cleared ${oldObstacleCount} old obstacles, starting fresh`);
        
        if (mapData.tiles && Array.isArray(mapData.tiles)) {
            // Map tiles: 0 = empty, 1 = wall/obstacle
            const tileSize = mapData.tileSize || TILE_SIZE;
            const width = mapData.width || ROOM_WIDTH_TILES;
            const height = mapData.height || ROOM_HEIGHT_TILES;
            
            console.log(`Processing ${mapData.tiles.length} tiles (${width}x${height})`);
            
            // Get tile map loader for collision data
            const tileMapLoader = window.game?.roomManager?.tileMapLoader;
            
            // Helper function to check if a tile position is in a door area
            const isInDoorArea = (tileX, tileY) => {
                if (!this.doors || this.doors.length === 0) return false;
                
                const worldX = tileX * tileSize;
                const worldY = tileY * tileSize;
                const tileRight = worldX + tileSize;
                const tileBottom = worldY + tileSize;
                
                for (const door of this.doors) {
                    const doorRight = door.x + door.width;
                    const doorBottom = door.y + door.height;
                    
                    // Check if tile overlaps with door area (with some padding for safety)
                    if (worldX < doorRight && tileRight > door.x &&
                        worldY < doorBottom && tileBottom > door.y) {
                        return true;
                    }
                }
                return false;
            };
            
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const tileIndex = y * width + x;
                    const tileValue = mapData.tiles[tileIndex];
                    
                    // Skip if this tile is in a door area
                    if (isInDoorArea(x, y)) {
                        continue;
                    }
                    
                    // If tile is a wall/obstacle (value 1 or higher)
                    if (tileValue === 1 || tileValue > 1) {
                        // Check if we have collision data from tileset
                        let obstacleAdded = false;
                        
                        if (tileMapLoader && mapData.tileGIDs) {
                            const gid = mapData.tileGIDs[tileIndex];
                            if (gid !== 0) {
                                const tileInfo = tileMapLoader.getTileImage(gid);
                                if (tileInfo && tileInfo.collisionData && Array.isArray(tileInfo.collisionData)) {
                                    // Use collision data from tileset
                                    const worldX = x * tileSize;
                                    let worldY = y * tileSize;
                                    
                                    // Check if this tile is from the Objects Layer (trees, etc.)
                                    // Apply the same offset adjustment as in rendering
                                    let isFromObjectsLayer = false;
                                    if (mapData.layerTileGIDs && Array.isArray(mapData.layerTileGIDs)) {
                                        for (const layerData of mapData.layerTileGIDs) {
                                            if (layerData.gids && layerData.gids[tileIndex] === gid) {
                                                const layerName = layerData.name || '';
                                                if (layerName.toLowerCase().includes('object')) {
                                                    isFromObjectsLayer = true;
                                                    break;
                                                }
                                            }
                                        }
                                    }
                                    
                                    // Apply offset for large objects in Objects Layer (like trees)
                                    if (isFromObjectsLayer && tileInfo.tileHeight > tileSize) {
                                        worldY = worldY - 192; // Match the rendering offset
                                    }
                                    
                                    tileInfo.collisionData.forEach(collisionObj => {
                                        this.obstacles.push({
                                            x: worldX + collisionObj.x,
                                            y: worldY + collisionObj.y,
                                            width: collisionObj.width,
                                            height: collisionObj.height,
                                            isEllipse: collisionObj.isEllipse || false
                                        });
                                    });
                                    obstacleAdded = true;
                                }
                            }
                        }
                        
                        // Fallback: use full tile as obstacle if no collision data
                        if (!obstacleAdded) {
                            this.obstacles.push({
                                x: x * tileSize,
                                y: y * tileSize,
                                width: tileSize,
                                height: tileSize,
                                isEllipse: false
                            });
                        }
                    }
                }
            }
            
            console.log(`Created ${this.obstacles.length} obstacles from tile map`);
            // Log first few obstacles to verify they're correct
            if (this.obstacles.length > 0) {
                console.log('First 5 obstacles:', this.obstacles.slice(0, 5));
                console.log('Last 5 obstacles:', this.obstacles.slice(-5));
            }
        } else if (mapData.obstacles && Array.isArray(mapData.obstacles)) {
            // Direct obstacle array format
            this.obstacles = mapData.obstacles.map(obs => ({
                x: obs.x,
                y: obs.y,
                width: obs.width || TILE_SIZE,
                height: obs.height || TILE_SIZE
            }));
            console.log(`Loaded ${this.obstacles.length} obstacles from direct array`);
        } else {
            console.warn('Map data has no tiles or obstacles array:', mapData);
        }
        
        // Generate random trees outside room boundaries
        this.generateRandomTrees(mapData);
        
        // Set locked state if specified
        if (mapData.locked !== undefined) {
            this.locked = mapData.locked;
        } else if (this.type === 'boss') {
            this.locked = true;
        }
    }
    
    generateRandomTrees(mapData) {
        // Find tree and stone tile GIDs from Objects Layer
        let treeGID = 0;
        let stoneGID = 0;
        const tileMapLoader = window.game?.roomManager?.tileMapLoader;
        
        if (mapData.layerTileGIDs && Array.isArray(mapData.layerTileGIDs)) {
            const objectsLayer = mapData.layerTileGIDs.find(l => 
                l.name && l.name.toLowerCase().includes('object')
            );
            if (objectsLayer && objectsLayer.gids && Array.isArray(objectsLayer.gids)) {
                // Find tree tile (tall tiles, typically 192x256)
                // Find stone tile (smaller tiles, typically 64x64 or circular)
                for (let i = 0; i < objectsLayer.gids.length; i++) {
                    const gid = objectsLayer.gids[i];
                    if (gid > 0) {
                        const tileInfo = tileMapLoader?.getTileImage(gid);
                        if (tileInfo) {
                            // Trees are tall (192x256)
                            if (tileInfo.tileHeight > 64 && treeGID === 0) {
                                treeGID = gid;
                            }
                            // Stones are smaller (64x64 or similar, often circular/ellipse collision)
                            else if (tileInfo.tileHeight <= 64 && stoneGID === 0) {
                                stoneGID = gid;
                            }
                        }
                    }
                }
            }
        }
        
        // Generate random trees OUTSIDE room boundaries ONLY
        const numTrees = 20; // Number of random trees to spawn
        const numStones = 30; // Number of random stones to spawn
        
        this.randomTrees = [];
        this.randomStones = [];
        
        // Get tree and stone dimensions for overlap detection
        const treeWidth = treeGID > 0 ? (tileMapLoader?.getTileImage(treeGID)?.tileWidth || 192) : 192;
        const treeHeight = treeGID > 0 ? (tileMapLoader?.getTileImage(treeGID)?.tileHeight || 256) : 256;
        const stoneWidth = stoneGID > 0 ? (tileMapLoader?.getTileImage(stoneGID)?.tileWidth || 64) : 64;
        const stoneHeight = stoneGID > 0 ? (tileMapLoader?.getTileImage(stoneGID)?.tileHeight || 64) : 64;
        
        // Minimum spacing between objects (padding)
        const minSpacing = 20;
        
        // Helper function to check if a position overlaps with existing objects
        const checkOverlap = (x, y, width, height, existingObjects) => {
            for (const obj of existingObjects) {
                const objWidth = obj.width || (obj.type === 'tree' ? treeWidth : stoneWidth);
                const objHeight = obj.height || (obj.type === 'tree' ? treeHeight : stoneHeight);
                const objX = obj.x;
                const objY = obj.y;
                
                // Check if rectangles overlap (with padding)
                if (!(x + width + minSpacing < objX || 
                      x - minSpacing > objX + objWidth ||
                      y + height + minSpacing < objY ||
                      y - minSpacing > objY + objHeight)) {
                    return true; // Overlaps
                }
            }
            return false; // No overlap
        };
        
        // Store all placed objects for overlap checking
        const placedObjects = [];
        
        // Generate trees OUTSIDE boundaries (100-400 pixels from border)
        const minDistance = 100; // Minimum 100 pixels from border
        const maxDistance = 400; // Maximum 400 pixels from border
        
        for (let i = 0; i < numTrees; i++) {
            if (treeGID === 0) break;
            
            let x, y;
            let attempts = 0;
            const maxAttempts = 50; // Try up to 50 times to find a non-overlapping position
            
            do {
                const side = Math.floor(Math.random() * 4);
                const distance = minDistance + Math.random() * (maxDistance - minDistance);
                
                if (side === 0) {
                    // Left side - outside, 100-400px from left border
                    x = -distance;
                    y = -50 + Math.random() * (this.height + 100);
                } else if (side === 1) {
                    // Right side - outside, 100-400px from right border
                    x = this.width + distance;
                    y = -50 + Math.random() * (this.height + 100);
                } else if (side === 2) {
                    // Top side - outside, 100-400px from top border
                    x = -50 + Math.random() * (this.width + 100);
                    y = -distance;
                } else {
                    // Bottom side - outside, 100-400px from bottom border
                    x = -50 + Math.random() * (this.width + 100);
                    y = this.height + distance;
                }
                
                attempts++;
            } while (checkOverlap(x, y, treeWidth, treeHeight, placedObjects) && attempts < maxAttempts);
            
            // Only add if we found a valid position
            if (attempts < maxAttempts) {
                const treeObj = { x, y, gid: treeGID, width: treeWidth, height: treeHeight, type: 'tree' };
                this.randomTrees.push(treeObj);
                placedObjects.push(treeObj);
            }
        }
        
        // Generate stones OUTSIDE boundaries (100-400 pixels from border)
        for (let i = 0; i < numStones; i++) {
            if (stoneGID === 0) break;
            
            let x, y;
            let attempts = 0;
            const maxAttempts = 50; // Try up to 50 times to find a non-overlapping position
            
            do {
                const side = Math.floor(Math.random() * 4);
                const distance = minDistance + Math.random() * (maxDistance - minDistance);
                
                if (side === 0) {
                    // Left side - outside, 100-400px from left border
                    x = -distance;
                    y = -50 + Math.random() * (this.height + 100);
                } else if (side === 1) {
                    // Right side - outside, 100-400px from right border
                    x = this.width + distance;
                    y = -50 + Math.random() * (this.height + 100);
                } else if (side === 2) {
                    // Top side - outside, 100-400px from top border
                    x = -50 + Math.random() * (this.width + 100);
                    y = -distance;
                } else {
                    // Bottom side - outside, 100-400px from bottom border
                    x = -50 + Math.random() * (this.width + 100);
                    y = this.height + distance;
                }
                
                attempts++;
            } while (checkOverlap(x, y, stoneWidth, stoneHeight, placedObjects) && attempts < maxAttempts);
            
            // Only add if we found a valid position
            if (attempts < maxAttempts) {
                const stoneObj = { x, y, gid: stoneGID, width: stoneWidth, height: stoneHeight, type: 'stone' };
                this.randomStones.push(stoneObj);
                placedObjects.push(stoneObj);
            }
        }
        
        console.log(`Generated ${this.randomTrees.length} random trees and ${this.randomStones.length} random stones OUTSIDE room boundaries`);
    }

    generateObstacles() {
        // Fallback: Add some random obstacles (shouldn't be used with pre-rendered rooms)
        const obstacleCount = randomInt(3, 6);
        for (let i = 0; i < obstacleCount; i++) {
            const size = randomInt(30, 60);
            this.obstacles.push({
                x: randomInt(100, this.width - 100),
                y: randomInt(100, this.height - 100),
                width: size,
                height: size
            });
        }
    }

    generateDoors() {
        // Doors on edges of room (aligned to tile grid)
        const doorSize = 64; // 1 tile wide
        const doorThickness = 20;
        
        // Center doors on tile boundaries
        const centerX = Math.floor(this.width / 2 / TILE_SIZE) * TILE_SIZE;
        const centerY = Math.floor(this.height / 2 / TILE_SIZE) * TILE_SIZE;
        
        this.doors = [
            { x: centerX - doorSize / 2, y: 0, width: doorSize, height: doorThickness, direction: 'up' },
            { x: centerX - doorSize / 2, y: this.height - doorThickness, width: doorSize, height: doorThickness, direction: 'down' },
            { x: 0, y: centerY - doorSize / 2, width: doorThickness, height: doorSize, direction: 'left' },
            { x: this.width - doorThickness, y: centerY - doorSize / 2, width: doorThickness, height: doorSize, direction: 'right' }
        ];
    }

    spawnEnemies(count, types = ['slime']) {
        for (let i = 0; i < count; i++) {
            const type = types[randomInt(0, types.length - 1)];
            const x = randomInt(100, this.width - 100);
            const y = randomInt(100, this.height - 100);
            const enemy = new Enemy(x, y, type);
            this.enemies.push(enemy);
            
            // Store boss initial health
            if (type === 'mushroom_boss') {
                this.bossInitialHealth = enemy.maxHealth;
            }
        }
    }

    update(deltaTime, player, camera, screenShakeEnabled = true) {
        // Update enemies
        this.enemies.forEach(enemy => {
            if (enemy.active) {
                enemy.update(deltaTime, player, this.bullets, this, camera, screenShakeEnabled);
            }
        });
        
        // Update bullets
        this.bullets.forEach(bullet => {
            if (bullet.active) {
                bullet.update(deltaTime);
            }
        });
        
        // Remove inactive bullets
        this.bullets = this.bullets.filter(b => b.active);
        
        // Check if room is cleared
        if (this.type === 'normal' || this.type === 'boss') {
            const activeEnemies = this.enemies.filter(e => e.active);
            if (activeEnemies.length === 0 && !this.cleared) {
                this.cleared = true;
                this.locked = false;
                if (this.type === 'boss') {
                    this.bossDefeated = true;
                }
            }
        }
        
        // Check boss health restoration (if player leaves boss room)
        if (this.type === 'boss' && this.bossInitialHealth !== null) {
            const boss = this.enemies.find(e => e.type === 'mushroom_boss');
            if (boss && boss.health < this.bossInitialHealth) {
                // Check if player is leaving room
                const playerInRoom = player.x > 0 && player.x < this.width &&
                                   player.y > 0 && player.y < this.height;
                if (!playerInRoom && !this.bossDefeated) {
                    // Restore boss health
                    boss.health = this.bossInitialHealth;
                }
            }
        }
    }

    checkCollisions(player, camera = null, screenShakeEnabled = true) {
        // Player-obstacle collisions (from Tiled map collision data)
        const playerRect = player.getCollisionRect();
        this.obstacles.forEach(obs => {
            if (obs.isEllipse) {
                // Ellipse collision (circle) - for rocks
                const centerX = obs.x + obs.width / 2;
                const centerY = obs.y + obs.height / 2;
                const radius = Math.min(obs.width, obs.height) / 2;
                
                const circle = { x: centerX, y: centerY, radius: radius };
                if (checkCircleRectCollision(circle, playerRect)) {
                    // Push player away from circle center
                    const dx = player.x - centerX;
                    const dy = player.y - centerY;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist > 0) {
                        const pushDistance = radius + player.width / 2 - dist;
                        if (pushDistance > 0) {
                            player.x += (dx / dist) * pushDistance;
                            player.y += (dy / dist) * pushDistance;
                        }
                    }
                }
            } else {
                // Rectangle collision - for trees and walls
                if (checkAABBCollision(playerRect, obs)) {
                    // Push player away from obstacle
                    const playerCenterX = player.x;
                    const playerCenterY = player.y;
                    const obsCenterX = obs.x + obs.width / 2;
                    const obsCenterY = obs.y + obs.height / 2;
                    
                    const dx = playerCenterX - obsCenterX;
                    const dy = playerCenterY - obsCenterY;
                    
                    // Calculate overlap
                    const overlapX = (playerRect.width / 2 + obs.width / 2) - Math.abs(dx);
                    const overlapY = (playerRect.height / 2 + obs.height / 2) - Math.abs(dy);
                    
                    // Push in the direction of least overlap
                    if (overlapX < overlapY) {
                        player.x += dx > 0 ? overlapX : -overlapX;
                    } else {
                        player.y += dy > 0 ? overlapY : -overlapY;
                    }
                }
            }
        });
        
        // Player-enemy collisions
        this.enemies.forEach(enemy => {
            if (!enemy.active) return;
            
            const enemyCircle = enemy.getCollisionCircle();
            
            if (checkCircleRectCollision(enemyCircle, playerRect)) {
                // Push player away
                const dx = player.x - enemy.x;
                const dy = player.y - enemy.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > 0) {
                    const pushDistance = enemy.radius + player.width / 2 - dist;
                    if (pushDistance > 0) {
                        player.x += (dx / dist) * pushDistance;
                        player.y += (dy / dist) * pushDistance;
                    }
                }
            }
        });
        
        // Player-bullet collisions
        this.bullets.forEach(bullet => {
            if (!bullet.active || bullet.isPlayerBullet) return;
            
            const playerRect = player.getCollisionRect();
            const bulletCircle = bullet.getCollisionCircle();
            
            if (checkCircleRectCollision(bulletCircle, playerRect)) {
                player.takeDamage(bullet.damage, camera, screenShakeEnabled);
                bullet.active = false;
            }
        });
        
        // Enemy-bullet collisions (player bullets)
        this.bullets.forEach(bullet => {
            if (!bullet.active || !bullet.isPlayerBullet) return;
            
            this.enemies.forEach(enemy => {
                if (!enemy.active) return;
                
                const enemyCircle = enemy.getCollisionCircle();
                const bulletCircle = bullet.getCollisionCircle();
                
                if (checkCircleCollision(enemyCircle, bulletCircle)) {
                    enemy.takeDamage(bullet.damage);
                    bullet.active = false;
                }
            });
        });
    }

    checkDoorCollision(player) {
        const playerRect = player.getCollisionRect();
        
        for (const door of this.doors) {
            if (checkAABBCollision(playerRect, door)) {
                return door.direction;
            }
        }
        return null;
    }

    draw(ctx, camera) {
        // Camera transform is already applied in render(), so just draw at world positions
        
        // If custom map with tile images, render tiles
        // Check for either tileGIDs or layerTileGIDs (new format)
        if (this.customMap && (this.customMap.layerTileGIDs || (this.customMap.tileGIDs && this.customMap.layers))) {
            this.drawTiledMap(ctx);
        } else {
            // Draw room background (for non-tiled maps)
            ctx.fillStyle = '#2a2a3e';
            ctx.fillRect(0, 0, this.width, this.height);
            
            // Draw room border
            ctx.strokeStyle = '#555';
            ctx.lineWidth = 4;
            ctx.strokeRect(0, 0, this.width, this.height);
            
            // Draw obstacles as colored rectangles
            if (this.customMap) {
                ctx.fillStyle = '#7a9a9e';
                ctx.strokeStyle = '#9ababa';
                ctx.lineWidth = 2;
            } else {
                ctx.fillStyle = '#3a3a4e';
            }
            
            this.obstacles.forEach(obs => {
                ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
                if (this.customMap) {
                    ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);
                }
            });
        }
        
        // Draw doors
        ctx.fillStyle = '#8b4513';
        this.doors.forEach(door => {
            if (!this.locked || this.cleared) {
                ctx.fillRect(door.x, door.y, door.width, door.height);
            }
        });
        
        // Draw enemies
        this.enemies.forEach(enemy => {
            enemy.draw(ctx, camera);
        });
        
        // Draw bullets
        this.bullets.forEach(bullet => {
            bullet.draw(ctx, camera);
        });
    }
    
    drawTiledMap(ctx) {
        if (!this.customMap) return;
        
        const width = this.customMap.width || ROOM_WIDTH_TILES;
        const height = this.customMap.height || ROOM_HEIGHT_TILES;
        const mapTileSize = this.customMap.tileSize || TILE_SIZE; // Map's base tile size (64x64 grid)
        
        // Get tile map loader from room manager (we'll need to pass it or make it global)
        const tileMapLoader = window.game?.roomManager?.tileMapLoader;
        if (!tileMapLoader) {
            console.warn('TileMapLoader not available for rendering');
            return;
        }
        
        // Draw each layer in order (base layer first, then objects layer on top)
        // Use layerTileGIDs if available for proper layer ordering
        const layersToRender = this.customMap.layerTileGIDs || 
            (this.customMap.layers ? this.customMap.layers.filter(l => l.type === 'tilelayer').map((l, idx) => ({
                name: l.name,
                gids: l.data || [],
                offsetx: l.offsetx || 0,
                offsety: l.offsety || 0
            })) : []);
        
        if (layersToRender.length > 0) {
            layersToRender.forEach((layerData, layerIdx) => {
                const layerGIDs = layerData.gids || (layerData.data || []);
                const layerName = layerData.name || `Layer ${layerIdx}`;
                const layerOffsetX = layerData.offsetx || 0;
                const layerOffsetY = layerData.offsety || 0;
                
                // Get camera position to determine what area to render (including outside room)
                const camera = window.game?.camera;
                const canvasW = window.game?.canvasWidth || 1280;
                const canvasH = window.game?.canvasHeight || 768;
                const zoomOutFactor = 1.25;
                const effectiveWidth = canvasW * zoomOutFactor;
                const effectiveHeight = canvasH * zoomOutFactor;
                
                // Calculate visible area (camera view + some padding for outside room)
                const cameraX = camera ? camera.getX() : 0;
                const cameraY = camera ? camera.getY() : 0;
                const viewLeft = cameraX;
                const viewTop = cameraY;
                const viewRight = cameraX + effectiveWidth;
                const viewBottom = cameraY + effectiveHeight;
                
                // Calculate tile range to render (extend beyond room boundaries)
                const startTileX = Math.floor(viewLeft / mapTileSize) - 2; // 2 tiles padding
                const endTileX = Math.ceil(viewRight / mapTileSize) + 2;
                const startTileY = Math.floor(viewTop / mapTileSize) - 2;
                const endTileY = Math.ceil(viewBottom / mapTileSize) + 2;
                
                // Find floor tile GID from the MIDDLE of the map (not top-left)
                let floorTileGID = 12; // Default floor tile
                if (layerName.toLowerCase().includes('base') || layerName.toLowerCase().includes('tile layer')) {
                    // Get tile from middle of the map for better visual consistency
                    const middleX = Math.floor(width / 2);
                    const middleY = Math.floor(height / 2);
                    const middleIndex = middleY * width + middleX;
                    
                    if (layerGIDs && Array.isArray(layerGIDs) && middleIndex < layerGIDs.length) {
                        const middleGID = layerGIDs[middleIndex];
                        // Use the middle tile if it's a floor tile (typically 12), otherwise use default
                        if (middleGID === 12 || (middleGID > 0 && middleGID < 20)) {
                            floorTileGID = middleGID;
                        }
                    }
                }
                
                // First render room tiles normally
                for (let y = 0; y < height; y++) {
                    for (let x = 0; x < width; x++) {
                        const tileIndex = y * width + x;
                        const gid = Array.isArray(layerGIDs) ? layerGIDs[tileIndex] : 0;
                        
                        if (gid !== 0) {
                            const tileInfo = tileMapLoader.getTileImage(gid);
                            if (tileInfo && tileInfo.image) {
                                // Handle animated tiles - check if this tile has animation
                                let actualTileId = tileInfo.localTileId;
                                let tilesetInfo = null;
                                
                                // Find the tileset info to get animation data
                                for (const [firstgid, info] of tileMapLoader.tilesetImages.entries()) {
                                    if (firstgid <= gid && (!tilesetInfo || firstgid > tilesetInfo.firstgid)) {
                                        tilesetInfo = info;
                                    }
                                }
                                
                                if (tilesetInfo && tilesetInfo.animatedTiles && tilesetInfo.animatedTiles.has(actualTileId)) {
                                    const animation = tilesetInfo.animatedTiles.get(actualTileId);
                                    if (animation && animation.length > 0) {
                                        // Initialize animation time if needed
                                        if (!this._animationTime) {
                                            this._animationTime = Date.now();
                                        }
                                        
                                        // Calculate current animation frame
                                        const currentTime = Date.now() - this._animationTime;
                                        const animationDuration = animation.reduce((sum, frame) => sum + frame.duration, 0);
                                        const currentFrameTime = (currentTime % animationDuration);
                                        
                                        let accumulatedTime = 0;
                                        for (const frame of animation) {
                                            if (currentFrameTime < accumulatedTime + frame.duration) {
                                                actualTileId = frame.tileid;
                                                break;
                                            }
                                            accumulatedTime += frame.duration;
                                        }
                                    }
                                }
                                
                                // Calculate source position in tileset
                                const tileX = (actualTileId % tileInfo.columns) * tileInfo.tileWidth;
                                const tileY = Math.floor(actualTileId / tileInfo.columns) * tileInfo.tileHeight;
                                
                                // Use actual tile size from tileset
                                const renderWidth = tileInfo.tileWidth;
                                const renderHeight = tileInfo.tileHeight;
                                
                                // Position on grid - Tiled anchors from top-left
                                // Apply layer offset if present
                                let worldX = x * mapTileSize + layerOffsetX;
                                let worldY = y * mapTileSize + layerOffsetY;
                                
                                // Special handling for Objects Layer - check if trees need adjustment
                                // Trees are 256px tall (4 tiles), if they appear 192px (3 tiles) too low,
                                // we need to adjust their Y position
                                if (layerName.toLowerCase().includes('object') && renderHeight > mapTileSize) {
                                    // For large objects like trees, adjust Y position
                                    // Subtract 192 pixels (3 tiles) to move them up to match Tiled position
                                    worldY = worldY - 192;
                                    
                                    // Check if player is "above" the tree (in front of it) to make it transparent
                                    const player = window.game?.player;
                                    if (player) {
                                        // Tree center Y position (trees are tall, so use middle-bottom as reference)
                                        const treeCenterY = worldY + renderHeight * 0.7; // Use 70% down the tree as center
                                        const treeLeft = worldX;
                                        const treeRight = worldX + renderWidth;
                                        
                                        // Check if player is in front of the tree (player Y is less than tree center)
                                        // and player is horizontally overlapping with the tree
                                        if (player.y < treeCenterY && 
                                            player.x + player.width / 2 > treeLeft && 
                                            player.x - player.width / 2 < treeRight) {
                                            // Player is in front of tree, make tree slightly transparent
                                            ctx.globalAlpha = 0.5; // 50% opacity
                                        } else {
                                            ctx.globalAlpha = 1.0; // Full opacity
                                        }
                                    }
                                } else {
                                    ctx.globalAlpha = 1.0; // Full opacity for non-tree objects
                                }
                                
                                // Draw the tile at its actual size
                                ctx.drawImage(
                                    tileInfo.image,
                                    tileX, tileY, tileInfo.tileWidth, tileInfo.tileHeight, // Source
                                    worldX, worldY, renderWidth, renderHeight // Destination
                                );
                                
                                // Reset alpha after drawing
                                ctx.globalAlpha = 1.0;
                            }
                        }
                    }
                }
                
                // Now extend floor tiles outside room boundaries (only for base layer)
                if (layerName.toLowerCase().includes('base') || layerName.toLowerCase().includes('tile layer')) {
                    for (let tileY = startTileY; tileY < endTileY; tileY++) {
                        for (let tileX = startTileX; tileX < endTileX; tileX++) {
                            // Skip if inside room (already rendered above)
                            if (tileX >= 0 && tileX < width && tileY >= 0 && tileY < height) {
                                continue;
                            }
                            
                            // Render floor tile outside room
                            const gid = floorTileGID;
                            if (gid !== 0) {
                                const tileInfo = tileMapLoader.getTileImage(gid);
                                if (tileInfo && tileInfo.image) {
                                    const actualTileId = tileInfo.localTileId;
                                    const tileX_src = (actualTileId % tileInfo.columns) * tileInfo.tileWidth;
                                    const tileY_src = Math.floor(actualTileId / tileInfo.columns) * tileInfo.tileHeight;
                                    
                                    const worldX = tileX * mapTileSize + layerOffsetX;
                                    const worldY = tileY * mapTileSize + layerOffsetY;
                                    
                                    ctx.drawImage(
                                        tileInfo.image,
                                        tileX_src, tileY_src, tileInfo.tileWidth, tileInfo.tileHeight,
                                        worldX, worldY, tileInfo.tileWidth, tileInfo.tileHeight
                                    );
                                }
                            }
                        }
                    }
                }
            });
            
            // Render random trees outside room boundaries
            const tileMapLoaderForTrees = window.game?.roomManager?.tileMapLoader;
            if (tileMapLoaderForTrees) {
                const mapTileSizeForTrees = this.customMap.tileSize || TILE_SIZE;
                this.renderRandomTrees(ctx, tileMapLoaderForTrees, mapTileSizeForTrees);
            }
        } else if (this.customMap.layers && Array.isArray(this.customMap.layers)) {
            // Fallback: use original layer structure
            this.customMap.layers.forEach(layer => {
                if (layer.type === 'tilelayer' && layer.data && Array.isArray(layer.data)) {
                    for (let y = 0; y < height; y++) {
                        for (let x = 0; x < width; x++) {
                            const tileIndex = y * width + x;
                            const gid = layer.data[tileIndex];
                            
                            if (gid !== 0) {
                                const tileInfo = tileMapLoader.getTileImage(gid);
                                if (tileInfo && tileInfo.image) {
                                    // Handle animated tiles
                                    let actualTileId = tileInfo.localTileId;
                                    let tilesetInfo = null;
                                    
                                    for (const [firstgid, info] of tileMapLoader.tilesetImages.entries()) {
                                        if (firstgid <= gid && (!tilesetInfo || firstgid > tilesetInfo.firstgid)) {
                                            tilesetInfo = info;
                                        }
                                    }
                                    
                                    if (tilesetInfo && tilesetInfo.animatedTiles && tilesetInfo.animatedTiles.has(actualTileId)) {
                                        const animation = tilesetInfo.animatedTiles.get(actualTileId);
                                        if (animation && animation.length > 0) {
                                            if (!this._animationTime) {
                                                this._animationTime = Date.now();
                                            }
                                            const currentTime = Date.now() - this._animationTime;
                                            const animationDuration = animation.reduce((sum, frame) => sum + frame.duration, 0);
                                            const currentFrameTime = (currentTime % animationDuration);
                                            
                                            let accumulatedTime = 0;
                                            for (const frame of animation) {
                                                if (currentFrameTime < accumulatedTime + frame.duration) {
                                                    actualTileId = frame.tileid;
                                                    break;
                                                }
                                                accumulatedTime += frame.duration;
                                            }
                                        }
                                    }
                                    
                                    const tileX = (actualTileId % tileInfo.columns) * tileInfo.tileWidth;
                                    const tileY = Math.floor(actualTileId / tileInfo.columns) * tileInfo.tileHeight;
                                    
                                    const worldX = x * mapTileSize;
                                    let worldY = y * mapTileSize;
                                    
                                    // Check if this is a large object (tree) that needs transparency
                                    const player = window.game?.player;
                                    if (player && tileInfo.tileHeight > mapTileSize) {
                                        const treeCenterY = worldY + tileInfo.tileHeight * 0.7;
                                        const treeLeft = worldX;
                                        const treeRight = worldX + tileInfo.tileWidth;
                                        
                                        if (player.y < treeCenterY && 
                                            player.x + player.width / 2 > treeLeft && 
                                            player.x - player.width / 2 < treeRight) {
                                            ctx.globalAlpha = 0.5;
                                        } else {
                                            ctx.globalAlpha = 1.0;
                                        }
                                    } else {
                                        ctx.globalAlpha = 1.0;
                                    }
                                    
                                    ctx.drawImage(
                                        tileInfo.image,
                                        tileX, tileY, tileInfo.tileWidth, tileInfo.tileHeight,
                                        worldX, worldY, tileInfo.tileWidth, tileInfo.tileHeight
                                    );
                                    
                                    ctx.globalAlpha = 1.0;
                                }
                            }
                        }
                    }
                }
            });
            
            // Render random trees outside room boundaries
            const tileMapLoader = window.game?.roomManager?.tileMapLoader;
            if (tileMapLoader) {
                const mapTileSize = this.customMap.tileSize || TILE_SIZE;
                this.renderRandomTrees(ctx, tileMapLoader, mapTileSize);
            }
        }
    }
    
    renderRandomTrees(ctx, tileMapLoader, mapTileSize) {
        // Render random trees and stones OUTSIDE room boundaries
        if ((!this.randomTrees || this.randomTrees.length === 0) && 
            (!this.randomStones || this.randomStones.length === 0)) return;
        
        // Get camera position to only render visible trees
        const camera = window.game?.camera;
        const canvasW = window.game?.canvasWidth || 1280;
        const canvasH = window.game?.canvasHeight || 768;
        const zoomOutFactor = 1.25;
        const effectiveWidth = canvasW * zoomOutFactor;
        const effectiveHeight = canvasH * zoomOutFactor;
        const cameraX = camera ? camera.getX() : 0;
        const cameraY = camera ? camera.getY() : 0;
        const viewLeft = cameraX - 100; // Extra padding
        const viewTop = cameraY - 100;
        const viewRight = cameraX + effectiveWidth + 100;
        const viewBottom = cameraY + effectiveHeight + 100;
        
        this.randomTrees.forEach(tree => {
            // Only render if tree is in view
            if (tree.x < viewLeft || tree.x > viewRight || tree.y < viewTop || tree.y > viewBottom) {
                return;
            }
            
            const tileInfo = tileMapLoader.getTileImage(tree.gid);
            if (tileInfo && tileInfo.image) {
                // Handle animated tiles
                let actualTileId = tileInfo.localTileId;
                let tilesetInfo = null;
                
                for (const [firstgid, info] of tileMapLoader.tilesetImages.entries()) {
                    if (firstgid <= tree.gid && (!tilesetInfo || firstgid > tilesetInfo.firstgid)) {
                        tilesetInfo = info;
                    }
                }
                
                if (tilesetInfo && tilesetInfo.animatedTiles && tilesetInfo.animatedTiles.has(actualTileId)) {
                    const animation = tilesetInfo.animatedTiles.get(actualTileId);
                    if (animation && animation.length > 0) {
                        if (!this._animationTime) {
                            this._animationTime = Date.now();
                        }
                        const currentTime = Date.now() - this._animationTime;
                        const animationDuration = animation.reduce((sum, frame) => sum + frame.duration, 0);
                        const currentFrameTime = (currentTime % animationDuration);
                        
                        let accumulatedTime = 0;
                        for (const frame of animation) {
                            if (currentFrameTime < accumulatedTime + frame.duration) {
                                actualTileId = frame.tileid;
                                break;
                            }
                            accumulatedTime += frame.duration;
                        }
                    }
                }
                
                const tileX = (actualTileId % tileInfo.columns) * tileInfo.tileWidth;
                const tileY = Math.floor(actualTileId / tileInfo.columns) * tileInfo.tileHeight;
                
                // Trees need Y offset adjustment (same as room trees)
                let worldY = tree.y - 192; // Same offset as room trees
                
                // Check player transparency
                const player = window.game?.player;
                if (player) {
                    const treeCenterY = worldY + tileInfo.tileHeight * 0.7;
                    const treeLeft = tree.x;
                    const treeRight = tree.x + tileInfo.tileWidth;
                    
                    if (player.y < treeCenterY && 
                        player.x + player.width / 2 > treeLeft && 
                        player.x - player.width / 2 < treeRight) {
                        ctx.globalAlpha = 0.5;
                    } else {
                        ctx.globalAlpha = 1.0;
                    }
                } else {
                    ctx.globalAlpha = 1.0;
                }
                
                ctx.drawImage(
                    tileInfo.image,
                    tileX, tileY, tileInfo.tileWidth, tileInfo.tileHeight,
                    tree.x, worldY, tileInfo.tileWidth, tileInfo.tileHeight
                );
                
                ctx.globalAlpha = 1.0;
            }
        });
        
        // Render random stones OUTSIDE room boundaries
        if (this.randomStones && this.randomStones.length > 0) {
            this.randomStones.forEach(stone => {
                // Only render if stone is in view
                if (stone.x < viewLeft || stone.x > viewRight || stone.y < viewTop || stone.y > viewBottom) {
                    return;
                }
                
                const tileInfo = tileMapLoader.getTileImage(stone.gid);
                if (tileInfo && tileInfo.image) {
                    const actualTileId = tileInfo.localTileId;
                    const tileX = (actualTileId % tileInfo.columns) * tileInfo.tileWidth;
                    const tileY = Math.floor(actualTileId / tileInfo.columns) * tileInfo.tileHeight;
                    
                    // Stones don't need Y offset (they're 64x64)
                    ctx.drawImage(
                        tileInfo.image,
                        tileX, tileY, tileInfo.tileWidth, tileInfo.tileHeight,
                        stone.x, stone.y, tileInfo.tileWidth, tileInfo.tileHeight
                    );
                }
            });
        }
    }
}

// Tile size constant
const TILE_SIZE = 64;

// Room dimensions in tiles (20 tiles wide × 12 tiles tall)
const ROOM_WIDTH_TILES = 20;
const ROOM_HEIGHT_TILES = 12;

// Room dimensions in pixels
const ROOM_WIDTH = ROOM_WIDTH_TILES * TILE_SIZE;  // 1280 pixels
const ROOM_HEIGHT = ROOM_HEIGHT_TILES * TILE_SIZE; // 768 pixels

class RoomManager {
    constructor() {
        this.rooms = [];
        this.currentRoomIndex = 0;
        this.roomWidth = ROOM_WIDTH;   // 1280 pixels (20 tiles × 64)
        this.roomHeight = ROOM_HEIGHT;  // 768 pixels (12 tiles × 64)
        this.tileSize = TILE_SIZE;      // 64 pixels per tile
        this.tileMapLoader = new TileMapLoader();
        this.customMaps = []; // Array to store custom map paths/data for each room
    }

    async initialize() {
        // Create 12 pre-rendered rooms (1 shop, 10 normal, 1 boss)
        this.rooms = [];
        
        // Load custom maps if provided
        await this.loadCustomMaps();
        
        // Starting room (shop) - Room 0
        const shopMap = this.customMaps[0] ? await this.getMapData(0) : null;
        const shopRoom = new Room(this.roomWidth, this.roomHeight, 'shop', 'shop', shopMap);
        this.rooms.push(shopRoom);
        
        // 10 Normal rooms with unique layouts - Rooms 1-10
        const normalLayouts = ['normal_1', 'normal_2', 'normal_3', 'normal_4', 'normal_5', 
                               'normal_6', 'normal_7', 'normal_8', 'normal_9', 'normal_10'];
        
        for (let i = 0; i < 10; i++) {
            const layoutId = normalLayouts[i];
            const roomIndex = i + 1;
            const customMap = this.customMaps[roomIndex] ? await this.getMapData(roomIndex) : null;
            console.log(`Creating room ${roomIndex}: customMap =`, customMap ? 'LOADED' : 'NULL');
            const room = new Room(this.roomWidth, this.roomHeight, 'normal', layoutId, customMap);
            
            // Random enemy spawns (but layout stays the same)
            const enemyCount = randomInt(3, 6);
            let types;
            if (i < 3) {
                types = ['slime'];
            } else if (i < 6) {
                types = ['slime', 'green_slime'];
            } else if (i < 9) {
                types = ['slime', 'green_slime', 'dog'];
            } else {
                types = ['slime', 'green_slime', 'dog', 'golem'];
            }
            
            room.spawnEnemies(enemyCount, types);
            this.rooms.push(room);
        }
        
        // Boss room - Room 11
        const bossMap = this.customMaps[11] ? await this.getMapData(11) : null;
        const bossRoom = new Room(this.roomWidth, this.roomHeight, 'boss', 'boss', bossMap);
        bossRoom.spawnEnemies(1, ['mushroom_boss']);
        this.rooms.push(bossRoom);
        
        this.currentRoomIndex = 0;
    }
    
    /**
     * Set custom map for a specific room
     * @param {number} roomIndex - Index of the room (0-11)
     * @param {string|Object} mapPathOrData - Path to JSON file or map data object
     */
    setCustomMap(roomIndex, mapPathOrData) {
        if (roomIndex >= 0 && roomIndex < 15) {
            this.customMaps[roomIndex] = mapPathOrData;
        }
    }
    
    /**
     * Get map data for a room (loads if needed)
     * @param {number} roomIndex - Index of the room
     * @returns {Promise<Object|null>} - Map data or null
     */
    async getMapData(roomIndex) {
        const mapRef = this.customMaps[roomIndex];
        if (!mapRef) {
            console.log(`No custom map set for room ${roomIndex}`);
            return null;
        }
        
        console.log(`Loading map for room ${roomIndex}:`, mapRef);
        
        // If it's a string, try to load it
        if (typeof mapRef === 'string') {
            const mapData = await this.tileMapLoader.loadMap(mapRef);
            if (mapData) {
                console.log(`Successfully loaded map for room ${roomIndex}:`, mapData);
            } else {
                console.error(`Failed to load map for room ${roomIndex} from:`, mapRef);
            }
            return mapData;
        }
        
        // If it's already an object, return it
        if (typeof mapRef === 'object') {
            const mapData = this.tileMapLoader.loadMapSync(mapRef);
            console.log(`Using inline map data for room ${roomIndex}:`, mapData);
            return mapData;
        }
        
        return null;
    }
    
    /**
     * Load custom maps from a configuration
     * Override this method or call setCustomMap() to add custom maps
     */
    async loadCustomMaps() {
        // Load Tiled map from GitHub for room 1 (first normal room)
        // The map is in Tiled format (.tmj) and will be automatically converted
        this.setCustomMap(1, 'https://raw.githubusercontent.com/noriwokorders-crypto/RogueLike-game/667b018bf31a182c669dd5bd0d375eab8e38498b/room1.tmj');
        
        // You can add more rooms here:
        // this.setCustomMap(0, 'https://raw.githubusercontent.com/.../room0.tmj');  // Shop room
        // this.setCustomMap(2, 'https://raw.githubusercontent.com/.../room2.tmj');  // Room 2
        // etc.
        
        // Or load from local files:
        // this.setCustomMap(0, 'maps/room_0_shop.json');
        // this.setCustomMap(1, 'maps/room_1.json');
        
        // Or use inline map data:
        // this.setCustomMap(0, { tiles: [...], doors: [...] });
    }

    getCurrentRoom() {
        return this.rooms[this.currentRoomIndex];
    }

    changeRoom(direction) {
        // Simple room progression for now
        if (direction === 'right' || direction === 'down') {
            if (this.currentRoomIndex < this.rooms.length - 1) {
                this.currentRoomIndex++;
                return true;
            }
        } else if (direction === 'left' || direction === 'up') {
            if (this.currentRoomIndex > 0) {
                this.currentRoomIndex--;
                return true;
            }
        }
        return false;
    }
}

