import { Engine, Render, Runner, Bodies, Composite } from "matter-js";
import { CollisionMask } from "../utils/constants";

export default function createWorld() {
    const engine = Engine.create();
    const runner = Runner.create();
    const render = Render.create({
      element: document.body.querySelector("div[data-root]") as HTMLDivElement,
      engine: engine,
      options: {
        wireframes: false,
        background: "transparent"
      }
    });
    
    engine.gravity.scale = 0;
    engine.gravity.x = 0;
    engine.gravity.y = 0;
    
    const ground = Bodies.rectangle(400, 600, 800, 10, { isStatic: true, collisionFilter: { category: CollisionMask.WALL }, });
    const ground2 = Bodies.rectangle(400, 0, 800, 10, { isStatic: true, collisionFilter: { category: CollisionMask.WALL },  });
    const ground3 = Bodies.rectangle(0, 300, 10, 600, { isStatic: true, collisionFilter: { category: CollisionMask.WALL },  });
    const ground4 = Bodies.rectangle(800, 300, 10, 600, { isStatic: true, collisionFilter: { category: CollisionMask.WALL },});

    Composite.add(engine.world, [ground, ground2, ground3, ground4]);
    Render.run(render);
    Runner.run(runner, engine);
    
    return {
        engine,
        runner,
        render
    }
}
