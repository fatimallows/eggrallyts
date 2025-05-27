import { Array, Schema as S, Match, pipe } from "effect"
import * as Canvas from "cs12242-mvu/src/canvas"
import { Model } from "./model"

export const view = (model: Model) =>
  pipe(
    model,
    ({ config, egg }) => [
      Canvas.Clear.make({
        color: "black",
      }),
      Canvas.OutlinedRectangle.make({
        x: 0,
        y: 0,
        width: model.config.worldWidth,
        height: model.config.worldHeight,
        color: "white",
        lineWidth: 2,
      }),
      Canvas.SolidRectangle.make({
        x: egg.x,
        y: egg.y,
        color: "white",
        height: egg.height,
        width: egg.width,
      }),
      Canvas.Text.make({
        x: egg.x + egg.width / 2,
        y: egg.y + egg.height + 15,
        color: "white",
        text: String(model.egg.hp) + "/" + String(model.config.maxHp),
        fontSize: 12,
      }),
      Canvas.CanvasImage.make({
        x: egg.x - 22,
        y: egg.y - 22,
        src: "resources/poring.gif",
      }), 

      ...model.eggnemies.map((e) =>
        Canvas.SolidRectangle.make({
          x: e.x,
          y: e.y,
          color: "gray",
          height: e.height,
          width: e.width,
        })
      ),

      Canvas.Text.make({
        x: config.worldWidth / 2,
        y: 50,
        text: `${model.score}`,
        color: "white",
        fontSize: 20,
      }),

      viewGameOver(model),
    ]
  )

const viewGameOver = (model: Model) =>
model.isGameOver ?
Canvas.Text.make({
  x: model.config.worldWidth / 2,
  y: model.config.worldHeight / 2,
  text: Array.length(model.eggnemies) === 0? "YOU WIN": "GAME OVER",
  color: "white",
  fontSize: 20,
})
: Canvas.NullElement.make()
