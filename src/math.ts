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
}
