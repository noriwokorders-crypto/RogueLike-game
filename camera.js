// Camera system - Based on Rogue Isles style

class Camera {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.shakeX = 0;
        this.shakeY = 0;
        this.shakeIntensity = 0;
        this.shakeDecay = 0.9;
        // Smooth follow like Rogue Isles - camera smoothly follows player
        this.smoothFollow = true;
        this.followSpeed = 0.1; // Smooth following speed (lower = smoother)
    }

    follow(target, canvasWidth, canvasHeight, worldWidth, worldHeight) {
        if (!target || !canvasWidth || !canvasHeight) return;
        
        // Zoom out 20% (see 20% more area) - scale by 0.8 or viewport 1.25x larger
        // Make zoom factor flexible based on screen size for better adaptability
        const baseZoomOutFactor = 1.25; // 1.25x viewport = 20% zoom out
        const zoomOutFactor = baseZoomOutFactor;
        
        // Effective viewport size (larger = zoomed out, see more area)
        // Make it flexible for any screen size
        const effectiveWidth = canvasWidth * zoomOutFactor;
        const effectiveHeight = canvasHeight * zoomOutFactor;
        
        // Calculate target camera position (center on player)
        // Camera can move freely in ALL directions - no restrictions
        let targetX = target.x - effectiveWidth / 2;
        let targetY = target.y - effectiveHeight / 2;

        // Smooth follow - camera smoothly follows player
        this.x += (targetX - this.x) * this.followSpeed;
        this.y += (targetY - this.y) * this.followSpeed;
        
        // NO CLAMPING - Camera can move freely toward ANY side
        // Camera follows player everywhere, can show areas outside room
        // This makes camera flexible for any screen size and allows movement in all directions

        // Apply screen shake
        if (this.shakeIntensity > 0) {
            this.shakeX = (Math.random() - 0.5) * this.shakeIntensity;
            this.shakeY = (Math.random() - 0.5) * this.shakeIntensity;
            this.shakeIntensity *= this.shakeDecay;
            if (this.shakeIntensity < 0.1) {
                this.shakeIntensity = 0;
                this.shakeX = 0;
                this.shakeY = 0;
            }
        }
    }

    addShake(intensity) {
        this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    }

    getX() {
        return this.x + this.shakeX;
    }

    getY() {
        return this.y + this.shakeY;
    }
}

