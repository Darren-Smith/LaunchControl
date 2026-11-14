class Camera {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.x = 0;
        this.y = 0;
    }

    follow(entity, mapWidth, mapHeight) {
        // Target camera position centered on entity (slightly biased upward so player sees sky/platforms ahead)
        const targetX = entity.x + entity.width / 2 - this.width / 2;
        const targetY = entity.y + entity.height / 2 - this.height * 0.54;

        // Smooth camera interpolation
        this.x += (targetX - this.x) * 0.18;
        this.y += (targetY - this.y) * 0.18;

        // Clamp to map bounds
        this.x = Math.max(0, Math.min(this.x, mapWidth - this.width));
        this.y = Math.max(0, Math.min(this.y, mapHeight - this.height));
    }

    snapTo(entity, mapWidth, mapHeight) {
        this.x = entity.x + entity.width / 2 - this.width / 2;
        this.y = entity.y + entity.height / 2 - this.height * 0.54;
        this.x = Math.max(0, Math.min(this.x, mapWidth - this.width));
        this.y = Math.max(0, Math.min(this.y, mapHeight - this.height));
    }
}
