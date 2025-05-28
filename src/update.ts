import { Effect, Match, pipe } from "effect"
import { Cmd } from "cs12242-mvu/src/index"
import { CanvasMsg } from "cs12242-mvu/src/canvas"
import { Model, WorldUtils, EggUtils, Eggnemies, Egg, Rectangle, Settings, EggnemiesUtils, Timer } from "./model"

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
  const boss = model.boss
  let currentHp = model.egg.hp
  let firstCollisionTick = model.firstCollisionTick
  const invincibilityDuration = model.config.eggInvincibilityFrames

  const canTakeDamage = model.ticks - firstCollisionTick >= invincibilityDuration

  if (canTakeDamage) {
    for (const enemy of model.eggnemies) {
      if (isinCollision(egg, enemy)) {
        currentHp = currentHp - 1 < 1 ? 0 : currentHp - 1
        firstCollisionTick = model.ticks
      }
    }
  }

  if (canTakeDamage) {
    if (model.isBossActive && model.boss.hp >0 && isinCollision(egg, boss)) {
      currentHp = currentHp - 3 <1? 0: currentHp -3
      firstCollisionTick = model.ticks
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

// const eggnemySpeed = 2
// export const updateEggnemies = (model: Model): Model =>
//   Model.make({
//     ...model,
//     eggnemies: model.eggnemies.map((e) => {
//       if (model.isGameOver) return e

//       const dx = model.egg.x - e.x
//       const dy = model.egg.y - e.y
//       const distance = Math.sqrt(dx * dx + dy * dy)
//       const normalizedDx = distance === 0 ? 0 : dx / distance
//       const normalizedDy = distance === 0 ? 0 : dy / distance
//       const vx = normalizedDx * eggnemySpeed
//       const vy = normalizedDy * eggnemySpeed

//       return Eggnemies.make({ 
//         x: e.x + vx, 
//         y: e.y + vy, 
//         width: e.width, 
//         height: e.height, 
//         vx: e.vx, 
//         vy: e.vy, 
//         hp: e.hp, 
//         maxHp: e.maxHp, 
//         id: e.id 
//       })
//     }),
//   })
const getDistance = (e1: Eggnemies, e2: Eggnemies): number => {
  const dx = e1.x - e2.x
  const dy = e1.y - e2.y
  return Math.sqrt(dx * dx + dy * dy)
};

export const updateEggnemies = (model: Model): Model => {
  
  if (model.isGameOver) {
    return model
  }

  const eggnemySpeed = 2
  const activeEggnemies = model.eggnemies.filter(e => e.hp > 0)
  let newEggnemies: Eggnemies[] = []

  //attraction to egg
  for (let i = 0; i < activeEggnemies.length; i++) {
    let eggnemy = activeEggnemies[i]
    let vx = 0
    let vy = 0
    const dxToEgg = model.egg.x - eggnemy.x;
    const dyToEgg = model.egg.y - eggnemy.y;
    const distanceToEgg = Math.sqrt(dxToEgg * dxToEgg + dyToEgg * dyToEgg)
    const normalizedDxToEgg = distanceToEgg === 0 ? 0 : dxToEgg / distanceToEgg
    const normalizedDyToEgg = distanceToEgg === 0 ? 0 : dyToEgg / distanceToEgg
    vx += normalizedDxToEgg * eggnemySpeed * 0.5
    vy += normalizedDyToEgg * eggnemySpeed * 0.5

    //repulsion to other eggnemies
    for (let j = 0; j < activeEggnemies.length; j++) {
      if (i === j) continue
      const other = activeEggnemies[j]
      if (isinCollision(eggnemy, other)) {
        const dx = eggnemy.x - other.x
        const dy = eggnemy.y - other.y
        const distance = getDistance(eggnemy, other);
        const normalizedDx = distance === 0 ? dx : dx / distance
        const normalizedDy = distance === 0 ? dy : dy / distance
        vx += normalizedDx 
        vy += normalizedDy 
      }
    }

    const newX = eggnemy.x + vx
    const newY = eggnemy.y + vy

    newEggnemies.push(Eggnemies.make({ ...eggnemy, x: newX, y: newY }))
  }

  return Model.make({
    ...model,
    eggnemies: newEggnemies,
  })
}

export const updateGameOver = (model: Model): Model => {
  const isPlayerWinner = model.isBossActive && model.boss.hp <= 0
  const isPLayerLoser = model.egg.hp <= 0
  const isGameOver = isPlayerWinner || isPLayerLoser


  if (isGameOver && !model.isGameOver) {
    let updatedLeaderboard = model.leaderboard

    if (isPlayerWinner) {
      let updatedLeaderboard = writeLeaderboard([...model.leaderboard], model.timer)
      LeaderboardUtils.write(updatedLeaderboard) 
    }

    return Model.make({ 
      ...model, 
      isGameOver: true,
      leaderboard: updatedLeaderboard,
      defeatedEggnemies: model.defeatedEggnemies + (model.isBossActive ? 1 : 0) })
  }

  return model
}

export const updateTime = (model: Model): Model => {
  const seconds = Math.floor(model.ticks / 30)
  const minutes = Math.floor(seconds / 30)
  
  return Model.make({
        ...model,
        timer: {
            seconds: seconds % 60,
            minutes: minutes,
        },
        })
}

export const attack = (model: Model): Model => {
  if (model.isGameOver) return model
  const egg = model.egg

  const collidedEggnemies = model.eggnemies.filter((e) => 
    isinCollision(egg, e)
)
  const updatedCollidedEggnemies = collidedEggnemies.map((e)=> 
    Eggnemies.make({
      ...e, 
      hp: e.hp - 1 })
)
  const defeatedEggnemies = updatedCollidedEggnemies.filter((e) => 
    e.hp <= 0)

  const updatedBoss = isinCollision(egg, model.boss)? Eggnemies.make({
      ...model.boss,
      hp: model.boss.hp - 1,
    }) : model.boss
  
  const survivingEggnemies = [
      ...updatedCollidedEggnemies.filter((e) => 
        e.hp > 0),
      ...model.eggnemies.filter((e) => !isinCollision(egg, e))
    ]

  return Model.make({ 
    ...model, 
    defeatedEggnemies: model.defeatedEggnemies + defeatedEggnemies.length, 
    eggnemies: survivingEggnemies,
    boss: updatedBoss,
   })
}

export const restart = (model: Model, settings: Settings): Model => {
  return Model.make({
    world: model.world,
    config: model.config,
    egg: Egg.make({
      x: model.config.worldWidth / 2,
      y: model.config.worldHeight / 2,
      width: settings.eggWidth,
      height: settings.eggHeight,
      vx: 0,
      vy: 0,
      hp: settings.eggInitHP,
      maxHp: settings.eggInitHP,
    }),
    eggnemies: [],
    eggnemiesSpawned: 0,
    boss: Eggnemies.make({
      x: 0, 
      y: 0, 
      width: settings.bossWidth, 
      height: settings.bossHeight, 
      vx: 0, 
      vy: 0, 
      id: 0, 
      hp: settings.bossInitHP, 
      maxHp: settings.bossInitHP
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
  })}

export const spawnEggnemies = (model: Model, settings: Settings) => {  
  const shouldSpawn = model.ticks % 300 === 0 && model.eggnemiesSpawned < settings.eggnemiesCount
  if (!shouldSpawn) return model

  const onScreen = Math.random() < 0.5
  const x = onScreen
  ? Math.random() * settings.screenWidth
  : Math.random() * settings.worldWidth - settings.worldWidth / 2
  const y = onScreen
  ? Math.random() * settings.screenHeight
  : Math.random() * settings.worldHeight - settings.worldHeight / 2
  const spawn = Eggnemies.make({
    x,
    y,
    width: settings.eggnemyWidth,
    height: settings.eggnemyHeight,
    vx: 1,
    vy: 1,
    id: model.eggnemies.length + 1,
    hp: settings.eggnemyInitHP,
    maxHp: settings.eggnemyInitHP,
  })
  return Model.make({
    ...model,
    eggnemies: [...model.eggnemies, spawn],
    eggnemiesSpawned: model.eggnemiesSpawned + 1,
  })
}

export const spawnBoss = (model: Model, settings: Settings): Model => {
  if (model.defeatedEggnemies >= settings.eggnemiesToSpawnBoss && !model.isBossActive) {
    return Model.make({ 
      ...model, 
      boss: Eggnemies.make({
        x: model.world.x + model.world.width / 2 - settings.bossWidth / 2,
        y: model.world.y + model.world.height / 2 - settings.bossHeight / 2,
        width: settings.bossWidth,
        height: settings.bossHeight,
        vx: 0,
        vy: 0,
        id: 0,
        hp: settings.bossInitHP,
        maxHp: settings.bossInitHP,
      }),
      isBossActive: true,
    })
  } else {
    return model
  }
}



export const updateBoss = (model: Model): Model => {
  if (!model.isBossActive || !model.boss) {
    return model
  }

  let boss = Eggnemies.make(model.boss)
  let vx = 0
  let vy = 0
  const bossSpeed = 3

  // attraction to egg
  const dxToEgg = model.egg.x - boss.x
  const dyToEgg = model.egg.y - boss.y
  const distanceToEgg = Math.sqrt(dxToEgg * dxToEgg + dyToEgg * dyToEgg)
  const normalizedDxToEgg = distanceToEgg === 0 ? 0 : dxToEgg / distanceToEgg
  const normalizedDyToEgg = distanceToEgg === 0 ? 0 : dyToEgg / distanceToEgg
  vx += normalizedDxToEgg * bossSpeed * 0.7;
  vy += normalizedDyToEgg * bossSpeed * 0.7

  // repulsion to eggnemies
  for (const eggnemy of model.eggnemies.filter(e => e.hp > 0)) {
    if (isinCollision(boss, eggnemy)) {
      const dx = boss.x - eggnemy.x
      const dy = boss.y - eggnemy.y
      const distance = getDistance(boss, eggnemy)
      const normalizedDx = distance === 0 ? dx : dx / distance
      const normalizedDy = distance === 0 ? dy : dy / distance
      vx += normalizedDx 
      vy += normalizedDy
    }
  }

  const newX = boss.x + vx
  const newY = boss.y + vy

  return Model.make({
    ...model,
    boss: Eggnemies.make({ ...boss, x: newX, y: newY }),
  })
}

const formatTime = (time: Timer | undefined): string => {
  if (!time) return "--:--";
  const minutes = time.minutes ?? 0
  const seconds = time.seconds ?? 0
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}

export const LeaderboardUtils = {
  read: (): Timer[] => {
    try {
      const data = localStorage.getItem("leaderboard")
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error("Failed to read leaderboard:", error)
      return []
    }
  },

  write: (leaderboard: Timer[]) => {
    try {
      localStorage.setItem("leaderboard", JSON.stringify(leaderboard))
    } catch (error) {
      console.error("Failed to write leaderboard:", error)
    }
  }
}

const writeLeaderboard = (
  leaderboard: Timer[],
  currentTime: Timer
): Timer[] => {
  const updated = [...leaderboard, currentTime]

  updated.sort((a, b) => {
    if (a.minutes === b.minutes) {
      return a.seconds - b.seconds
    }
    return a.minutes - b.minutes
  })

  const maxEntries = 3
  return updated.slice(0, 3)
}

// ====== UPDATE FUNCTION ======

type Msg = CanvasMsg

export const makeUpdate = (initModel: Model, settings: Settings) => (msg: Msg, model: Model): Model | { model: Model; cmd: Cmd<Msg> } =>
  Match.value(msg).pipe(
    Match.tag("Canvas.MsgKeyDown", ({ key }) => {

      console.log("eggnemies spawned:" , model.eggnemiesSpawned)
      console.log("eggnemies defeated:" , model.defeatedEggnemies)
      console.log("eggnemies length:" , model.eggnemies.length)

      let x = model.world.x
      let y = model.world.y
      const velocity = -model.config.velocity

      if (model.isGameOver) {
        if (key === "r"){
            return restart(initModel, settings)
        } return model
      }
        if (key === "w"){
            y = Math.min(y - velocity,EggUtils.top(model.egg))
            const eggnemies = model.eggnemies.map((e) => Eggnemies.make({...e, y: e.y - velocity}))
            const boss = Eggnemies.make({...model.boss, y: model.boss.y - velocity })
            model = y === EggUtils.top(model.egg) ? model : Model.make({ ...model, eggnemies, boss})
        }
        else if (key === "s") {
            y = Math.max(y + velocity, (model.egg.y + model.egg.height) - model.world.height)
            const eggnemies = model.eggnemies.map((e) => Eggnemies.make({...e, y: e.y + velocity}))
            const boss = Eggnemies.make({...model.boss, y: model.boss.y + velocity })
            model = y == (model.egg.y + model.egg.height) - model.world.height ? model : Model.make({ ...model, eggnemies, boss })
        }
        
        else if (key === "a") {
            x = Math.min(x-velocity, EggUtils.left(model.egg))
            const eggnemies = model.eggnemies.map((e) => Eggnemies.make({...e, x: e.x - velocity}))
            const boss = Eggnemies.make({...model.boss, x: model.boss.x - velocity })
            model = x === EggUtils.left(model.egg) ? model : Model.make({ ...model, eggnemies, boss })
        }
        else if (key === "d"){
            x = Math.max(x+velocity, (model.egg.x+model.egg.width)-model.world.width)
            const eggnemies = model.eggnemies.map((e) => Eggnemies.make({...e, x: e.x + velocity}))
            const boss = Eggnemies.make({...model.boss, x: model.boss.x + velocity })
            model = x === (model.egg.x+model.egg.width)-model.world.width ? model : Model.make({ ...model, eggnemies, boss})
        }
        else if (key === "l") return attack(model)
        else return model

      return WorldUtils.updateInModel(model, { x, y })
    }
  ),
    Match.tag("Canvas.MsgTick", () =>
      model.isGameOver
        ? model
        : pipe(model, 
          updateEgg, 
          updateEggnemies, 
          updateCollision, 
          (model) => spawnEggnemies(model, settings),
          (model) => spawnBoss(model, settings),
          updateBoss,
          updateGameOver, 
          updateTicks,
          updateTime)
    ),
    Match.orElse(() => model)
  )