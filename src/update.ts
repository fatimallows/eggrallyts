import { Match, pipe, Array } from "effect"
import { Cmd } from "cs12242-mvu/src/index"
import { CanvasMsg } from "cs12242-mvu/src/canvas"
import { Model, Egg, Eggnemies, Rectangle, EggUtils, EggnemiesUtils } from "./model"

export type Msg = CanvasMsg

export const isinCollision = (r1: Rectangle, r2: Rectangle) =>
  r1.x < r2.x + r2.width && r1.x + r1.width > r2.x && r1.y < r2.y + r2.height && r1.y + r1.height > r2.y

export const update = (msg: Msg, model: Model): Model | { model: Model; cmd: Cmd<Msg> } =>
  Match.value(msg).pipe(
    Match.tag("Canvas.MsgKeyDown", ({ key }) => {
      let { x, y } = model.egg
      const v = model.config.velocity

      if (!model.isGameOver) {
        if (key === "s") y += v
        else if (key === "w") y -= v
        else if (key === "a") x -= v
        else if (key === "d") x += v
        else if (key === "l") return attack(model)
        else if (key === "r") return resetModel(model)
        else return model
      }

      x = Math.max(0, Math.min(x, model.config.worldWidth - model.egg.width))
      y = Math.max(0, Math.min(y, model.config.worldHeight - model.egg.height))
      return EggUtils.updateInModel(model, { x, y })
    }),
    Match.tag("Canvas.MsgTick", () =>
      model.isGameOver
        ? model
        : pipe(model, updateEgg, updateEggnemies, updateCollision, updateGameOver, updateTicks)
    ),
    Match.orElse(() => model)
  )

export const updateEgg = (model: Model): Model =>
  EggUtils.updateInModel(model, {
    x: Math.max(0, Math.min(model.egg.x, model.config.worldWidth - model.egg.width)),
    y: Math.max(0, Math.min(model.egg.y, model.config.worldHeight - model.egg.height)),
  })

const eggnemySpeed = 2
export const updateEggnemies = (model: Model): Model =>
  Model.make({
    ...model,
    eggnemies: model.eggnemies.map((e) => {
      if (model.isGameOver) return e
      const dx = model.egg.x - e.x
      const dy = model.egg.y - e.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      const vx = (dist === 0 ? 0 : dx / dist) * eggnemySpeed
      const vy = (dist === 0 ? 0 : dy / dist) * eggnemySpeed
      return Eggnemies.make({ ...e, x: e.x + vx, y: e.y + vy })
    }),
  })

export const updateTicks = (model: Model): Model =>
  Model.make({ ...model, ticks: model.ticks + 1 })

export const updateCollision = (model: Model): Model => {
  const egg = model.egg
  let hp = egg.hp
  let tick = model.firstCollisionTick
  const inv = model.config.eggInvincibilityFrames

  if (model.ticks - tick >= inv) {
    for (const e of model.eggnemies) {
      if (isinCollision(egg, e)) {
        hp -= 1
        tick = model.ticks
        break
      }
    }
  }

  return Model.make({
    ...model,
    egg: Egg.make({ ...egg, hp }),
    firstCollisionTick: tick,
  })
}

export const updateGameOver = (model: Model): Model => {
  if (model.egg.hp <= 0 || model.eggnemies.length === 0) {
    return Model.make({ ...model, isGameOver: true })
  }
  return model
}

export const attack = (model: Model): Model => {
  if (model.isGameOver) return model
  const eggnemies = model.eggnemies.filter((e) => !isinCollision(model.egg, e))
  return Model.make({ ...model, eggnemies })
}

export let resetModel: (model: Model) => Model = (model) => model
