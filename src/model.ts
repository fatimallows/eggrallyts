import { Array, Schema as S, pipe } from "effect"

export type World = typeof World.Type
export const World = S.Struct({
  x: S.Number,
  y: S.Number,
  width: S.Number,
  height: S.Number,
})

export const WorldUtils = {
  top: (world: World) => world.y,
  bottom: (world: World) => world.y + world.height,
  left:  (world: World) => world.x,
  right:  (world: World) => world.x + world.width,
  updateInModel: (model: Model, updates: Partial<World>) =>
    Model.make({
      ...model,
      world: World.make({
        ...model.world,
        ...updates,
      })
    }),
}

export type Timer = typeof Timer.Type
export const Timer = S.Struct({
    seconds: S.Number,
    minutes: S.Number,
})

export const Rectangle = S.Struct({
  x: S.Number,
  y: S.Number,
  height: S.Number,
  width: S.Number,
})
export type Rectangle = typeof Rectangle.Type

export const Config = S.Struct({
  screenWidth: S.Number,
  screenHeight: S.Number,
  worldWidth: S.Number,
  worldHeight: S.Number,
  fps: S.Number,
  canvasId: S.String,
  velocity: S.Number,
  eggInvincibilityFrames: S.Number,
  eggnemiesCount: S.Number,
})
export type Config = typeof Config.Type

export const Egg = S.Struct({
  x: S.Number,
  y: S.Number,
  height: S.Number,
  width: S.Number,
  vx: S.Number,
  vy: S.Number,
  hp: S.Number,
  maxHp: S.Number,
})
export type Egg = typeof Egg.Type

export const Eggnemies = S.Struct({
  x: S.Number,
  y: S.Number,
  height: S.Number,
  width: S.Number,
  vx: S.Number,
  vy: S.Number,
  id: S.Number,
  hp: S.Number, 
  maxHp: S.Number,
})
export type Eggnemies = typeof Eggnemies.Type

export const Model = S.Struct({
    world: World,
  config: Config,
  egg: Egg,
  eggnemies: S.Array(Eggnemies),
  isGameOver: S.Boolean,
  score: S.Number,
  ticks: S.Number,
  firstCollisionTick: S.Int,
  defeatedEggnemies: S.Number,
  timer: Timer,
})
export type Model = typeof Model.Type

export const Settings = S.Struct({
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
  eggnemyMaxHp: S.Number,
  eggnemyInitHP: S.Number,
})
export type Settings = typeof Settings.Type

export const EggnemiesUtils = {
  top: (eggnemies: Eggnemies) => eggnemies.y,
  bottom: (eggnemies: Eggnemies) => eggnemies.y + eggnemies.height,
  left: (eggnemies: Eggnemies) => eggnemies.x,
  right: (eggnemies: Eggnemies) => eggnemies.x + eggnemies.width,
  updateInModel: (model: Model, updates: Partial<Eggnemies>[]) =>
    Model.make({
      ...model,
      eggnemies: pipe(model.eggnemies, Array.map((eggnemy) => Eggnemies.make({...eggnemy, ...updates})))
    }),
  spawn: (config: Config, onScreen: boolean = true, eggnemies: Eggnemies) => {
    const x = onScreen 
      ? Math.random() * config.screenWidth
      : Math.random() * config.worldWidth - config.worldWidth / 2
    const y = onScreen
      ? Math.random() * config.screenHeight
      : Math.random() * config.worldHeight - config.worldHeight / 2
    return Eggnemies.make({
      ...eggnemies,
      x,
      y,
    })
  }
}

export const EggUtils = {
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
  handleDefeat: (model: Model, eggnemiesId: number) => { 
    const updatedEggnemies = model.eggnemies.filter(e => e.id !== eggnemiesId)
    return Model.make({
      ...model,
      eggnemies: updatedEggnemies,
    })
  }
}