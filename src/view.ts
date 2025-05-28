import * as Canvas from "cs12242-mvu/src/canvas"
import { Model } from "./model"
import { pipe } from "effect"

export const viewGameOver = (model: Model) =>
  model.isGameOver ?
    Canvas.Text.make({
      x: model.egg.x + model.egg.width / 2,
      y: model.egg.x -10,
      text: model.isBossActive && model.boss.hp <= 0 && model.defeatedEggnemies === model.config.eggnemiesCount ? "YOU WIN" : "GAME OVER",
      color: "white",
      fontSize:15,
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

    ...(model.isBossActive && model.boss.hp > 0
  ? [
      Canvas.SolidRectangle.make({
        x: model.boss.x,
        y: model.boss.y,
        color: "red", 
        height: model.boss.height,
        width: model.boss.width,
      }),

      Canvas.Text.make({
        x: model.boss.x + model.boss.width / 2,
        y: model.boss.y + model.boss.height + 15,
        color: "white",
        text: `${model.boss.hp}/${model.boss.maxHp}`, 
        fontSize: 12,
      }),
    ]
  : []),

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
          color: "red",
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

    Canvas.Text.make({
      x: world.x - 40,
      y: world.y + 30,
      text: `${String(model.defeatedEggnemies)}`,
      color: "white",
      fontSize: 20
    }),
    
    

    viewGameOver(model),
  ])