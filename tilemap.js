// Tile Map Loader System
// Supports loading custom tile maps from JSON files
// Supports both custom JSON format and Tiled (.tmj) format
// Renders actual tile images from tilesets

class TileMapLoader {
    constructor() {
        this.loadedMaps = new Map(); // Cache loaded maps
        this.loadedTilesets = new Map(); // Cache loaded tileset images
        this.tilesetImages = new Map(); // Cache tile images by GID
    }
    
    /**
     * Convert Tiled map format to our internal format
     * @param {Object} tiledMap - Tiled map JSON object
     * @returns {Object} - Converted map data
     */
    async convertTiledMap(tiledMap, mapPath = null) {
        console.log('Converting Tiled map:', tiledMap);
        
        if (!tiledMap || !tiledMap.layers || !Array.isArray(tiledMap.layers)) {
            throw new Error('Invalid Tiled map format');
        }
        
        const width = tiledMap.width || ROOM_WIDTH_TILES;
        const height = tiledMap.height || ROOM_HEIGHT_TILES;
        const tileSize = tiledMap.tilewidth || TILE_SIZE;
        
        console.log(`Tiled map dimensions: ${width}x${height}, tileSize: ${tileSize}`);
        console.log(`Number of layers: ${tiledMap.layers.length}`);
        
        // Load tileset images (pass mapPath for resolving relative paths)
        if (tiledMap.tilesets && Array.isArray(tiledMap.tilesets)) {
            await this.loadTilesets(tiledMap.tilesets, mapPath);
        }
        
        // Initialize tiles array (0 = empty, 1 = wall/obstacle)
        // Also store tile GIDs for rendering - use array of arrays to store per-layer
        const tiles = new Array(width * height).fill(0);
        const layerTileGIDs = []; // Store GIDs per layer for proper rendering order
        const doors = [];
        
        // Process each layer
        tiledMap.layers.forEach((layer, layerIndex) => {
            console.log(`Processing layer ${layerIndex}: "${layer.name}" (type: ${layer.type})`);
            
            if (layer.type === 'tilelayer' && layer.data && Array.isArray(layer.data)) {
                console.log(`  Layer has ${layer.data.length} tiles`);
                let wallsAdded = 0;
                
                // Create GID array for this layer
                const layerGIDs = new Array(width * height).fill(0);
                
                // Get layer offset (Tiled can have layer offsets)
                const layerOffsetX = layer.offsetx || layer.x || 0;
                const layerOffsetY = layer.offsety || layer.y || 0;
                
                // Process tile layer
                for (let y = 0; y < height; y++) {
                    for (let x = 0; x < width; x++) {
                        const tileIndex = y * width + x;
                        const tileId = layer.data[tileIndex];
                        
                        // Check if this is a wall/obstacle tile
                        // Tiled uses 0 for empty, any non-zero is a tile
                        if (tileId !== 0) {
                            // Store the tile GID for this layer
                            layerGIDs[tileIndex] = tileId;
                            
                            // "Tile Layer 1" - base layer (walls/borders)
                            // Only create obstacles for interior walls, not decorative borders
                            // Skip border tiles (first/last row and column) to avoid invisible walls
                            const isBorderTile = (x === 0 || x === width - 1 || y === 0 || y === height - 1);
                            
                            if (layer.name === 'Tile Layer 1' || layer.name.toLowerCase().includes('base') || 
                                (layer.name.toLowerCase().includes('tile') && !layer.name.toLowerCase().includes('object'))) {
                                // Check if it's a wall tile (not floor)
                                // Floor tiles are typically 12, walls are 1-3, 11, 13, 21-23
                                // For this specific map format: 12 = floor, everything else = wall
                                // Skip border tiles to avoid invisible walls where there are no visual obstacles
                                if (tileId !== 12 && !isBorderTile) { // 12 is floor, everything else is wall (but skip borders)
                                    tiles[tileIndex] = 1;
                                    wallsAdded++;
                                }
                            }
                            // "Objects Layer" - obstacles layer (trees, rocks, etc.)
                            else if (layer.name === 'Objects Layer' || layer.name.toLowerCase().includes('object') || 
                                     layer.name.toLowerCase().includes('obstacle')) {
                                // Objects are obstacles (tile IDs 41, 49, etc.)
                                // Any non-zero value in objects layer is an obstacle
                                tiles[tileIndex] = 1;
                                wallsAdded++;
                            }
                        }
                    }
                }
                console.log(`  Added ${wallsAdded} obstacles from this layer`);
                
                // Store this layer's GIDs with offset info
                layerTileGIDs.push({
                    name: layer.name,
                    gids: layerGIDs,
                    offsetx: layerOffsetX,
                    offsety: layerOffsetY
                });
            } else if (layer.type === 'objectgroup') {
                // Process object layer for doors and special objects
                if (layer.objects && Array.isArray(layer.objects)) {
                    layer.objects.forEach(obj => {
                        // Check if object is a door
                        if (obj.name && obj.name.toLowerCase().includes('door')) {
                            const direction = this.detectDoorDirection(obj, width * tileSize, height * tileSize);
                            if (direction) {
                                doors.push({
                                    x: obj.x || 0,
                                    y: obj.y || 0,
                                    width: obj.width || 64,
                                    height: obj.height || 20,
                                    direction: direction
                                });
                            }
                        }
                    });
                }
            }
        });
        
        // If no doors specified, generate default doors
        if (doors.length === 0) {
            doors.push(...this.generateDefaultDoors(width, height, tileSize));
            console.log('Generated default doors:', doors);
        }
        
        // Count obstacles
        const obstacleCount = tiles.filter(t => t === 1).length;
        console.log(`Converted map: ${obstacleCount} obstacles, ${doors.length} doors`);
        
        // Create combined tileGIDs array (for collision detection)
        // Use the last non-zero GID from all layers (top layer wins)
        const tileGIDs = new Array(width * height).fill(0);
        layerTileGIDs.forEach(layerData => {
            for (let i = 0; i < layerData.gids.length; i++) {
                if (layerData.gids[i] !== 0) {
                    tileGIDs[i] = layerData.gids[i];
                }
            }
        });
        
        const converted = {
            width: width,
            height: height,
            tileSize: tileSize,
            tiles: tiles,
            tileGIDs: tileGIDs, // Combined GIDs for collision
            layerTileGIDs: layerTileGIDs, // Per-layer GIDs for rendering in order
            tilesets: tiledMap.tilesets || [], // Store tileset info
            layers: tiledMap.layers || [], // Store layer info for rendering
            doors: doors,
            locked: false
        };
        
        console.log('Converted map data:', converted);
        return converted;
    }
    
