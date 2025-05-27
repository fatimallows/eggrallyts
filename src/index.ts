import { startModelCmd } from "cs12242-mvu/src/index"
import { canvasView } from "cs12242-mvu/src/canvas"
import { pipe, Array } from "effect"
import { Config, Egg, Eggnemies, Model, Settings, EggUtils } from "./model"
import { view } from "./view"
import { makeUpdate } from "./update"

fetch("settings.json")
  .then((response) => response.json())
  .then((data: Settings) => {
    const settings = data

    const initModel = pipe(
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
          x: 0, y: 0,
          width: settings.eggWidth,
          height: settings.eggHeight,
          vy: 0, vx: 0,
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
      }),
      (model) =>
        EggUtils.updateInModel(model, {
          x: model.config.worldWidth / 2,
          y: model.config.worldHeight / 2,
        })
    )

    const root = document.getElementById("app")!
    const { config } = initModel
    const update = makeUpdate(initModel)

    startModelCmd(
      root,
      initModel,
      update,
      canvasView(
        config.screenWidth,
        config.screenHeight,
        config.fps,
        config.canvasId,
        view
      )
    )
  })
