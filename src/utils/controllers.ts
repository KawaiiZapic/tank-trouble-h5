import { Body, Vector, Mouse } from "matter-js";
import Tank from "../components/tank";

export type IController = (tank: Tank) => (() => void);

export interface IKeyboardBinding {
    forward: string;
    backward: string;
    left: string;
    right: string;
    fire: string;
};

export interface IKeyboardBindingR {
    [key: string]: keyof IKeyboardBinding
}

export interface IMouseBinding {
    fire: number;
};

export type IBindingPair<T> = [T, Tank];

class KeyboardControllerInstance {
    private static instance: KeyboardControllerInstance;
    private __bindings: IBindingPair<IKeyboardBindingR>[] = [];

    private constructor() {
        document.body.addEventListener("keydown", e => {
            const k = e.key;
            for (const [binding, tank] of this.__bindings) {
                if (k in binding) {
                    const state = tank.state;
                    if (!state.fire && binding[k] === "fire") {
                        tank.fire();
                    }
                    state[binding[k]] = true;
                    break;
                }
            }
        });

        document.body.addEventListener("keyup", e => {
            for (const [binding, tank] of this.__bindings) {
                tank.state[binding[e.key]] = false;
            }
        });
    }

    public static getInstance(): KeyboardControllerInstance {
        if (!this.instance) {
            this.instance = new this();
        }
        return this.instance;
    }

    public attach(_tank: Tank, binding: IKeyboardBinding) {
        const bind: IKeyboardBindingR = {};
        for (const action of Object.keys(binding) as (keyof IKeyboardBinding)[]) {
            bind[binding[action]] = action;
        }
        this.__bindings.push([bind, _tank]);
        _tank.onDestroy(() => this.detach(_tank));
        return () => {
            const { state, tank } = _tank;
            const leftForce = Vector.create(0, 0);
            const rightForce = Vector.create(0, 0);
            if (state.forward && !state.backward) {
                leftForce.y = -0.0015;
                rightForce.y = -0.0015;
            } else if (state.backward) {
                leftForce.y = 0.001;
                rightForce.y = 0.001;
            }
            if (state.left) {
                leftForce.y += 0.0035;
                rightForce.y += -0.0035;
            }
            if (state.right) {
                leftForce.y += -0.0035;
                rightForce.y += 0.0035;
            }
            Body.applyForce(tank, Vector.add(tank.position, Vector.rotate(Vector.create(-15, 0), tank.angle)), Vector.rotate(leftForce, tank.angle));
            Body.applyForce(tank, Vector.add(tank.position, Vector.rotate(Vector.create(15, 0), tank.angle)), Vector.rotate(rightForce, tank.angle));
        }
    }

    public detach(tank: Tank) {
        this.__bindings = this.__bindings.filter(v => v[1] !== tank);
    }
}

export const createKeyboardController = (map: IKeyboardBinding): IController => {
    return (tank: Tank) => {
        return KeyboardControllerInstance.getInstance().attach(tank, map);
    };
};

class MouseControllerInstance {
    private static instance: MouseControllerInstance;
    private __bindings: IBindingPair<IMouseBinding>[] = [];
    private mouse: Mouse;

    private constructor() {
        document.body.addEventListener("mousedown", e => {
            const k = e.button;
            for (const [binding, tank] of this.__bindings) {
                const state = tank.state;
                if (!state.fire && k == binding.fire) {
                    tank.fire();
                    state.fire = true;
                }
                break;
            }
        });

        document.body.addEventListener("mouseup", e => {
            for (const [binding, tank] of this.__bindings) {
                if (e.button === binding.fire) {
                    tank.state.fire = false;
                    break;
                }
            }
        });
        this.mouse = Mouse.create(document.body);
    }

    public static getInstance(): MouseControllerInstance {
        if (!this.instance) {
            this.instance = new this();
        }
        return this.instance;
    }

    public attach(_tank: Tank, binding: IMouseBinding) {
        this.__bindings.push([binding, _tank]);
        _tank.onDestroy(() => this.detach(_tank));
        return () => {
            const { tank } = _tank;
            while (tank.angle < 0) {
                Body.setAngle(tank, tank.angle + 6.28);
            }
            const mousePos = this.mouse.position;
            const tankAngle = tank.angle % 6.28
            const targetAngle = (Vector.angle(mousePos, tank.position) + 1.5*3.14) % 6.28;
            if (Math.abs(tankAngle - targetAngle) > 0.05) {
                Body.setAngularVelocity(tank, 0.04 * (targetAngle > tankAngle ? 1 : -1) * (Math.abs(targetAngle - tankAngle) > 3.14 ? -1 : 1))
            }
            const dist = Vector.magnitude(Vector.sub(mousePos, tank.position));
            if (dist > 75) {
                Body.applyForce(tank, Vector.add(tank.position, Vector.rotate(Vector.create(-15, 0), tank.angle)), Vector.rotate(Vector.create(0, -0.003 * ((Math.min(150, dist) - 75) / 75)), tank.angle));
            }
        }
    }

    public detach(tank: Tank) {
        this.__bindings = this.__bindings.filter(v => v[1] !== tank);
    }
}

export const createMouseController = (map: IMouseBinding): IController => {
    return (tank: Tank) => {
        return MouseControllerInstance.getInstance().attach(tank, map);
    };
};