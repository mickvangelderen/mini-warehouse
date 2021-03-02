import './index.css'
import { Vector2, Point2 } from './math';
import { Grid } from './grid';

interface State {
    canvas: HTMLCanvasElement,
    context: CanvasRenderingContext2D,
    tick: number,
    window_dims: Vector2,
    mouse_pos: Point2,
    mouse_down: boolean,
    camera_pos: Point2,
}


function render({ canvas, camera_pos, context, tick, window_dims, mouse_pos, mouse_down }: State) {

    let grid = new Grid(30, 30, 50);
    grid.render(context);

    context.beginPath();
    context.arc(mouse_pos.x, mouse_pos.y, 50, 0, 2 * Math.PI);
    context.strokeStyle = mouse_down ? 'blue' : 'black';
    context.stroke();
}

function queryBodyDims(): Vector2 {
    return new Vector2(document.body.clientWidth, document.body.clientHeight);
}

function setCanvasDims(canvas: HTMLCanvasElement, dims: Vector2) {
    canvas.width = dims.x;
    canvas.height = dims.y;
}

function main() {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (context == null) {
        throw new Error("2d context not supported");
    }

    let initialBodyDims = queryBodyDims();

    let state = {
        canvas,
        context,
        tick: 0,
        window_dims: initialBodyDims,
        mouse_pos: new Point2(0, 0),
        canvas_mouse_pos: new Point2(0, 0),
        mouse_down: false,
        camera_pos: new Point2(0, 0),
        zoom_level: 0.0,
        target_zoom_level: 0.0,
    };
 
    window.addEventListener("resize", _ => {
        state.window_dims = queryBodyDims();
    });

    window.addEventListener("mousedown", _ => {
        state.mouse_down = true;
    });

    window.addEventListener("mouseup", _ => {
        state.mouse_down = false;
    });

    canvas.addEventListener("wheel", event => {
        state.target_zoom_level = Math.max(-3, Math.min(3, state.target_zoom_level - event.deltaY / 100));
    });

    window.addEventListener("mousemove", event => {
        if (state.mouse_down) {
            let inv_zoom_scale = Math.pow(2.0, -state.zoom_level);
            state.camera_pos.add_assign(
                new Vector2(event.movementX, event.movementY).mul(inv_zoom_scale)
            );
        }

        state.canvas_mouse_pos = new Point2(
            event.clientX,
            event.clientY,
        );
    });

    document.body.appendChild(canvas);

    window.requestAnimationFrame(function self() {
        setCanvasDims(canvas, state.window_dims);

        state.context.clearRect(0, 0, canvas.width, canvas.height);

        state.context.save();
        
        state.context.translate(state.window_dims.x * 0.5, state.window_dims.y * 0.5);

        state.zoom_level = 0.6 * state.zoom_level + 0.4 * state.target_zoom_level;
        let zoom_scale = Math.pow(2.0, state.zoom_level);
        state.context.scale(zoom_scale, zoom_scale);

        state.context.translate(state.camera_pos.x, state.camera_pos.y);

        let mouse_pos = state.context.getTransform().invertSelf().transformPoint(state.canvas_mouse_pos);
        state.mouse_pos = new Point2(mouse_pos.x, mouse_pos.y);

        render(state);

        state.context.restore();

        window.requestAnimationFrame(self);
    });
}

main();
