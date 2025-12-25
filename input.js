// Input handling system

class InputManager {
    constructor() {
        this.keys = {};
        this.mouse = {
            x: 0,
            y: 0,
            left: false,
            right: false,
            leftPressed: false,
            rightPressed: false
        };
        
        // Touch controls
        this.touch = {
            x: 0,
            y: 0,
            active: false,
            moveX: 0,
            moveY: 0,
            attack: false,
            attackPressed: false,
            javelin: false,
            javelinPressed: false,
            longPressTimer: null
        };
        
        // Virtual joystick for movement
        this.joystick = {
            active: false,
            startX: 0,
            startY: 0,
            currentX: 0,
            currentY: 0,
            radius: 60
        };
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Keyboard
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });

        // Mouse
        window.addEventListener('mousemove', (e) => {
            const canvas = document.getElementById('gameCanvas');
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            this.mouse.x = (e.clientX - rect.left) * scaleX;
            this.mouse.y = (e.clientY - rect.top) * scaleY;
        });

        window.addEventListener('mousedown', (e) => {
            if (e.button === 0) {
                this.mouse.left = true;
                this.mouse.leftPressed = true;
            } else if (e.button === 2) {
                this.mouse.right = true;
                this.mouse.rightPressed = true;
            }
        });

        window.addEventListener('mouseup', (e) => {
            if (e.button === 0) {
                this.mouse.left = false;
            } else if (e.button === 2) {
                this.mouse.right = false;
            }
        });

        // Touch events
        const canvas = document.getElementById('gameCanvas');
        
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            
            for (let i = 0; i < e.touches.length; i++) {
                const touch = e.touches[i];
                const x = (touch.clientX - rect.left) * scaleX;
                const y = (touch.clientY - rect.top) * scaleY;
                
                // Left side = movement joystick
                if (x < canvas.width / 2) {
                    if (i === 0) {
                        this.joystick.active = true;
                        this.joystick.startX = x;
                        this.joystick.startY = y;
                        this.joystick.currentX = x;
                        this.joystick.currentY = y;
                    }
                }
                // Right side = attack/aim
                else {
                    this.touch.x = x;
                    this.touch.y = y;
                    this.touch.attack = true;
                    this.touch.attackPressed = true;
                    // Start long press timer for javelin
                    this.touch.longPressTimer = setTimeout(() => {
                        this.touch.javelinPressed = true;
                        this.touch.attackPressed = false;
                    }, 300);
                }
            }
            
            this.touch.active = true;
        }, { passive: false });
        
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            
            for (let i = 0; i < e.touches.length; i++) {
                const touch = e.touches[i];
                const x = (touch.clientX - rect.left) * scaleX;
                const y = (touch.clientY - rect.top) * scaleY;
                
                // Update joystick
                if (i === 0 && this.joystick.active && x < canvas.width / 2) {
                    this.joystick.currentX = x;
                    this.joystick.currentY = y;
                }
                
                // Update touch position for aiming
                if (x > canvas.width / 2) {
                    this.touch.x = x;
                    this.touch.y = y;
                }
            }
        }, { passive: false });
        
        canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            
            // Clear long press timer
            if (this.touch.longPressTimer) {
                clearTimeout(this.touch.longPressTimer);
                this.touch.longPressTimer = null;
            }
            
            if (e.touches.length === 0) {
                // All touches ended
                this.joystick.active = false;
                this.touch.active = false;
                this.touch.attack = false;
                this.touch.javelin = false;
            } else {
                // Some touches still active
                const rect = canvas.getBoundingClientRect();
                const scaleX = canvas.width / rect.width;
                const scaleY = canvas.height / rect.height;
                
                for (let i = 0; i < e.touches.length; i++) {
                    const touch = e.touches[i];
                    const x = (touch.clientX - rect.left) * scaleX;
                    
                    if (x < canvas.width / 2) {
                        this.joystick.currentX = x;
                        this.joystick.currentY = (touch.clientY - rect.top) * scaleY;
                    }
                }
            }
        }, { passive: false });
        
        canvas.addEventListener('touchcancel', (e) => {
            // Only prevent default if the event is cancelable
            if (e.cancelable) {
                e.preventDefault();
            }
            if (this.touch.longPressTimer) {
                clearTimeout(this.touch.longPressTimer);
                this.touch.longPressTimer = null;
            }
            this.joystick.active = false;
            this.touch.active = false;
            this.touch.attack = false;
            this.touch.javelin = false;
        }, { passive: false });

        // Prevent context menu and default touch behaviors
        window.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
        
        // Prevent scrolling on mobile
        document.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });
    }
    
    getJoystickDirection() {
        if (!this.joystick.active) return { x: 0, y: 0 };
        
        const dx = this.joystick.currentX - this.joystick.startX;
        const dy = this.joystick.currentY - this.joystick.startY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 10) return { x: 0, y: 0 };
        
        const maxDistance = this.joystick.radius;
        const clampedDistance = Math.min(distance, maxDistance);
        const angle = Math.atan2(dy, dx);
        
        return {
            x: Math.cos(angle) * (clampedDistance / maxDistance),
            y: Math.sin(angle) * (clampedDistance / maxDistance)
        };
    }

    isKeyDown(key) {
        return this.keys[key.toLowerCase()] || false;
    }

    isKeyPressed(key) {
        const pressed = this.keys[key.toLowerCase()] || false;
        if (pressed) {
            this.keys[key.toLowerCase()] = false; // Consume the key press
            return true;
        }
        return false;
    }

    getMousePosition() {
        return { x: this.mouse.x, y: this.mouse.y };
    }

    getMouseWorldPosition(camera) {
        const canvas = document.getElementById('gameCanvas');
        const rect = canvas.getBoundingClientRect();
        // Use touch position on mobile, mouse position on PC
        const posX = this.touch.active && this.touch.x > 0 ? this.touch.x : this.mouse.x;
        const posY = this.touch.active && this.touch.y > 0 ? this.touch.y : this.mouse.y;
        const camX = camera ? camera.getX() : 0;
        const camY = camera ? camera.getY() : 0;
        return {
            x: posX + camX,
            y: posY + camY
        };
    }

    isMouseLeftDown() {
        return this.mouse.left;
    }

    isMouseLeftPressed() {
        const pressed = this.mouse.leftPressed;
        this.mouse.leftPressed = false;
        return pressed;
    }

    isMouseRightDown() {
        return this.mouse.right;
    }

    isMouseRightPressed() {
        const pressed = this.mouse.rightPressed;
        this.mouse.rightPressed = false;
        return pressed;
    }

    update() {
        // Reset pressed states (handled in getter methods)
    }
}

