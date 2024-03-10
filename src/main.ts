import createWorld from "./components/world";
import Tank from "./components/tank";
import { createKeyboardController, createMouseController } from "./utils/controllers";
import { MouseButtonCode } from "./utils/constants";

const { engine, runner } = createWorld();

const tank1 = new Tank(engine, runner, {
  controller: createKeyboardController({
    forward: "w",
    backward: "s",
    left: "a",
    right: "d",
    fire: "e"
  }),
  style: {
      tower: "red",
      body: "red"
  }
});

const tank2 = new Tank(engine, runner, {
  controller: createMouseController({
    fire: MouseButtonCode.LEFT
  }),
  style: {
      tower: "green",
      body: "green"
  }
});

tank1.setPosition(800 * Math.random(), 600 * Math.random());
tank2.setPosition(800 * Math.random(), 600 * Math.random());
tank1.setAngle(6.28 * Math.random());
tank2.setAngle(6.28 * Math.random());