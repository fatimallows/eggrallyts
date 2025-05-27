import { Match, pipe } from "effect"
import { Cmd } from "cs12242-mvu/src/index"
import { CanvasMsg } from "cs12242-mvu/src/canvas"
import { Model, EggUtils, Eggnemies, Egg, Rectangle } from "./model"

export type Msg = CanvasMsg

const isinCollision = (rect1: Rectangle, rect2: Rectangle) => {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  )
}

export const updateCollision = (model: Model): Model => {
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

export const updateTicks = (model: Model) =>
  Model.make({ ...model, ticks: model.ticks + 1 })

export const updateEgg = (model: Model) =>
  EggUtils.updateInModel(model, {
    y: Math.max(0, Math.min(model.egg.y, model.config.worldHeight - model.egg.height)),
    x: Math.max(0, Math.min(model.egg.x, model.config.worldWidth - model.egg.width)),
  })

const eggnemySpeed = 2
export const updateEggnemies = (model: Model): Model =>
  Model.make({
    ...model,
    eggnemies: model.eggnemies.map((e) => {
      if (model.isGameOver) return e

      const dx = model.egg.x - e.x
      const dy = model.egg.y - e.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      const normalizedDx = distance === 0 ? 0 : dx / distance
      const normalizedDy = distance === 0 ? 0 : dy / distance
      const vx = normalizedDx * eggnemySpeed
      const vy = normalizedDy * eggnemySpeed

      return Eggnemies.make({ ...e, x: e.x + vx, y: e.y + vy })
    }),
  })

export const updateGameOver = (model: Model) => {
  const isGameOver = model.egg.hp <= 0 || model.eggnemies.length === 0
  return isGameOver ? Model.make({ ...model, isGameOver: true }) : model
}

export const attack = (model: Model): Model => {
  if (model.isGameOver) return model
  const egg = model.egg
  const eggnemies = model.eggnemies.filter((e) => !isinCollision(egg, e))
  return Model.make({ ...model, eggnemies })
}

export const makeUpdate = (initModel: Model) => (msg: Msg, model: Model): Model | { model: Model; cmd: Cmd<Msg> } =>
  Match.value(msg).pipe(
    Match.tag("Canvas.MsgKeyDown", ({ key }) => {
      let x = model.egg.x
      let y = model.egg.y
      const velocity = model.config.velocity

      if (!model.isGameOver) {
        if (key === "s") y += velocity
        else if (key === "w") y -= velocity
        else if (key === "a") x -= velocity
        else if (key === "d") x += velocity
        else if (key === "l") return attack(model)
        else if (key === "r") return initModel
        else return model
      }

      if (key === "r") return initModel

      y = Math.max(0, Math.min(y, model.config.worldHeight - model.egg.height))
      x = Math.max(0, Math.min(x, model.config.worldWidth - model.egg.width))

      return EggUtils.updateInModel(model, { x, y })
    }),
    Match.tag("Canvas.MsgTick", () =>
      model.isGameOver
        ? model
        : pipe(model, updateEgg, updateEggnemies, updateCollision, updateGameOver, updateTicks)
    ),
    Match.orElse(() => model)
  )
