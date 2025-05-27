import { startModelCmd } from "cs12242-mvu/src/index"
import { canvasView } from "cs12242-mvu/src/canvas"
import { pipe, Array } from "effect"
import { World, Config, Egg, Eggnemies, Model, Settings, EggUtils } from "./model"
import { view } from "./view"
import { makeUpdate } from "./update"

fetch("settings.json")
  .then((response) => response.json())
  .then((data: Settings) => {
    const settings = data

    const initModel = pipe(
      Model.make({
        world: World.make({
          x: 80,
          y: 80,
          width: settings.worldWidth,
          height: settings.worldHeight,
        }),
        config: Config.make({
          screenWidth: settings.screenWidth,
          screenHeight: settings.screenHeight,
          worldWidth: settings.worldWidth,
          worldHeight: settings.worldHeight,
          fps: settings.fps,
          canvasId: "canvas",
          velocity: 10,
          eggInvincibilityFrames: 30,
          eggnemiesCount: settings.eggnemiesCount,
        }),
        egg: Egg.make({
          x: 0, 
          y: 0,
          width: settings.eggWidth,
          height: settings.eggHeight,
          vy: 0, 
          vx: 0,
          hp: settings.eggInitHP,
          maxHp: settings.eggInitHP,
        }),
        eggnemies: pipe(
          Array.range(1, settings.eggnemiesCount-1).map((id) =>
            Eggnemies.make({
              x: Math.random() * settings.worldWidth,
              y: Math.random() * settings.worldHeight,
              width: settings.eggnemyWidth,
              height: settings.eggnemyHeight,
              vx: Math.random() * 2 - 1,
              vy: Math.random() * 2 - 1,
              id, 
              hp: settings.eggnemyInitHP,
              maxHp: settings.eggnemyInitHP,
            })
          )
        ),
        isGameOver: false,
        score: 0,
        ticks: 0,
        firstCollisionTick: -30,
        defeatedEggnemies: 0,
        timer: {
          seconds: 0,
          minutes: 0,
        }
      }),
      (model) =>
        EggUtils.updateInModel(model, {
          x: model.config.worldWidth / 2,
          y: model.config.worldHeight / 2,
        })
    )

    const root = document.getElementById("app")!
    const { config } = initModel
    const update = makeUpdate(initModel, settings)

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
