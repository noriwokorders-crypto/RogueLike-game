// Player system

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 32;
        this.height = 32;
        this.velocity = new Vec2(0, 0);
        this.speed = 200;
        this.maxHealth = 100;
        this.health = 100;
        this.gold = 0;
        this.level = 1;
        
        // Combat stats
        this.damage = 10;
        this.defense = 0;
        this.attackRange = 40;
        this.attackCooldown = 0;
        this.attackCooldownTime = 0.5;
        this.isAttacking = false;
        this.attackTimer = 0;
        this.attackDuration = 0.2;
        
        // Javelin
        this.javelinCooldown = 0;
        this.javelinCooldownTime = 1.0;
        
        // Potion
        this.potions = 3;
        this.potionHealAmount = 50;
        this.potionCooldown = 0;
        this.potionCooldownTime = 0.5;
        
        // Auto attack
        this.autoAttack = true;
        this.autoAttackTimer = 0;
        this.autoAttackInterval = 0.6;
        
        // Visual
        this.facingAngle = 0;
    }

    update(deltaTime, input, enemies, bullets, camera) {
        // Update cooldowns
        this.attackCooldown = Math.max(0, this.attackCooldown - deltaTime);
        this.javelinCooldown = Math.max(0, this.javelinCooldown - deltaTime);
        this.potionCooldown = Math.max(0, this.potionCooldown - deltaTime);
        
        // Movement - support both keyboard and touch joystick
        let moveX = 0;
        let moveY = 0;
        
        // Keyboard controls (PC)
        if (input.isKeyDown('w')) moveY -= 1;
        if (input.isKeyDown('s')) moveY += 1;
        if (input.isKeyDown('a')) moveX -= 1;
        if (input.isKeyDown('d')) moveX += 1;
        
        // Touch joystick controls (Mobile)
        const joystickDir = input.getJoystickDirection();
        if (joystickDir.x !== 0 || joystickDir.y !== 0) {
            moveX = joystickDir.x;
            moveY = joystickDir.y;
        }
        
        if (moveX !== 0 || moveY !== 0) {
            const moveDir = new Vec2(moveX, moveY).normalize();
            this.velocity = moveDir.multiply(this.speed);
            this.x += this.velocity.x * deltaTime;
            this.y += this.velocity.y * deltaTime;
        } else {
            this.velocity = new Vec2(0, 0);
        }
        
        // Update facing angle based on mouse
        const mouseWorld = input.getMouseWorldPosition(camera);
        this.facingAngle = angleBetween({ x: this.x, y: this.y }, mouseWorld);
        
        // Attack
        if (this.isAttacking) {
            this.attackTimer -= deltaTime;
            if (this.attackTimer <= 0) {
                this.isAttacking = false;
            }
        }
        
        // Melee attack - support mouse, touch, and auto-attack
        const attackPressed = input.isMouseLeftPressed() || 
                              (input.touch.attackPressed && input.touch.x > 0);
        
        if (attackPressed || (this.autoAttack && this.autoAttackTimer <= 0 && this.attackCooldown <= 0)) {
            this.attack(enemies);
            if (this.autoAttack) {
                this.autoAttackTimer = this.autoAttackInterval;
            }
        }
        
        // Reset touch attack pressed flag
        if (input.touch.attackPressed) {
            input.touch.attackPressed = false;
        }
        
        if (this.autoAttack) {
            this.autoAttackTimer = Math.max(0, this.autoAttackTimer - deltaTime);
        }
        
        // Javelin throw - support right mouse, E key, and long press on mobile
        const javelinPressed = input.isMouseRightPressed() || 
                               input.isKeyPressed('e') ||
                               (input.touch.javelinPressed);
        
        if (javelinPressed) {
            this.throwJavelin(bullets, mouseWorld);
        }
        
        // Reset touch javelin pressed flag
        if (input.touch.javelinPressed) {
            input.touch.javelinPressed = false;
        }
        
        // Potion
        if (input.isKeyPressed(' ')) {
            this.drinkPotion();
        }
        
        // Position clamping will be handled by room system
    }

    attack(enemies) {
        if (this.attackCooldown > 0) return;
        
        this.isAttacking = true;
        this.attackTimer = this.attackDuration;
        this.attackCooldown = this.attackCooldownTime;
        
        // Check for enemies in attack range
        const attackPos = new Vec2(
            this.x + Math.cos(this.facingAngle) * this.attackRange,
            this.y + Math.sin(this.facingAngle) * this.attackRange
        );
        
        enemies.forEach(enemy => {
            if (!enemy.active) return;
            
            const dist = new Vec2(this.x, this.y).distance(new Vec2(enemy.x, enemy.y));
            if (dist <= this.attackRange + enemy.radius) {
                // Check if enemy is in front of player
                const toEnemy = angleBetween({ x: this.x, y: this.y }, { x: enemy.x, y: enemy.y });
                const angleDiff = Math.abs(this.facingAngle - toEnemy);
                if (angleDiff < Math.PI / 2 || angleDiff > 3 * Math.PI / 2) {
                    enemy.takeDamage(this.damage);
                }
            }
        });
    }

    throwJavelin(bullets, targetPos) {
        if (this.javelinCooldown > 0) return;
        
        this.javelinCooldown = this.javelinCooldownTime;
        
        const angle = angleBetween({ x: this.x, y: this.y }, targetPos);
        const javelin = new Bullet(this.x, this.y, angle, 400, this.damage * 1.5, true);
        bullets.push(javelin);
    }

    drinkPotion() {
        if (this.potionCooldown > 0 || this.potions <= 0 || this.health >= this.maxHealth) return;
        
        this.potionCooldown = this.potionCooldownTime;
        this.potions--;
        this.health = Math.min(this.maxHealth, this.health + this.potionHealAmount);
    }

    takeDamage(amount, camera = null, screenShakeEnabled = true) {
        const actualDamage = Math.max(1, amount - this.defense);
        this.health -= actualDamage;
        if (this.health < 0) this.health = 0;
        
        // Add screen shake on damage
        if (camera && screenShakeEnabled) {
            camera.addShake(5);
        }
        
        return actualDamage;
    }

    draw(ctx, camera) {
        // Camera transform is already applied in render(), so just draw at world position
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Player body
        ctx.fillStyle = '#4a90e2';
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        
        // Player face direction indicator
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(this.facingAngle) * 20, Math.sin(this.facingAngle) * 20);
        ctx.stroke();
        
        // Attack animation
        if (this.isAttacking) {
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(
                Math.cos(this.facingAngle) * this.attackRange,
                Math.sin(this.facingAngle) * this.attackRange,
                this.attackRange * 0.5,
                0,
                Math.PI * 2
            );
            ctx.stroke();
        }
        
        ctx.restore();
    }

    getCollisionRect() {
        return {
            x: this.x - this.width / 2,
            y: this.y - this.height / 2,
            width: this.width,
            height: this.height
        };
    }

    isAlive() {
        return this.health > 0;
    }
}

