import './index.css'
import { Vector2, Point2 } from './math';
import { Grid } from './grid';

const CELL_SIZE: number = 50;

interface State {
    canvas: HTMLCanvasElement,
    context: CanvasRenderingContext2D,
    tick: number,
    window_dims: Vector2,
    mouse_pos: Point2,
    mouse_down: boolean,
    camera_pos: Point2,
    grid: Grid,
    stores: Store[],
}

class Store {
    pos: Point2;

    constructor(pos: Point2) {
        this.pos = pos;
    }

    render(context: CanvasRenderingContext2D) {
        context.save();
        context.fillStyle = "rgba(200, 255, 100, 1.0)";
        context.fillRect(this.pos.x, this.pos.y, CELL_SIZE, CELL_SIZE);
        context.restore();
    }
}

function render(state: State) {
    const { context } = state;

    state.grid.render(context);

    // find closest grid position by transforming into grid cell space, flooring and transforming back.
    const cell_pos = state.mouse_pos.to_vector()
    .add(new Vector2(
        state.grid.cols,
        state.grid.rows,
    ).mul(state.grid.size * 0.5))
    .mul(1.0/state.grid.size)
    .floor()
    .mul(state.grid.size)
    .add(new Vector2(
        state.grid.cols,
        state.grid.rows,
    ).mul(state.grid.size * -0.5))
    .to_point();

    context.save();
    context.fillStyle = "rgba(200, 255, 100, 0.5)";
    context.fillRect(cell_pos.x, cell_pos.y, CELL_SIZE, CELL_SIZE);
    context.restore();

    for (const store of state.stores) {
        store.render(context);
    }

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
        grid: new Grid(30, 30, CELL_SIZE),
        stores: [] as Store[],
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

    canvas.addEventListener("click", _ => {
        // FIXME: can I not do all of this shit to get the mouse position in world space?
        state.context.save();
        state.context.translate(state.window_dims.x * 0.5, state.window_dims.y * 0.5);
        let zoom_scale = Math.pow(2.0, state.zoom_level);
        state.context.scale(zoom_scale, zoom_scale);
        state.context.translate(state.camera_pos.x, state.camera_pos.y);
        let temp = state.context.getTransform().invertSelf().transformPoint(state.canvas_mouse_pos);
        const mouse_pos = new Point2(temp.x, temp.y);

        // find closest grid position by transforming into grid cell space, flooring and transforming back.
        const cell_pos = mouse_pos.to_vector()
            .add(new Vector2(
                state.grid.cols,
                state.grid.rows,
            ).mul(state.grid.size * 0.5))
            .mul(1.0/state.grid.size)
            .floor()
            .mul(state.grid.size)
            .add(new Vector2(
                state.grid.cols,
                state.grid.rows,
            ).mul(state.grid.size * -0.5))
            .to_point();

        state.stores.push(new Store(
            cell_pos
        ));

        state.context.restore();
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
