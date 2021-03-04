import './index.css'
import { Vector2, Point2 } from './math';
import { Grid } from './grid';

const CELL_SIZE: number = 50;

enum ToolKind {
    None,
    Store,
    Track,
}

interface NoneTool {
    kind: ToolKind.None
}

interface StoreTool {
    kind: ToolKind.Store,
    start: Point2 | null,
}

interface TrackTool {
    kind: ToolKind.Track,
    start: Point2 | null,
}

type Tool = NoneTool | StoreTool | TrackTool;

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

function render_cell(context: CanvasRenderingContext2D, pos: Point2, fill: string) {
    context.fillStyle = fill;
    context.fillRect(pos.x, pos.y, CELL_SIZE, CELL_SIZE);

    context.fillStyle = "black";
    const cell_pos = pos.to_vector().mul(1.0/CELL_SIZE).floor();
    const text = `${cell_pos.x}, ${cell_pos.y}`;
    const text_measure = context.measureText(text);
    const text_dims = new Vector2(text_measure.actualBoundingBoxRight - text_measure.actualBoundingBoxLeft, text_measure.actualBoundingBoxDescent - text_measure.actualBoundingBoxAscent);
    const text_pos = pos.to_vector().add(Vector2.from_scalar(CELL_SIZE * 0.5)).add(text_dims.mul(-0.5));
    context.fillText(text, text_pos.x, text_pos.y);
}

function render_cell_grid(context: CanvasRenderingContext2D, pos: Point2, dim: Vector2, fill: string) {
    for (let y = pos.y; y < pos.y + dim.y; y += CELL_SIZE) {
        for (let x = pos.x; x < pos.x + dim.x; x += CELL_SIZE) {
            render_cell(context, new Point2(x, y), fill);
        }
    }
}

const STORE_FILL = "rgba(200, 255, 100, 1.0)";
const STORE_GHOST_FILL = "rgba(200, 255, 100, 0.5)";
const TRACK_FILL = "rgba(100, 200, 255, 1.0)";
const TRACK_GHOST_FILL = "rgba(100, 200, 255, 0.5)";

class Store {
    pos: Point2;
    dim: Vector2;

    constructor(pos: Point2, dim: Vector2) {
        this.pos = pos;
        this.dim = dim;
    }

    render(context: CanvasRenderingContext2D) {
        context.save();
        render_cell_grid(context, this.pos, this.dim, STORE_FILL);
        context.restore();
    }
}

class Track {
    pos: Point2;
    dim: Vector2;

    constructor(pos: Point2, dim: Vector2) {
        this.pos = pos;
        this.dim = dim;
    }

    render(context: CanvasRenderingContext2D) {
        context.save();
        render_cell_grid(context, this.pos, this.dim, TRACK_FILL);
        context.restore();
    }
}

