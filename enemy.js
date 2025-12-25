// Enemy system

class Enemy {
    constructor(x, y, type = 'slime') {
        this.x = x;
        this.y = y;
        this.type = type;
        this.active = true;
        this.state = 'idle'; // idle, chase, attack, dead
        this.stateTimer = 0;
        
        // Type-specific properties
        this.setupType();
        
        // Common properties
        this.velocity = new Vec2(0, 0);
        this.target = null;
        this.lastAttackTime = 0;
        this.goldDropped = false;
    }

    setupType() {
        switch (this.type) {
            case 'slime':
                this.radius = 20;
                this.maxHealth = 30;
                this.health = 30;
                this.speed = 80;
                this.damage = 5;
                this.attackRange = 30;
                this.attackCooldown = 1.5;
                this.color = '#4a9e4a';
                this.isRanged = false;
                break;
                
            case 'green_slime':
                this.radius = 22;
                this.maxHealth = 40;
                this.health = 40;
                this.speed = 70;
                this.damage = 8;
                this.attackRange = 200;
                this.attackCooldown = 2.0;
                this.color = '#2d7a2d';
                this.isRanged = true;
                this.bulletSpeed = 150;
                break;
                
            case 'golem':
                this.radius = 35;
                this.maxHealth = 150;
                this.health = 150;
                this.speed = 100;
                this.damage = 15;
                this.attackRange = 50;
                this.attackCooldown = 2.5;
                this.color = '#8b7355';
                this.isRanged = false;
                this.chargeSpeed = 300;
                this.chargeCooldown = 3.0;
                this.lastChargeTime = 0;
                break;
                
            case 'dog':
                this.radius = 25;
                this.maxHealth = 60;
                this.health = 60;
                this.speed = 120;
                this.damage = 10;
                this.attackRange = 40;
                this.attackCooldown = 1.8;
                this.color = '#654321';
                this.isRanged = false;
                this.chargeSpeed = 250;
                this.chargeCooldown = 2.5;
                this.lastChargeTime = 0;
                break;
                
            case 'mushroom_boss':
                this.radius = 50;
                this.maxHealth = 300;
                this.health = 300;
                this.speed = 60;
                this.damage = 20;
                this.attackRange = 300;
                this.attackCooldown = 1.5;
                this.color = '#8b4513';
                this.isRanged = true;
                this.bulletSpeed = 120;
                this.bulletCount = 8;
                break;
                
            default:
                this.radius = 20;
                this.maxHealth = 30;
                this.health = 30;
                this.speed = 80;
                this.damage = 5;
                this.attackRange = 30;
                this.attackCooldown = 1.5;
                this.color = '#4a9e4a';
                this.isRanged = false;
        }
    }

    update(deltaTime, player, bullets, room, camera = null, screenShakeEnabled = true) {
        if (!this.active || this.health <= 0) {
            this.active = false;
            return;
        }

        this.stateTimer += deltaTime;
        this.lastAttackTime += deltaTime;

        // Check if player is in range
        const distToPlayer = new Vec2(this.x, this.y).distance(new Vec2(player.x, player.y));
        
        if (distToPlayer < 400) {
            this.target = player;
            this.state = 'chase';
        } else {
            this.target = null;
            this.state = 'idle';
        }

        // State behavior
        if (this.state === 'chase' && this.target) {
            const direction = new Vec2(
                this.target.x - this.x,
                this.target.y - this.y
            ).normalize();
            
            // Special behaviors
            if (this.type === 'golem' || this.type === 'dog') {
                const timeSinceCharge = this.lastAttackTime - this.lastChargeTime;
                if (timeSinceCharge >= this.chargeCooldown && distToPlayer < 150) {
                    // Charge attack
                    this.velocity = direction.multiply(this.chargeSpeed);
                    this.lastChargeTime = this.lastAttackTime;
                } else {
                    this.velocity = direction.multiply(this.speed);
                }
            } else {
                this.velocity = direction.multiply(this.speed);
            }
            
            // Move
            this.x += this.velocity.x * deltaTime;
            this.y += this.velocity.y * deltaTime;
            
            // Keep in room bounds
            this.x = Math.max(this.radius, Math.min(this.x, room.width - this.radius));
            this.y = Math.max(this.radius, Math.min(this.y, room.height - this.radius));
            
            // Attack
            if (distToPlayer <= this.attackRange) {
                if (this.isRanged && this.lastAttackTime >= this.attackCooldown) {
                    this.rangedAttack(bullets, player);
                    this.lastAttackTime = 0;
                } else if (!this.isRanged && this.lastAttackTime >= this.attackCooldown) {
                    this.meleeAttack(player, camera, screenShakeEnabled);
                    this.lastAttackTime = 0;
                }
            }
        } else if (this.state === 'idle') {
            this.velocity = new Vec2(0, 0);
        }
    }

    meleeAttack(player, camera = null, screenShakeEnabled = true) {
        const dist = new Vec2(this.x, this.y).distance(new Vec2(player.x, player.y));
        if (dist <= this.attackRange) {
            player.takeDamage(this.damage, camera, screenShakeEnabled);
        }
    }

    rangedAttack(bullets, player) {
        if (this.type === 'mushroom_boss') {
            // Boss shoots multiple bullets in a circle
            for (let i = 0; i < this.bulletCount; i++) {
                const angle = (Math.PI * 2 / this.bulletCount) * i;
                const bullet = new Bullet(this.x, this.y, angle, this.bulletSpeed, this.damage, false);
                bullets.push(bullet);
            }
        } else {
            // Regular ranged attack
            const angle = angleBetween({ x: this.x, y: this.y }, { x: player.x, y: player.y });
            const bullet = new Bullet(this.x, this.y, angle, this.bulletSpeed, this.damage, false);
            bullets.push(bullet);
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            this.active = false;
            return true; // Enemy died
        }
        return false;
    }

    draw(ctx, camera) {
        if (!this.active) return;

        // Camera transform is already applied in render(), so just draw at world position
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Enemy body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Health bar
        if (this.health < this.maxHealth) {
            const barWidth = this.radius * 2;
            const barHeight = 4;
            const healthPercent = this.health / this.maxHealth;
            
            ctx.fillStyle = '#000';
            ctx.fillRect(-barWidth / 2, -this.radius - 10, barWidth, barHeight);
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(-barWidth / 2, -this.radius - 10, barWidth * healthPercent, barHeight);
        }
        
        // Boss indicator
        if (this.type === 'mushroom_boss') {
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 5, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        ctx.restore();
    }

    getCollisionCircle() {
        return {
            x: this.x,
            y: this.y,
            radius: this.radius
        };
    }
}

