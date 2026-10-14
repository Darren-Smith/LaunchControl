class Camera {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.x = 0;
        this.y = 0;
    }

    follow(entity, mapWidth, mapHeight) {
        // Center on entity
        this.x = entity.x + entity.width / 2 - this.width / 2;
        this.y = entity.y + entity.height / 2 - this.height / 2;

        // Clamp to map bounds
        this.x = Math.max(0, Math.min(this.x, mapWidth - this.width));
        this.y = Math.max(0, Math.min(this.y, mapHeight - this.height));
    }
}
