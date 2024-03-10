import { Bodies, Body, Collision, Composite, Engine, Events, Query, Runner, Vector } from "matter-js";
import { IController } from "../utils/controllers";
import { CollisionMask } from "../utils/constants";

export default class Tank {
    public tank: Body;
    public state = {
        forward: false,
        backward: false,
        left: false,
        right: false,
        fire: false,
        bullCount: 0
    };
    private __onDestroyFunc: (() => void)[] = [];
    constructor(
        public engine: Engine,
        public runner: Runner,
        public options: {
            controller: IController
            style: {
                tower: string,
                body: string
            }
        }
    ) {
        const tankBody = Bodies.rectangle(0, 0, 40, 50, {
            mass: 1,
            render: {
                fillStyle: options.style.body
            },
        });
        const tankTower = Bodies.rectangle(0, -25, 10, 40, {
            mass: 0,
            friction: 0,
            frictionAir: 0,
            render: {
                fillStyle: options.style.tower
            },
        });
        this.tank = Body.create({
            frictionAir: 0.5,
            friction: 0.5,
            frictionStatic: 0.5,
            mass: 1,
            collisionFilter: {
                category: CollisionMask.TANK
            },
            parts: [tankBody, tankTower]
        });
        
        const controllerTick = this.options.controller(this);
        
        const tickCb = () => {
            controllerTick();
            const co = Query.collides(this.tank, this.engine.world.bodies.filter(v => v.collisionFilter.category === CollisionMask.TANK && v != this.tank));
            if (co.length > 0) {
                Body.setVelocity(co[0].bodyB, Vector.mult(Vector.rotate(this.tank.velocity, 3.14), 2));
            }
        };
        Events.on(runner, "tick", tickCb);
        this.onDestroy(() => {
            Events.off(runner, "tick", tickCb);
        })
        Composite.add(engine.world, this.tank);
    }

    destroy() {
        Composite.remove(this.engine.world, this.tank);
        for (const cb of this.__onDestroyFunc) {
            try {
                cb();
            } catch(e) {
                console.error(e);
            }
        }
    }

    onDestroy(cb: () => void) {
        this.__onDestroyFunc.push(cb);
    }

    createBull() {
        const bull = Bodies.circle(0, 0, 4, {
            friction: 0,
            frictionAir: 0,
            frictionStatic: 0,
            restitution: 1,
            slop: 0,
            mass: 0,
            collisionFilter: {
                category: CollisionMask.TANK_BULL,
                mask: CollisionMask.WALL
            },
            render: {
                fillStyle: "black"
            },
            inertia: Infinity
        });
        this.state.bullCount += 1;
        const clear = () => {
            this.state.bullCount -= 1;
            Composite.remove(this.engine.world, [bull]);
            clearTimeout(tm);
            Events.off(this.runner, "beforeTick", tickHandle);
        };
        const hit = (collision: Collision) => {
            clear();
            const color = collision.bodyA.render.fillStyle;
            collision.bodyA.render.fillStyle = "blue";
            setTimeout(() => {
                collision.bodyA.render.fillStyle = color;
            }, 50)
        }
        const tm = setTimeout(() => {
            clear();
        }, 5000);
        Composite.add(this.engine.world, bull);
        const tickHandle = () => {
            const co = Query.collides(bull, this.engine.world.bodies.filter(v => v.collisionFilter.category === CollisionMask.TANK));
            if (co.length > 0) {
                hit(co[0])
            }
        }
        
        Body.setPosition(bull, Vector.add(this.tank.position, Vector.rotate(Vector.create(0, -40), this.tank.angle)));
        const coTank = Query.collides(bull, this.engine.world.bodies.filter(v => v.collisionFilter.category === CollisionMask.TANK));
        const coWall = Query.collides(bull, this.engine.world.bodies.filter(v => v.collisionFilter.category === CollisionMask.WALL));
        if (coTank.length === 1 && coWall.length > 0) {
            return void hit(coTank[0]);
        }
        Body.setPosition(bull, Vector.add(this.tank.position, Vector.rotate(Vector.create(0, -42), this.tank.angle)));
        Events.on(this.runner, "beforeTick", tickHandle);
        return bull;
    }

    fire() {
        if (this.state.fire || this.state.bullCount >= 5) return;
        var bull = this.createBull();
        if (!bull) return;
        Body.setVelocity(bull, Vector.rotate(Vector.create(0, -3), this.tank.angle));
    }


    setPosition(x: Vector): void
    setPosition(x: number, y: number): void
    setPosition(x: number | Vector, y?: number): void {
        if (typeof x !== "number") {
            Body.setPosition(this.tank, x);
        } else {
            Body.setPosition(this.tank, Vector.create(x, y));
        }
    }

    setAngle(angle: number) {
        Body.setAngle(this.tank, angle);
    }
}