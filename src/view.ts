import * as Canvas from "cs12242-mvu/src/canvas"
import { Model } from "./model"
import { pipe } from "effect"

export const viewGameOver = (model: Model) =>
  model.isGameOver ?
    Canvas.Text.make({
      x: model.config.worldWidth / 2,
      y: model.config.worldHeight / 2,
      text: model.eggnemies.length === 0 ? "YOU WIN" : "GAME OVER",
      color: "white",
      fontSize: 20,
    })
    : Canvas.NullElement.make()

export const view = (model: Model) =>
  pipe(model, ({ world, config, egg }) => [
    Canvas.Clear.make({ color: "black" }),
    Canvas.OutlinedRectangle.make({
      x: world.x, 
      y: world.y,
      width: config.worldWidth,
      height: config.worldHeight,
      color: "white", lineWidth: 2
    }),

    // Canvas.OutlinedRectangle.make({
    //   x: 0, 
    //   y: 0,
    //   width: config.worldWidth,
    //   height: config.worldHeight,
    //   color: "white", lineWidth: 2
    // }),

    Canvas.SolidRectangle.make({
      x: egg.x, 
      y: egg.y,
      color: "white",
      height: egg.height,
      width: egg.width
    }),

    Canvas.Text.make({
      x: egg.x + egg.width / 2,
      y: egg.y + egg.height + 15,
      color: "white",
      text: `${egg.hp}/${egg.maxHp}`,
      fontSize: 12
    }),

    Canvas.CanvasImage.make({
      x: egg.x - 22,
      y: egg.y - 22,
      src: "resources/poring.gif"
    }),

    ...model.eggnemies.map((eggnemies) =>
      Canvas.SolidRectangle.make({
        x: eggnemies.x, 
        y: eggnemies.y,  
        color: "gray",
        height: eggnemies.height,
        width: eggnemies.width
      }),
    ),

    ...model.eggnemies.map((eggnemies) =>
      Canvas.Text.make({
          x: eggnemies.x + eggnemies.width / 2,
          y: eggnemies.y + eggnemies.height + 15,
          color: "white",
          text: `${eggnemies.hp}/${eggnemies.maxHp}`,
          fontSize: 12
        })
      ),

    Canvas.Text.make({
      x: world.x + config.worldWidth + 50,
      y: world.y + 30,
      text: `${String(model.timer.minutes)}:${String(model.timer.seconds).padStart(2, '0')}`,
      color: "white",
      fontSize: 20
    }),
    viewGameOver(model),
  ])
