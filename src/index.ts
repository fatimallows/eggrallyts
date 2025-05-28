import { startModelCmd } from "cs12242-mvu/src/index"
import { canvasView } from "cs12242-mvu/src/canvas"
import { pipe, Array } from "effect"
import { World, Config, Egg, Eggnemies, Model, Settings, EggUtils, LeaderboardUtils } from "./model"
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
          eggxperience: 0,
          attack: settings.eggInitAttack,
          speed: settings.eggInitSpeed,
          hp: settings.eggInitHP,
          maxHp: settings.eggInitHP,
          levelUp: 0,
          level: 0,
          
        }),
        eggnemies: pipe(
          Array.range(1, Math.max(1, Math.floor(settings.eggnemiesCount * 0.3))).map((id) =>
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
        eggnemiesSpawned: Math.max(1, Math.floor(settings.eggnemiesCount * 0.3)),
        boss: Eggnemies.make({
          x: Math.random() * settings.worldWidth,
          y: Math.random() * settings.worldHeight,
          width: settings.eggnemyWidth,
          height: settings.eggnemyHeight,
          vx: Math.random() * 2 - 1,
          vy: Math.random() * 2 - 1,
          id: 1, 
          hp: settings.eggnemyInitHP,
          maxHp: settings.eggnemyInitHP,
        }),
        isBossActive: false,
        isGameOver: false,
        score: 0,
        ticks: 0,
        firstCollisionTick: -30,
        defeatedEggnemies: 0,
        timer: {
          seconds: 0,
          minutes: 0,
        },
        leaderboard: LeaderboardUtils.read(),
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