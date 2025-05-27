import { pipe, Array } from "effect"
import { startModelCmd } from "cs12242-mvu/src/index"
import { canvasView } from "cs12242-mvu/src/canvas"
import { Config, Egg, Eggnemies, Model, Settings } from "./model"
import { view } from "./view"
import { update, resetModel as _resetModel } from "./update"

let initModel: Model
_update.resetModel = () => initModel

fetch("settings.json")
  .then((res) => res.json())
  .then((data: Settings) => {
    const settings = data

    initModel = pipe(
      Model.make({
        config: Config.make({
          screenWidth: settings.screenWidth,
          screenHeight: settings.screenHeight,
          worldWidth: settings.worldWidth,
          worldHeight: settings.worldHeight,
          fps: settings.fps,
          canvasId: "canvas",
          velocity: 10,
          maxHp: settings.eggInitHP,
          eggInvincibilityFrames: 30,
        }),
        egg: Egg.make({
          x: settings.worldWidth / 2,
          y: settings.worldHeight / 2,
          width: settings.eggWidth,
          height: settings.eggHeight,
          vx: 0,
          vy: 0,
          hp: settings.eggInitHP,
        }),
        eggnemies: pipe(
          Array.range(1, settings.eggnemiesCount).map((id) =>
            Eggnemies.make({
              x: Math.random() * settings.worldWidth,
              y: Math.random() * settings.worldHeight,
              width: settings.eggnemyWidth,
              height: settings.eggnemyHeight,
              vx: Math.random() * 2 - 1,
              vy: Math.random() * 2 - 1,
              id,
            })
          )
        ),
        isGameOver: false,
        score: 0,
        ticks: 0,
        firstCollisionTick: -30,
      })
    )

    _update.resetModel = () => initModel

    const root = document.getElementById("app")!
    const { config } = initModel

    startModelCmd(
      root,
      initModel,
      update,
      canvasView(config.screenWidth, config.screenHeight, config.fps, config.canvasId, view)
    )
  })
