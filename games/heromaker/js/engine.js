class Engine {
    constructor(ctx, width, height) {
        this.ctx = ctx;
        this.width = width;   // canvas width
        this.height = height; // canvas height
        this.mapWidth = width; // world width — updated per level
        this.gravity = 800;
        this.platforms = [];
    }

    setPlatforms(platforms) {
        this.platforms = platforms;
    }

    addPlatform(x, y, w, h, color) {
        this.platforms.push({ x, y, w, h, color });
    }

    update(dt, entities) {
        entities.forEach(entity => {
            // Apply gravity
            entity.vy += this.gravity * dt;

            // Move X
            entity.x += entity.vx * dt;
            this.checkHorizontalCollisions(entity);

            // Move Y
            entity.y += entity.vy * dt;
            this.checkVerticalCollisions(entity);

            // World bounds (clamp to map, not canvas)
            if (entity.x < 0) entity.x = 0;
            if (entity.x + entity.width > this.mapWidth) entity.x = this.mapWidth - entity.width;
        });
    }

    checkHorizontalCollisions(entity) {
        // Placeholder for horizontal wall collisions
    }

    checkVerticalCollisions(entity) {
        entity.grounded = false;

        for (let platform of this.platforms) {
            if (entity.x < platform.x + platform.w &&
                entity.x + entity.width > platform.x &&
                entity.y + entity.height > platform.y &&
                entity.y < platform.y + platform.h) {

                // Falling down onto platform
                if (entity.vy > 0 && (entity.y + entity.height - entity.vy * 0.1) <= platform.y) {
                    entity.y = platform.y - entity.height;
                    entity.vy = 0;
                    entity.grounded = true;
                }
            }
        }
    }

    draw(camera) {
        this.platforms.forEach(p => {
            this.ctx.fillStyle = p.color;
            this.ctx.fillRect(p.x - camera.x, p.y - camera.y, p.w, p.h);
        });
    }
}