function render(state: State) {
    const { context } = state;

    state.grid.render(context);

    for (const store of state.stores) {
        store.render(context);
    }

    for (const track of state.tracks) {
        track.render(context);
    }

    if (state.tool.kind === ToolKind.Store) {
        if (state.tool.start == null) {
            context.save();
            let pos = state.mouse_pos.to_vector().mul(1.0/CELL_SIZE).floor().mul(CELL_SIZE);
            context.fillStyle = STORE_GHOST_FILL;
            context.fillRect(pos.x, pos.y, CELL_SIZE, CELL_SIZE);
            context.restore();
        } else {
            let a = state.tool.start.to_vector().mul(1.0/CELL_SIZE).floor().mul(CELL_SIZE);
            let b = state.mouse_pos.to_vector().mul(1.0/CELL_SIZE).floor().mul(CELL_SIZE);
            
            let start = new Point2(
                Math.min(a.x, b.x),
                Math.min(a.y, b.y),
            );

            let end = new Point2(
                Math.max(a.x, b.x),
                Math.max(a.y, b.y),
            );

            let dim = end.sub(start).add(Vector2.from_scalar(CELL_SIZE));

            context.save();
            render_cell_grid(context, start, dim, STORE_GHOST_FILL);
            context.restore();
        }
    }

    if (state.tool.kind === ToolKind.Track) {
        if (state.tool.start == null) {
            context.save();
            let pos = state.mouse_pos.to_vector().mul(1.0/CELL_SIZE).floor().mul(CELL_SIZE);
            context.fillStyle = TRACK_GHOST_FILL;
            context.fillRect(pos.x, pos.y, CELL_SIZE, CELL_SIZE);
            context.restore();
        } else {
            let a = state.tool.start.to_vector().mul(1.0/CELL_SIZE).floor().mul(CELL_SIZE).to_point();
            let b = state.mouse_pos.to_vector().mul(1.0/CELL_SIZE).floor().mul(CELL_SIZE).to_point();
            let d = b.sub(a);

            if (Math.abs(d.x) >= Math.abs(d.y)) {
                b.y = a.y;
            } else {
                b.x = a.x;
            }

            let start = new Point2(
                Math.min(a.x, b.x),
                Math.min(a.y, b.y),
            );

            let end = new Point2(
                Math.max(a.x, b.x),
                Math.max(a.y, b.y),
            );

            let dim = end.sub(start).add(Vector2.from_scalar(CELL_SIZE));

            context.save();
            render_cell_grid(context, start, dim, TRACK_GHOST_FILL);
            context.restore();
        }
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
        tool: { kind: ToolKind.None } as Tool,
    };
 
    canvas.style.cursor = toolToCursor(state.tool.kind);

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
        if (state.tool.kind == ToolKind.None) return;

        // find closest grid position by transforming into grid cell space, flooring and transforming back.
        const mouse_pos_grid = state.mouse_pos.to_vector()
            .mul(1.0/state.grid.size)
            .floor()
            .mul(state.grid.size)
            .to_point();

        if (state.tool.kind == ToolKind.Track) {
            if (state.tool.start == null) {
                state.tool.start = mouse_pos_grid;
            } else {
                let a = state.tool.start.to_vector().mul(1.0/CELL_SIZE).floor().mul(CELL_SIZE).to_point();
                let b = mouse_pos_grid;
                let d = b.sub(a);

                if (Math.abs(d.x) >= Math.abs(d.y)) {
                    b.y = a.y;
                } else {
                    b.x = a.x;
                }
                
                let start = new Point2(
                    Math.min(a.x, b.x),
                    Math.min(a.y, b.y),
                );

                let end = new Point2(
                    Math.max(a.x, b.x),
                    Math.max(a.y, b.y),
                );

                let dim = end.sub(start).add(Vector2.from_scalar(CELL_SIZE));

                state.stores.push(new Track(
                    start,
                    dim,
                ));

                state.tool.start = null;
            }
        } else if (state.tool.kind == ToolKind.Store) {
            if (state.tool.start == null) {
                state.tool.start = mouse_pos_grid;
            } else {
                let start = new Point2(
                    Math.min(state.tool.start.x, mouse_pos_grid.x),
                    Math.min(state.tool.start.y, mouse_pos_grid.y),
                );
                123
                let end = new Point2(
                    Math.max(state.tool.start.x, mouse_pos_grid.x),
                    Math.max(state.tool.start.y, mouse_pos_grid.y),
                );

                let dim = end.sub(start).add(Vector2.from_scalar(CELL_SIZE));

                state.stores.push(new Store(
                    start,
                    dim,
                ));

                state.tool.start = null;
            }
        }
    });

    canvas.addEventListener("wheel", event => {
        state.target_zoom_level = Math.max(-3, Math.min(3, state.target_zoom_level - event.deltaY / 100));
    });

    window.addEventListener("mousemove", event => {
        if (state.mouse_down_pos !== null && state.tool.kind == ToolKind.None) {
            let inv_zoom_scale = Math.pow(2.0, -state.zoom_level);
            state.camera_pos.add_assign(
                new Vector2(event.movementX, event.movementY).mul(-inv_zoom_scale)
            );
        }

        state.mouse_pos = canvas_to_world(new Point2(event.clientX, event.clientY));
    });

    function toolToCursor(tool: ToolKind) {
        switch (tool) {
            case ToolKind.None: return "move";
            default: return "default";
        }
    }

    function switchTool(state: State, tool: ToolKind) {
        state.tool.kind = state.tool.kind == tool ? ToolKind.None : tool;
        canvas.style.cursor = toolToCursor(state.tool.kind);
    }

    window.addEventListener("keydown", event => {
        switch (event.code) {
            case "Digit1":
                switchTool(state, ToolKind.Track);
                break;
            case "Digit2":
                switchTool(state, ToolKind.Store);
                break;
            case "Escape":
                if (state.tool.kind === ToolKind.Store || state.tool.kind === ToolKind.Track) {
                    state.tool.start = null;
                }
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
