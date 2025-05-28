import * as Canvas from "cs12242-mvu/src/canvas"
import { Model } from "./model"
import { pipe } from "effect"

export const viewGameOver = (model: Model) =>
  [model.isGameOver || (model.isBossActive && model.boss.hp <= 0) ?
    Canvas.Text.make({
      x: model.egg.x + model.egg.width / 2,
      y: model.egg.x -10,
      text: model.isBossActive && model.boss.hp <= 0 ? "YOU WIN" : "GAME OVER",
      color: "white",
      fontSize:15,
      
    }) : Canvas.NullElement.make(),
    model.isGameOver ?
    Canvas.Text.make({
      x: model.egg.x + model.egg.width / 2,
      y: model.egg.y + model.egg.height + 30,
      text: `Restart? [R]`,
      color: "white",
      fontSize: 15,
    }) : Canvas.NullElement.make()
  ]


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
    
    ...[
      Canvas.Text.make({
        x: world.x + 80, 
        y: world.y + config.worldHeight - 80, 
        text: `Top 1  ${
          model.leaderboard[0]
            ? `${String(model.leaderboard[0].minutes).padStart(2, '0')}:${String(model.leaderboard[0].seconds).padStart(2, '0')}`
            : "-- : --"
        }`,
        color: "white",
        fontSize: 14,
      }),
      Canvas.Text.make({
        x: world.x + 80,
        y: world.y + config.worldHeight - 60, 
        text: `      2  ${
          model.leaderboard[1]
            ? `${String(model.leaderboard[1].minutes).padStart(2, '0')}:${String(model.leaderboard[1].seconds).padStart(2, '0')}`
            : "-- : --"
        }`,
        color: "white",
        fontSize: 14,
      }),
      Canvas.Text.make({
        x: world.x + 80,
        y: world.y + config.worldHeight - 40, 
        text: `      3  ${
          model.leaderboard[2]
            ? `${String(model.leaderboard[2].minutes).padStart(2, '0')}:${String(model.leaderboard[2].seconds).padStart(2, '0')}`
            : "-- : --"
        }`,
        color: "white",
        fontSize: 14,
      }),
    ],

    ...viewGameOver(model),
  ])