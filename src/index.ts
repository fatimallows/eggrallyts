import { Array, Schema as S, Match, pipe } from "effect"
import { Cmd, startModelCmd } from "cs12242-mvu/src/index"
import { CanvasMsg, canvasView } from "cs12242-mvu/src/canvas"
import * as Canvas from "cs12242-mvu/src/canvas"

const EggnemiesUtils = {
  top: (eggnemies: Eggnemies) => eggnemies.y,
  bottom: (eggnemies: Eggnemies) => eggnemies.y + eggnemies.height,
  left: (eggnemies: Eggnemies) => eggnemies.x,
  right: (eggnemies: Egg) => eggnemies.x + eggnemies.width,
  updateInModel: (model: Model, updates: Partial<Eggnemies>[]) =>
    Model.make({
      ...model,
      eggnemies: pipe(model.eggnemies, Array.map((eggnemy) => Eggnemies.make({...eggnemy, ...updates})))
    }),
}
const EggUtils = {
  top: (egg: Egg) => egg.y,
  bottom: (egg: Egg) => egg.y + egg.height,
  left: (egg: Egg) => egg.x,
  right: (egg: Egg) => egg.x + egg.width,
  updateInModel: (model: Model, updates: Partial<Egg>) =>
    Model.make({
      ...model,
      egg: Egg.make({
        ...model.egg,
        ...updates,
      }),
    }),
}

type Rectangle = typeof Rectangle.Type
const Rectangle = S.Struct({
  x: S.Number,
  y: S.Number,
  height: S.Number,
  width: S.Number,
})

type Config = typeof Config.Type
const Config = S.Struct({
  screenWidth: S.Number,
  screenHeight: S.Number,
  worldWidth: S.Number,
  worldHeight: S.Number,
  fps: S.Number,
  canvasId: S.String,
  velocity: S.Number,
  maxHp: S.Number,
  eggInvincibilityFrames: S.Int,
})

type Egg = typeof Egg.Type
const Egg = S.Struct({
  x: S.Number,
  y: S.Number,
  height: S.Number,
  width: S.Number,
  vx: S.Number,
  vy: S.Number,
  hp: S.Number,
})

type Eggnemies = typeof Eggnemies.Type
const Eggnemies = S.Struct({
  x: S.Number,
  y: S.Number,
  height: S.Number,
  width: S.Number,
  vx: S.Number,
  vy: S.Number,
  id: S.Number,
})

type Model = typeof Model.Type
const Model = S.Struct({
  config: Config,
  egg: Egg,
  eggnemies: S.Array(Eggnemies),
  isGameOver: S.Boolean,
  score: S.Number,
  ticks: S.Number,
  firstCollisionTick: S.Int,
})

type Settings = typeof Settings.Type
const Settings = S.Struct({
  fps: S.Number,
  screenHeight: S.Number,
  screenWidth: S.Number,
  worldWidth: S.Number,
  worldHeight: S.Number,
  eggInitHP: S.Number,
  eggWidth: S.Number,
  eggHeight: S.Number,
  eggnemiesCount: S.Number,
  eggnemyWidth: S.Number,
  eggnemyHeight: S.Number,
})

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
          x: 0,
          y: 0,
          width: settings.eggWidth,
          height: settings.eggHeight,
          vy: 0,
          vx: 0,
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

    type Msg = CanvasMsg

    const isinCollision = (rect1: Rectangle, rect2: Rectangle) => {
      return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
      )
    }

    const updateCollision = (model: Model): Model => {
      const egg = model.egg
      let currentHp = model.egg.hp
      let firstCollisionTick = model.firstCollisionTick
      const invincibilityDuration = model.config.eggInvincibilityFrames

      const canTakeDamage = model.ticks - firstCollisionTick >= invincibilityDuration

      if (canTakeDamage) {
        for (const enemy of model.eggnemies) {
          if (isinCollision(egg, enemy)) {
            currentHp -= 1
            firstCollisionTick = model.ticks
            break
          }
        }
      }

      return Model.make({
        ...model,
        egg: Egg.make({ ...model.egg, hp: currentHp }),
        firstCollisionTick: firstCollisionTick,
      })
    }

    const update = (msg: Msg, model: Model): Model | { model: Model; cmd: Cmd<Msg> } =>
      Match.value(msg).pipe(
        Match.tag("Canvas.MsgKeyDown", ({ key }) => {

          let x = model.egg.x
          let y = model.egg.y
          const velocity = model.config.velocity
          if (!model.isGameOver) {
            if (key === "s") {
            y = model.egg.y + velocity
          } else if (key === "w") {
            y = model.egg.y - velocity
          } else if (key === "a") {
            x = model.egg.x - velocity
          } else if (key === "d") {
            x = model.egg.x + velocity
          } else if (key === "l") {
            return attack(model)
          } else if (key === "r") {
            return initModel
          } else {
            return model
          }
        }
        
          if (key === "r") {
            return initModel
          }

          y = Math.max(0, Math.min(y, model.config.worldHeight - model.egg.height))
          x = Math.max(0, Math.min(x, model.config.worldWidth - model.egg.width))

          return EggUtils.updateInModel(model, { x: x, y: y })
        }),
        Match.tag("Canvas.MsgTick", () =>
          model.isGameOver
            ? model
            : pipe(
                model,
                updateEgg,
                updateEggnemies,
                updateCollision,
                updateGameOver,
                updateTicks,
              )
        ),
        Match.orElse(() => model)
      )

    const updateEgg = (model: Model) =>
      EggUtils.updateInModel(model, {
        y: Math.max(0, Math.min(model.egg.y, model.config.worldHeight - model.egg.height)),
        x: Math.max(0, Math.min(model.egg.x, model.config.worldWidth - model.egg.width)),
      })

    const eggnemySpeed = 2
    const updateEggnemies = (model: Model): Model =>
      Model.make({
        ...model,
        eggnemies: model.eggnemies.map((e) => {
          if (model.isGameOver) {
            return e
          }

          const dx = model.egg.x - e.x
          const dy = model.egg.y - e.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          const normalizedDx = distance === 0 ? 0 : dx / distance
          const normalizedDy = distance === 0 ? 0 : dy / distance
          const vx = normalizedDx * eggnemySpeed
          const vy = normalizedDy * eggnemySpeed

          return Eggnemies.make({
            ...e,
            x: e.x + vx,
            y: e.y + vy,
          })
        }),
      })

    const updateTicks = (model: Model) =>
      Model.make({
        ...model,
        ticks: model.ticks + 1,
      })

const updateGameOver = (model: Model) => {
  const egg = model.egg;
  const isGameOver = egg.hp <= 0 || model.eggnemies.length === 0

      if (isGameOver) {
        return Model.make({
          ...model,
          isGameOver: true,
        })
      }

      return model
    }

    const attack = (model: Model): Model => {
      if (model.isGameOver) {
        return model
      }

      const egg = model.egg
      const eggnemies = model.eggnemies.filter((eggnemy) => !isinCollision(egg, eggnemy))

      return Model.make({
        ...model,
        eggnemies: eggnemies,
      })
    }

    const view = (model: Model) =>
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

    const root = document.getElementById("app")!
    const { config } = initModel

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