    /**
     * Load tileset images from GitHub
     * @param {Array} tilesets - Array of tileset definitions from Tiled
     * @param {string} mapPath - Path to the map file (for resolving relative paths)
     */
    async loadTilesets(tilesets, mapPath = null) {
        const baseUrl = 'https://raw.githubusercontent.com/noriwokorders-crypto/RogueLike-game/667b018bf31a182c669dd5bd0d375eab8e38498b/';
        
        const loadPromises = [];
        
        for (const tileset of tilesets) {
            if (tileset.source) {
                // Resolve tileset path
                // Files are actually in the commit hash directory, not in subdirectories
                let tsxPath;
                if (tileset.source.startsWith('../')) {
                    // Remove ../ and any directory path, just get the filename
                    // e.g., "../Platformer Game/Tree1.tsx" -> "Tree1.tsx"
                    const pathParts = tileset.source.replace(/^\.\.\//, '').replace(/\\/g, '/').split('/');
                    const filename = pathParts[pathParts.length - 1]; // Get just the filename
                    tsxPath = baseUrl + filename;
                    console.log(`Relative path "${tileset.source}" -> extracted filename "${filename}" -> ${tsxPath}`);
                } else if (tileset.source.startsWith('./')) {
                    // Remove ./ and use baseUrl
                    const cleanPath = tileset.source.replace(/^\.\//, '').replace(/\\/g, '/');
                    tsxPath = baseUrl + cleanPath;
                } else {
                    // Absolute path or relative to base (like Tilemap_Flat.tsx)
                    tsxPath = baseUrl + tileset.source.replace(/\\/g, '/');
                }
                
                console.log(`Loading tileset: ${tsxPath} (from source: ${tileset.source})`);
                
                const loadPromise = (async () => {
                    try {
                        // Try multiple path variations (spaces might be encoded differently in GitHub)
                        let response = null;
                        let finalPath = tsxPath;
                        
                        // Try the commit hash path first
                        console.log(`Trying tileset path: ${tsxPath}`);
                        response = await fetch(tsxPath);
                        
                        // If 404, try on main branch (some files might be on main)
                        if (!response.ok && response.status === 404) {
                            const mainBranchUrl = tsxPath.replace(/\/667b018bf31a182c669dd5bd0d375eab8e38498b\//, '/main/');
                            console.log(`Trying main branch: ${mainBranchUrl}`);
                            const mainResponse = await fetch(mainBranchUrl);
                            if (mainResponse.ok) {
                                response = mainResponse;
                                finalPath = mainBranchUrl;
                                console.log(`✓ Found tileset on main branch: ${mainBranchUrl}`);
                            }
                        }
                        
                        if (response.ok) {
                            if (finalPath !== tsxPath) {
                                console.log(`✓ Using path: ${finalPath}`);
                            } else {
                                console.log(`✓ Found tileset at: ${tsxPath}`);
                            }
                        } else {
                            console.error(`✗ Failed to fetch tileset: ${response.status} ${response.statusText}`);
                            console.error(`  Tried: ${tsxPath}`);
                            if (finalPath !== tsxPath) {
                                console.error(`  Also tried: ${finalPath}`);
                            }
                            console.error(`  Original source: ${tileset.source}`);
                            return;
                        }
                        
                        tsxPath = finalPath;
                        
                        const tsxData = await response.text();
                        const parser = new DOMParser();
                        const xmlDoc = parser.parseFromString(tsxData, 'text/xml');
                        
                        // Check for parsing errors
                        const parseError = xmlDoc.querySelector('parsererror');
                        if (parseError) {
                            console.error(`XML parse error for ${tsxPath}:`, parseError.textContent);
                            return;
                        }
                        
                        // Get image source from tileset
                        const imageElement = xmlDoc.querySelector('image');
                        if (imageElement) {
                            const imageSource = imageElement.getAttribute('source');
                            
                            // Resolve image path - images are in the same directory as the tileset file
                            let imagePath;
                            if (imageSource.startsWith('../')) {
                                // Extract just the filename (same as tileset)
                                const pathParts = imageSource.replace(/^\.\.\//, '').replace(/\\/g, '/').split('/');
                                const filename = pathParts[pathParts.length - 1];
                                // Use the same directory as the tileset file
                                const tsxDir = finalPath.substring(0, finalPath.lastIndexOf('/') + 1);
                                imagePath = tsxDir + filename;
                            } else if (imageSource.startsWith('./')) {
                                // Remove ./ and use tileset directory
                                const cleanPath = imageSource.replace(/^\.\//, '').replace(/\\/g, '/');
                                const tsxDir = finalPath.substring(0, finalPath.lastIndexOf('/') + 1);
                                imagePath = tsxDir + cleanPath;
                            } else {
                                // Image is in the same directory as the tileset file
                                const tsxDir = finalPath.substring(0, finalPath.lastIndexOf('/') + 1);
                                imagePath = tsxDir + imageSource.replace(/\\/g, '/');
                            }
                            
                            console.log(`Loading tileset image: ${imagePath} (from source: ${imageSource})`);
                            
                            // Get tileset attributes
                            const tilesetElement = xmlDoc.querySelector('tileset');
                            const tileWidth = parseInt(tilesetElement?.getAttribute('tilewidth')) || 64;
                            const tileHeight = parseInt(tilesetElement?.getAttribute('tileheight')) || 64;
                            const columns = parseInt(tilesetElement?.getAttribute('columns')) || 1;
                            
                            // Check for animation (animated tiles) and collision data
                            const animatedTiles = new Map();
                            const collisionData = new Map(); // Store collision objects per tile
                            const tileElements = xmlDoc.querySelectorAll('tile');
                            tileElements.forEach(tileEl => {
                                const tileId = parseInt(tileEl.getAttribute('id'));
                                
                                // Check for animation
                                const animationEl = tileEl.querySelector('animation');
                                if (animationEl) {
                                    const frames = [];
                                    animationEl.querySelectorAll('frame').forEach(frameEl => {
                                        frames.push({
                                            tileid: parseInt(frameEl.getAttribute('tileid')),
                                            duration: parseInt(frameEl.getAttribute('duration')) || 100
                                        });
                                    });
                                    if (frames.length > 0) {
                                        animatedTiles.set(tileId, frames);
                                    }
                                }
                                
                                // Extract collision objects
                                const objectGroupEl = tileEl.querySelector('objectgroup');
                                if (objectGroupEl) {
                                    const collisionObjects = [];
                                    objectGroupEl.querySelectorAll('object').forEach(objEl => {
                                        const objX = parseFloat(objEl.getAttribute('x')) || 0;
                                        const objY = parseFloat(objEl.getAttribute('y')) || 0;
                                        const objWidth = parseFloat(objEl.getAttribute('width')) || 0;
                                        const objHeight = parseFloat(objEl.getAttribute('height')) || 0;
                                        
                                        // Check if it's an ellipse (circle collision)
                                        const isEllipse = objEl.querySelector('ellipse') !== null;
                                        
                                        collisionObjects.push({
                                            x: objX,
                                            y: objY,
                                            width: objWidth,
                                            height: objHeight,
                                            isEllipse: isEllipse
                                        });
                                    });
                                    if (collisionObjects.length > 0) {
                                        collisionData.set(tileId, collisionObjects);
                                    }
                                }
                            });
                            
                            // Load the image
                            const img = new Image();
                            img.crossOrigin = 'anonymous';
                            
                            await new Promise((resolve, reject) => {
                                img.onload = () => {
                                    this.tilesetImages.set(tileset.firstgid, {
                                        image: img,
                                        firstgid: tileset.firstgid,
                                        tileWidth: tileWidth,
                                        tileHeight: tileHeight,
                                        columns: columns,
                                        animatedTiles: animatedTiles.size > 0 ? animatedTiles : null,
                                        collisionData: collisionData.size > 0 ? collisionData : null
                                    });
                                    console.log(`✓ Loaded tileset image for GID ${tileset.firstgid} (${tileWidth}x${tileHeight}, ${columns} columns${animatedTiles.size > 0 ? `, ${animatedTiles.size} animated tiles` : ''})`);
                                    resolve();
                                };
                                img.onerror = (e) => {
                                    console.warn(`✗ Failed to load tileset image: ${imagePath}`, e);
                                    resolve(); // Don't reject, just continue
                                };
                                img.src = imagePath;
                            });
                        } else {
                            console.warn(`No image element found in tileset ${tsxPath}`);
                        }
                    } catch (error) {
                        console.warn(`Error loading tileset ${tileset.source}:`, error);
                    }
                })();
                
                loadPromises.push(loadPromise);
            }
        }
        
        // Wait for all tilesets to load
        await Promise.all(loadPromises);
        console.log(`Loaded ${this.tilesetImages.size} tileset images`);
    }
    
    /**
     * Get tile image for a given GID
     * @param {number} gid - Global tile ID
     * @returns {Object|null} - Tile image info or null
     */
    getTileImage(gid) {
        if (gid === 0) return null;
        
        // Find which tileset this GID belongs to
        let tilesetInfo = null;
        let localTileId = gid;
        
        // Find the tileset with the highest firstgid that's <= gid
        for (const [firstgid, info] of this.tilesetImages.entries()) {
            if (firstgid <= gid) {
                if (!tilesetInfo || firstgid > tilesetInfo.firstgid) {
                    tilesetInfo = info;
                    localTileId = gid - firstgid;
                }
            }
        }
        
        if (!tilesetInfo) return null;
        
        return {
            image: tilesetInfo.image,
            localTileId: localTileId,
            tileWidth: tilesetInfo.tileWidth,
            tileHeight: tilesetInfo.tileHeight,
            columns: tilesetInfo.columns,
            collisionData: tilesetInfo.collisionData ? tilesetInfo.collisionData.get(localTileId) : null
        };
    }
    
    /**
     * Detect door direction from object position
     * @param {Object} obj - Object from Tiled
     * @param {number} roomWidth - Room width in pixels
     * @param {number} roomHeight - Room height in pixels
     * @returns {string|null} - Direction or null
     */
    detectDoorDirection(obj, roomWidth, roomHeight) {
        const x = obj.x || 0;
        const y = obj.y || 0;
        const threshold = 50; // Pixels from edge
        
        // Check which edge the door is on
        if (y < threshold) return 'up';
        if (y > roomHeight - threshold) return 'down';
        if (x < threshold) return 'left';
        if (x > roomWidth - threshold) return 'right';
        
        // Try to detect from object properties
        if (obj.properties) {
            const dirProp = obj.properties.find(p => p.name === 'direction' || p.name === 'dir');
            if (dirProp) {
                return dirProp.value.toLowerCase();
            }
        }
        
        return null;
    }
    
    /**
     * Load a tile map from a JSON file
     * Supports both custom format and Tiled (.tmj) format
     * @param {string} mapPath - Path to the JSON map file
     * @returns {Promise<Object>} - Map data object
     */
    async loadMap(mapPath) {
        // Check cache first
        if (this.loadedMaps.has(mapPath)) {
            return this.loadedMaps.get(mapPath);
        }
        
        try {
            const response = await fetch(mapPath);
            if (!response.ok) {
                throw new Error(`Failed to load map: ${response.statusText}`);
            }
            
            const mapData = await response.json();
            
            // Store the map path for resolving relative tileset paths
            this.currentMapPath = mapPath;
            
            // Check if it's a Tiled map format
            let convertedData;
            if (this.isTiledFormat(mapData)) {
                convertedData = await this.convertTiledMap(mapData, mapPath);
            } else {
                // Custom format - validate and use as-is
                this.validateMapData(mapData);
                convertedData = mapData;
            }
            
            // Cache the map
            this.loadedMaps.set(mapPath, convertedData);
            
            return convertedData;
        } catch (error) {
            console.error(`Error loading map from ${mapPath}:`, error);
            return null;
        }
    }
    
    /**
     * Resolve a relative path from the map file location
     * @param {string} relativePath - Relative path from tileset source
     * @param {string} mapPath - Full path to the map file
     * @returns {string} - Resolved absolute path
     */
    resolveTilesetPath(relativePath, mapPath) {
        // Parse the map path
        const mapUrl = new URL(mapPath);
        
        // Get the directory path (everything before the filename)
        // e.g., "/noriwokorders-crypto/RogueLike-game/667b018bf31a182c669dd5bd0d375eab8e38498b/room1.tmj"
        // becomes "/noriwokorders-crypto/RogueLike-game/667b018bf31a182c669dd5bd0d375eab8e38498b/"
        const mapPathname = mapUrl.pathname;
        const lastSlash = mapPathname.lastIndexOf('/');
        const mapDir = mapPathname.substring(0, lastSlash + 1);
        
        // Normalize the relative path
        const normalizedRelative = relativePath.replace(/\\/g, '/');
        
        // For GitHub raw URLs, we need to preserve the commit hash
        // The path structure is: /owner/repo/commit-hash/file
        // When we have ../Platformer Game/, we want to stay in the commit-hash directory
        
        // Split the directory into parts
        const dirParts = mapDir.split('/').filter(p => p !== '');
        // dirParts should be: ['noriwokorders-crypto', 'RogueLike-game', '667b018bf31a182c669dd5bd0d375eab8e38498b']
        
        // Split relative path
        const relParts = normalizedRelative.split('/').filter(p => p !== '' && p !== '.');
        
        // Process relative parts
        // Special handling: if the relative path starts with ../ and we're in a commit hash directory,
        // we might need to keep the commit hash. But let's first try the standard resolution.
        for (const part of relParts) {
            if (part === '..') {
                // Standard: go up one directory
                if (dirParts.length > 0) {
                    dirParts.pop();
                }
            } else {
                dirParts.push(part);
            }
        }
        
        // After processing, if we lost the commit hash (dirParts.length < 3), 
        // it means the files might actually be in the commit hash directory
        // Let's try adding the commit hash back if it looks like a hash (40 char hex)
        if (dirParts.length >= 2) {
            const repoName = dirParts[1]; // Should be 'RogueLike-game'
            // Check if we have a commit hash in the original path
            const originalParts = mapPathname.split('/').filter(p => p !== '');
            if (originalParts.length >= 3) {
                const possibleHash = originalParts[2];
                // Check if it looks like a commit hash (40 hex characters)
                if (possibleHash && possibleHash.length === 40 && /^[0-9a-f]+$/i.test(possibleHash)) {
                    // If we don't have it in the resolved path, add it back
                    if (dirParts.length === 2 || dirParts[2] !== possibleHash) {
                        dirParts.splice(2, 0, possibleHash);
                    }
                }
            }
        }
        
        // Reconstruct the full URL
        const resolvedPath = '/' + dirParts.join('/');
        const resolvedUrl = `${mapUrl.protocol}//${mapUrl.host}${resolvedPath}`;
        
        console.log(`Path resolution: "${relativePath}" from "${mapPath}" -> "${resolvedUrl}"`);
        return resolvedUrl;
    }
    
    /**
     * Check if map data is in Tiled format
     * @param {Object} mapData - Map data to check
     * @returns {boolean} - True if Tiled format
     */
    isTiledFormat(mapData) {
        // Tiled maps have these properties
        return mapData.tiledversion !== undefined || 
               (mapData.layers && Array.isArray(mapData.layers) && mapData.layers.length > 0 && mapData.layers[0].type === 'tilelayer') ||
               mapData.orientation === 'orthogonal';
    }
    
    /**
     * Load a map synchronously (if already loaded or from object)
     * @param {Object|string} mapDataOrPath - Map data object or path to JSON
     * @returns {Object|null} - Map data object
     */
    loadMapSync(mapDataOrPath) {
        // If it's already an object, check format and convert if needed
        if (typeof mapDataOrPath === 'object' && mapDataOrPath !== null) {
            if (this.isTiledFormat(mapDataOrPath)) {
                return this.convertTiledMap(mapDataOrPath);
            } else {
                this.validateMapData(mapDataOrPath);
                return mapDataOrPath;
            }
        }
        
        // If it's a path, check cache
        if (typeof mapDataOrPath === 'string') {
            if (this.loadedMaps.has(mapDataOrPath)) {
                return this.loadedMaps.get(mapDataOrPath);
            }
        }
        
        return null;
    }
    
    /**
     * Validate map data structure
     * @param {Object} mapData - Map data to validate
     */
    validateMapData(mapData) {
        if (!mapData) {
            throw new Error('Map data is null or undefined');
        }
        
        // Check if it has tiles array or obstacles array
        if (!mapData.tiles && !mapData.obstacles) {
            console.warn('Map data missing tiles or obstacles array');
        }
        
        // Validate doors if present
        if (mapData.doors && !Array.isArray(mapData.doors)) {
            throw new Error('Map doors must be an array');
        }
    }
    
    /**
     * Create a map data object from a 2D array (for easy manual creation)
     * @param {Array<Array<number>>} tileGrid - 2D array where 0=empty, 1=wall
     * @param {Array<Object>} doors - Array of door objects
     * @param {Object} options - Additional options
     * @returns {Object} - Map data object
     */
    createMapFromGrid(tileGrid, doors = null, options = {}) {
        const width = tileGrid[0] ? tileGrid[0].length : 0;
        const height = tileGrid.length;
        const tiles = [];
        
        // Flatten 2D array to 1D
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                tiles.push(tileGrid[y][x] || 0);
            }
        }
        
        const mapData = {
            width: width,
            height: height,
            tileSize: options.tileSize || TILE_SIZE,
            tiles: tiles,
            doors: doors || this.generateDefaultDoors(width, height, options.tileSize || TILE_SIZE),
            locked: options.locked || false
        };
        
        return mapData;
    }
    
    /**
     * Generate default door positions for a map
     * @param {number} widthTiles - Width in tiles
     * @param {number} heightTiles - Height in tiles
     * @param {number} tileSize - Size of each tile
     * @returns {Array<Object>} - Array of door objects
     */
    generateDefaultDoors(widthTiles, heightTiles, tileSize) {
        const doorSize = tileSize;
        const doorThickness = 20;
        const roomWidth = widthTiles * tileSize;
        const roomHeight = heightTiles * tileSize;
        
        const centerX = Math.floor(widthTiles / 2) * tileSize;
        const centerY = Math.floor(heightTiles / 2) * tileSize;
        
        return [
            { x: centerX - doorSize / 2, y: 0, width: doorSize, height: doorThickness, direction: 'up' },
            { x: centerX - doorSize / 2, y: roomHeight - doorThickness, width: doorSize, height: doorThickness, direction: 'down' },
            { x: 0, y: centerY - doorSize / 2, width: doorThickness, height: doorSize, direction: 'left' },
            { x: roomWidth - doorThickness, y: centerY - doorSize / 2, width: doorThickness, height: doorSize, direction: 'right' }
        ];
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TileMapLoader;
}

