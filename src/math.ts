export class Vector2 {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    add(v: Vector2): Vector2 {
        return new Vector2(
            this.x + v.x,
            this.y + v.y,
        );
    }
    
    add_assign(v: Vector2): void {
        this.x += v.x;
        this.y += v.y;
    }

    mul(n: number): Vector2 {
        return new Vector2(
            this.x * n,
            this.y * n
        );
    }
    
    mul_assign(n: number): void {
        this.x *= n;
        this.y *= n;
    }

    round(): Vector2 {
        return new Vector2(
            Math.round(this.x),
            Math.round(this.y),
        );
    }

    floor(): Vector2 {
        return new Vector2(
            Math.floor(this.x),
            Math.floor(this.y),
        );
    }

    to_point(): Point2 {
        return new Point2(
            this.x,
            this.y
        );
    }

    static from_scalar(n: number): Vector2 {
        return new Vector2(n, n);
    }
}

export class Point2 {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    add(v: Vector2): Point2 {
        return new Point2(
            this.x + v.x,
            this.y + v.y,
        );
    }
    
    add_assign(v: Vector2): void {
        this.x += v.x;
        this.y += v.y;
    }

    to_vector(): Vector2 {
        return new Vector2(this.x, this.y);
    }
}
