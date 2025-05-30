import * as Canvas from "cs12242-mvu/src/canvas"
import { Model } from "./model"
import { pipe } from "effect"

export const viewGameOver = (model: Model) =>
  [model.isGameOver?
    Canvas.Text.make({
      x: model.egg.x + model.egg.width / 2,
      y: model.egg.x -10,
      text: "GAME OVER",
      color: "white",
      fontSize:10,
      font: "press-start-2p",
    }) : Canvas.NullElement.make(),
    model.isGameOver ?
    Canvas.Text.make({
      x: model.egg.x + model.egg.width / 2,
      y: model.egg.y + model.egg.height + 30,
      text: `Restart? [R]`,
      color: "white",
      fontSize: 10,
      font: "press-start-2p",
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

    ...model.bosses.flatMap(boss => [ 
      Canvas.CanvasImage.make({
        x: boss.x,
        y: boss.y,
        src: "../resources/boss.png",
      }),

      Canvas.Text.make({
      x: boss.x + boss.width / 2,
      y: boss.y + boss.height + 15,
      color: "white",
      text: `${boss.hp}/${boss.maxHp}`,
      fontSize: 8,
      font: "press-start-2p",
      })
    ]
    ),
    
    Canvas.CanvasImage.make({
      x: egg.x, 
      y: egg.y,
      src: "../resources/egg.png",
    }),

    Canvas.Text.make({
      x: egg.x + egg.width / 2,
      y: egg.y + egg.height + 15,
      color: "white",
      text: `${egg.hp}/${egg.maxHp}`,
      fontSize: 8,
      font: "press-start-2p",
    }),

    ...model.eggnemies.map((eggnemies) =>
      Canvas.CanvasImage.make({
        x: eggnemies.x, 
        y: eggnemies.y,  
        src: "../resources/eggnemy.png",
      }),
    ),

    ...model.eggnemies.map((eggnemies) =>
      Canvas.Text.make({
          x: eggnemies.x + eggnemies.width / 2,
          y: eggnemies.y + eggnemies.height + 15,
          color: "gray",
          text: `${eggnemies.hp}/${eggnemies.maxHp}`,
          fontSize: 8,
          font: "press-start-2p",
        })
      ),

    Canvas.Text.make({
      x: world.x + config.worldWidth - 30,
      y: world.y - 20,
      text: `${String(model.timer.minutes)}:${String(model.timer.seconds).padStart(2, '0')}`,
      color: "white",
      fontSize: 15,
      font: "press-start-2p",
    }),

    Canvas.Text.make({
      x: world.x + 10,
      y: world.y - 20,
      text: `${String(model.defeatedEggnemies)}`,
      color: "white",
      fontSize: 15,
      font: "press-start-2p",
    }),
    
    ...[
      Canvas.Text.make({
        x: world.x + 80, 
        y: world.y + config.worldHeight + 40, 
        text: `Top 1  ${
          model.leaderboard[0]
            ? `${String(model.leaderboard[0].minutes).padStart(2, '0')}:${String(model.leaderboard[0].seconds).padStart(2, '0')}`
            : "-- : --"
        }`,
        color: "white",
        fontSize: 10,
        font: "press-start-2p",
      }),
      Canvas.Text.make({
        x: world.x + 80,
        y: world.y + config.worldHeight + 60, 
        text: `    2  ${
          model.leaderboard[1]
            ? `${String(model.leaderboard[1].minutes).padStart(2, '0')}:${String(model.leaderboard[1].seconds).padStart(2, '0')}`
            : "-- : --"
        }`,
        color: "white",
        fontSize: 10,
        font: "press-start-2p",
      }),
      Canvas.Text.make({
        x: world.x + 80,
        y: world.y + config.worldHeight + 80, 
        text: `    3  ${
          model.leaderboard[2]
            ? `${String(model.leaderboard[2].minutes).padStart(2, '0')}:${String(model.leaderboard[2].seconds).padStart(2, '0')}`
            : "-- : --"
        }`,
        color: "white",
        fontSize: 10,
        font: "press-start-2p",
      }),
      Canvas.Text.make({
        x: world.x + config.worldWidth - 40,
        y: world.y + config.worldHeight + 40, 
        text: `ATK   ${egg.attack}`,
        color: "white",
        fontSize: 10,
        font: "press-start-2p",
      }),
      Canvas.Text.make({
        x: world.x + config.worldWidth - 40,
        y: world.y + config.worldHeight + 60, 
        text: `SPD   ${egg.speed}`,
        color: "white",
        fontSize: 10,
        font: "press-start-2p",
      }),
      Canvas.Text.make({
        x: world.x + config.worldWidth - 40,
        y: world.y + config.worldHeight + 80, 
        text: `EXP   ${egg.eggxperience}`,
        color: "white",
        fontSize: 10,
        font: "press-start-2p",
      }),

      ...!model.isGameOver&&model.egg.levelUp? [
        Canvas.SolidRectangle.make({
          x: world.x + config.worldWidth/2 - 150,
          y: world.y + config.worldHeight/2 -100,
          color: "black",
          width: 300,
          height: 150,
        }),
        Canvas.OutlinedRectangle.make({
          x: world.x + config.worldWidth/2 - 150,
          y: world.y + config.worldHeight/2 -100,
          color: "white",
          width: 300,
          height: 150,
          lineWidth: 3
        }),
        Canvas.Text.make({
        x: world.x + config.worldWidth/2,
        y: world.y + config.worldHeight/2 - 50, 
        text: `LEVEL UP`,
        color: "white",
        fontSize: 25,
        font: "press-start-2p",
      }),
        Canvas.Text.make({
        x: world.x + config.worldWidth/2,
        y: world.y + config.worldHeight/2 - 20, 
        text: `[1] Increase HP`,
        color: "white",
        fontSize: 15,
        font: "press-start-2p",
      }),
      Canvas.Text.make({
        x: world.x + config.worldWidth/2,
        y: world.y + config.worldHeight/2 , 
        text: `[2] Increase ATK`,
        color: "white",
        fontSize: 15,
        font: "press-start-2p",
      }),
      Canvas.Text.make({
        x: world.x + config.worldWidth/2,
        y: world.y + config.worldHeight/2 +20, 
        text: `[3] Increase SPD`,
        color: "white",
        fontSize: 15,
        font: "press-start-2p",
      }),
    ]: []
      
    ],

    ...viewGameOver(model),
  ])