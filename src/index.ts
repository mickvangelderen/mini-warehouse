import './index.css'
import { Vector2, Point2 } from './math';
import { Grid } from './grid';

const CELL_SIZE: number = 50;

enum Tool {
    None = 0,
    Store = 1,
    Track = 2,
}

interface State {
    canvas: HTMLCanvasElement,
    context: CanvasRenderingContext2D,
    tick: number,
    window_dims: Vector2,
    mouse_pos: Point2,
    mouse_down_pos: Point2 | null,
    camera_pos: Point2,
    grid: Grid,
    stores: Store[],
    tracks: Track[],
    tool: Tool,
}

class Store {
    pos: Point2;

    constructor(pos: Point2) {
        this.pos = pos;
    }

    render(context: CanvasRenderingContext2D) {
        context.save();
        context.fillStyle = "rgba(100, 200, 255, 1.0)";
        context.fillRect(this.pos.x, this.pos.y, CELL_SIZE, CELL_SIZE);

        context.fillStyle = "black";
        const cell_pos = this.pos.to_vector().mul(1.0/CELL_SIZE).floor();
        const text = `${cell_pos.x}, ${cell_pos.y}`;
        const text_measure = context.measureText(text);
        const text_dims = new Vector2(text_measure.actualBoundingBoxRight - text_measure.actualBoundingBoxLeft, text_measure.actualBoundingBoxDescent - text_measure.actualBoundingBoxAscent);
        const text_pos = this.pos.to_vector().add(Vector2.from_scalar(CELL_SIZE * 0.5)).add(text_dims.mul(-0.5));
        context.fillText(text, text_pos.x, text_pos.y);
        context.restore();
    }
}

class Track {
    pos: Point2;

    constructor(pos: Point2) {
        this.pos = pos;
    }

    render(context: CanvasRenderingContext2D) {
        context.save();
        context.fillStyle = "rgba(200, 255, 100, 1.0)";
        context.fillRect(this.pos.x, this.pos.y, CELL_SIZE, CELL_SIZE);

        context.fillStyle = "black";
        const cell_pos = this.pos.to_vector().mul(1.0/CELL_SIZE).floor();
        const text = `${cell_pos.x}, ${cell_pos.y}`;
        const text_measure = context.measureText(text);
        const text_dims = new Vector2(text_measure.actualBoundingBoxRight - text_measure.actualBoundingBoxLeft, text_measure.actualBoundingBoxDescent - text_measure.actualBoundingBoxAscent);
        const text_pos = this.pos.to_vector().add(Vector2.from_scalar(CELL_SIZE * 0.5)).add(text_dims.mul(-0.5));
        context.fillText(text, text_pos.x, text_pos.y);
        context.restore();
    }
}

function render(state: State) {
    const { context } = state;

    state.grid.render(context);

    // find closest grid position by transforming into grid cell space, flooring and transforming back.
    const cell_pos = state.mouse_pos.to_vector()
    .mul(1.0/state.grid.size)
    .floor()
    .mul(state.grid.size)
    .to_point();

    if (state.tool !== Tool.None) {
        context.save();
        context.fillStyle = state.tool === Tool.Track ? "rgba(200, 255, 100, 0.5)"
            : "rgba(100, 200, 255, 0.5)";
        context.fillRect(cell_pos.x, cell_pos.y, CELL_SIZE, CELL_SIZE);
        context.restore();
    }

    for (const store of state.stores) {
        store.render(context);
    }

    for (const track of state.tracks) {
        track.render(context);
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
    let grid = new Grid(30, 30, CELL_SIZE);

    let state = {
        canvas,
        context,
        tick: 0,
        window_dims: initialBodyDims,
        mouse_pos: new Point2(0, 0),
        mouse_down_pos: null as Point2 | null,
        camera_pos: new Vector2(grid.cols, grid.rows).mul(0.5 * grid.size).to_point(),
        zoom_level: 0.0,
        target_zoom_level: 0.0,
        grid,
        stores: [] as Store[],
        tracks: [] as Track[],
        tool: Tool.None,
    };
 
    canvas.style.cursor = toolToCursor(state.tool);

    window.addEventListener("resize", _ => {
        state.window_dims = queryBodyDims();
    });

    canvas.addEventListener("mousedown", event => {
        state.mouse_down_pos = canvas_to_world(new Point2(event.clientX, event.clientY));
    });

    canvas.addEventListener("mouseup", _ => {
        state.mouse_down_pos = null;
    });

    function canvas_to_world(p: Point2): Point2 {
        // FIXME: can I not do all of this shit to get the mouse position in world space?
        state.context.save();
        state.context.translate(state.window_dims.x * 0.5, state.window_dims.y * 0.5);
        let zoom_scale = Math.pow(2.0, state.zoom_level);
        state.context.scale(zoom_scale, zoom_scale);
        state.context.translate(-state.camera_pos.x, -state.camera_pos.y);
        let temp = state.context.getTransform().invertSelf().transformPoint(p);
        state.context.restore();
        return new Point2(temp.x, temp.y);
    }

    canvas.addEventListener("click", _ => {
        if (state.tool == Tool.None) return;

        // find closest grid position by transforming into grid cell space, flooring and transforming back.
        const cell_pos = state.mouse_pos.to_vector()
            .mul(1.0/state.grid.size)
            .floor()
            .mul(state.grid.size)
            .to_point();

        if (state.tool == Tool.Track) {
            state.tracks.push(new Track(
                cell_pos
            ));
        } else if (state.tool == Tool.Store) {
            state.stores.push(new Store(
                cell_pos
            ));
        }
    });

    canvas.addEventListener("wheel", event => {
        state.target_zoom_level = Math.max(-3, Math.min(3, state.target_zoom_level - event.deltaY / 100));
    });

    window.addEventListener("mousemove", event => {
        if (state.mouse_down_pos !== null && state.tool == Tool.None) {
            let inv_zoom_scale = Math.pow(2.0, -state.zoom_level);
            state.camera_pos.add_assign(
                new Vector2(event.movementX, event.movementY).mul(-inv_zoom_scale)
            );
        }

        state.mouse_pos = canvas_to_world(new Point2(event.clientX, event.clientY));
    });

    function toolToCursor(tool: Tool) {
        switch (tool) {
            case Tool.None: return "move";
            default: return "default";
        }
    }

    function switchTool(state: State, tool: Tool) {
        state.tool = state.tool == tool ? Tool.None : tool;
        canvas.style.cursor = toolToCursor(state.tool);
    }

    window.addEventListener("keydown", event => {
        switch (event.code) {
            case "Digit1":
                switchTool(state, Tool.Track);
                break;
            case "Digit2":
                switchTool(state, Tool.Store);
                break;
        }
    });

    window.addEventListener("keyup", event => {
        console.log(event);
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

        state.context.translate(-state.camera_pos.x, -state.camera_pos.y);

        render(state);

        state.context.restore();

        window.requestAnimationFrame(self);
    });
}

main();
