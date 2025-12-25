// Bullet/Projectile system

class Bullet {
    constructor(x, y, angle, speed, damage, isPlayerBullet = false) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = speed;
        this.damage = damage;
        this.isPlayerBullet = isPlayerBullet;
        this.radius = isPlayerBullet ? 8 : 6;
        this.active = true;
        this.lifetime = 0;
        this.maxLifetime = isPlayerBullet ? 2.0 : 3.0;
    }

    update(deltaTime) {
        this.lifetime += deltaTime;
        if (this.lifetime >= this.maxLifetime) {
            this.active = false;
            return;
        }

        const dx = Math.cos(this.angle) * this.speed * deltaTime;
        const dy = Math.sin(this.angle) * this.speed * deltaTime;
        this.x += dx;
        this.y += dy;
    }

    draw(ctx, camera) {
        if (!this.active) return;

        // Camera transform is already applied in render(), so just draw at world position
        ctx.save();
        ctx.translate(this.x, this.y);

        if (this.isPlayerBullet) {
            // Javelin - longer, spear-like
            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(this.angle) * 20, Math.sin(this.angle) * 20);
            ctx.stroke();
            
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Enemy bullet
            ctx.fillStyle = '#ff4444';
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#ff8888';
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * 0.6, 0, Math.PI * 2);
            ctx.fill();
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

