import { Vector2 } from './math'

export class Grid {
    rows: number;
    cols: number;
    size: number;

    constructor(rows: number, cols: number, size: number) {
        this.rows = rows;
        this.cols = cols;
        this.size = size;
    }

    render(context: CanvasRenderingContext2D) {
        let min = new Vector2(this.cols, this.rows).mul(this.size * -0.5);
        let max = new Vector2(this.cols, this.rows).mul(this.size * 0.5);

        context.save();

        context.beginPath();

        for (let row = 0; row <= this.rows; row++) {
            if (row % 10 === 0) continue;
            context.moveTo(min.x + row * this.size, min.y);
            context.lineTo(min.x + row * this.size, max.y);
        }

        for (let col = 0; col <= this.cols; col++) {
            if (col % 10 === 0) continue;
            context.moveTo(min.x, min.y + col * this.size);
            context.lineTo(max.x, min.y + col * this.size);
        }
        
        context.strokeStyle = "#ddd";
        context.stroke();

        context.beginPath();

        for (let row = 0; row <= this.rows; row += 10) {
            context.moveTo(min.x + row * this.size, min.y);
            context.lineTo(min.x + row * this.size, max.y);
        }

        for (let col = 0; col <= this.cols; col += 10) {
            context.moveTo(min.x, min.y + col * this.size);
            context.lineTo(max.x, min.y + col * this.size);
        }
        
        context.strokeStyle = "#222";
        context.stroke();

        context.restore();
    }
}
