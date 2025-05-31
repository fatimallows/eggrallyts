import { Effect, Match, pipe } from "effect"
import { Cmd } from "cs12242-mvu/src/index"
import { CanvasMsg } from "cs12242-mvu/src/canvas"
import { Model, WorldUtils, EggUtils, Eggnemies, Egg, Rectangle, Settings, Timer } from "./model"

// ====== HELPER FUNCTIONS ======

const playSound = (sound: string) => {
  const audio = new Audio(sound)
  audio.play()  
}

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

  const canTakeDamage = !model.egg.levelUp && model.ticks - firstCollisionTick >= invincibilityDuration

  if (canTakeDamage) {
    for (const enemy of model.eggnemies) {
      if (isinCollision(egg, enemy)) {
        currentHp = currentHp - 1 < 1 ? 0 : currentHp - 1
        firstCollisionTick = model.ticks
      }
    }
    for (const boss of model.bosses ?? []) {
      if (boss.hp > 0 && isinCollision(egg, boss)) {
        currentHp = currentHp - 3 < 1 ? 0 : currentHp - 3
        firstCollisionTick = model.ticks
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

const getDistance = (e1: Eggnemies, e2: Eggnemies): number => {
  const dx = e1.x - e2.x
  const dy = e1.y - e2.y
  return Math.sqrt(dx * dx + dy * dy)
};

export const updateEggnemies = (model: Model, settings: Settings): Model => {
  
  if (model.isGameOver || model.egg.levelUp) {
    return model
  }

  const activeEggnemies = model.eggnemies.filter(e => e.hp > 0)
  const eggnemySpeed = settings.eggnemyInitSpeed + model.defeatedBosses * settings.speedIncrement

  if (activeEggnemies.length <= 1) {
    model = spawnEggnemies(model, settings)
  }

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
        vx += normalizedDx *1.4
        vy += normalizedDy *1.4
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
  const isGameOver = model.egg.hp <= 0


  if (isGameOver && !model.isGameOver) {
    let updatedLeaderboard = writeLeaderboard([...model.leaderboard], model.timer)
    LeaderboardUtils.write(updatedLeaderboard)
    
    playSound("../resources/game-over.mp3")

    return Model.make({ 
      ...model, 
      isGameOver: true,
      leaderboard: updatedLeaderboard,
      defeatedEggnemies: model.defeatedEggnemies 
    })
  }

  return model
}


export const updateTime = (model: Model): Model => {
  const seconds = Math.floor(model.ticks / 30)
  const minutes = Math.floor(seconds / 60)
  
  return Model.make({
    ...model,
    timer: {
        seconds: seconds % 60,
        minutes: minutes,
    },
  })
}


export const updateEggxperience = (model: Model, settings: Settings): Model => {
  const updatedEggxperience = model.defeatedEggnemies

  const levelUp = (updatedEggxperience != 0 && 
    updatedEggxperience % settings.eggxperienceLimit === 0 &&  
    updatedEggxperience != model.egg.level * settings.eggxperienceLimit)  
  
  if (levelUp && !model.egg.levelUp) {
    playSound("../resources/egghancement.mp3")
  }

  return EggUtils.updateInModel(model, {
    eggxperience: model.defeatedEggnemies,
    levelUp: levelUp,
  })
}
  

export const attack = (model: Model): Model => {
  if (model.egg.levelUp || model.isGameOver) return model
  const egg = model.egg

  const collidedEggnemies = model.eggnemies.filter((e) => isinCollision(egg, e))
  const updatedCollidedEggnemies = collidedEggnemies.map((e) =>
    Eggnemies.make({
      ...e,
      hp: e.hp - egg.attack
    })
  )
  const defeatedEggnemies = updatedCollidedEggnemies.filter((e) => e.hp <= 0)
  const survivingEggnemies = [
    ...updatedCollidedEggnemies.filter((e) => e.hp > 0),
    ...model.eggnemies.filter((e) => !isinCollision(egg, e))
  ]

  let defeatedBossesCount = 0
  const updatedBosses = (model.bosses ?? []).map((boss) => {
    if (isinCollision(egg, boss)) {
      const newHp = boss.hp - egg.attack
      if (newHp <= 0) defeatedBossesCount++
      return Eggnemies.make({
        ...boss,
        hp: newHp < 0 ? 0 : newHp
      })
    }
    return boss
  })

  return Model.make({
    ...model,
    eggnemies: survivingEggnemies,
    bosses: updatedBosses,
    defeatedBosses: model.defeatedBosses + defeatedBossesCount,
    defeatedEggnemies: model.defeatedEggnemies + defeatedEggnemies.length + defeatedBossesCount    
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
      eggxperience: 0,
      attack: settings.eggInitAttack,
      speed: settings.eggInitSpeed,
      levelUp: false,
      level: 0,
    }),
    eggnemies: [],
    eggnemiesSpawned: 0,
    bosses: [],
    lastBossSpawnThreshold: 0,
    isGameOver: false,
    score: 0,
    ticks: 0,
    firstCollisionTick: -30,
    defeatedEggnemies: 0,
    defeatedBosses: 0,
    timer: {
      seconds: 0,
      minutes: 0,
    },
    leaderboard: LeaderboardUtils.read(),
  })}

export const spawnEggnemies = (model: Model, settings: Settings) => {
  const randomSpawnChance = Math.random()
  const shouldSpawn = randomSpawnChance < 0.01
  if (!shouldSpawn || model.egg.levelUp) return model

  const numberOfEggnemiesToSpawn = Math.floor(Math.random() * 3) + 1 

  let updatedModel = model
  for (let i = 0; i < numberOfEggnemiesToSpawn; i++) {
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
      id: updatedModel.eggnemies.length + 1,
      hp: settings.eggnemyInitHP + model.defeatedBosses*settings.hpIncrement,
      maxHp: settings.eggnemyInitHP + model.defeatedBosses*settings.hpIncrement,
      speed: settings.eggnemyInitSpeed + model.defeatedBosses * settings.speedIncrement,
      attack: settings.eggnemyInitAttack + model.defeatedBosses*settings.attackIncrement
    })
    updatedModel = Model.make({
      ...updatedModel,
      eggnemies: [...updatedModel.eggnemies, spawn],
      eggnemiesSpawned: updatedModel.eggnemiesSpawned + 1,
    })
  }

  return updatedModel
}

export const spawnBoss = (model: Model, settings: Settings): Model => {
  const currentThreshold = Math.floor(model.defeatedEggnemies / settings.eggnemiesToSpawnBoss) * settings.eggnemiesToSpawnBoss;
  
  if (
    model.defeatedEggnemies !== 0 &&
    model.defeatedEggnemies % settings.eggnemiesToSpawnBoss === 0 &&
    currentThreshold > model.lastBossSpawnThreshold
  ) {
    const newBoss = Eggnemies.make({
      x: model.world.x + model.world.width / 2 - settings.bossWidth / 2,
      y: model.world.y + model.world.height / 2 - settings.bossHeight / 2,
      width: settings.bossWidth,
      height: settings.bossHeight,
      vx: 0,
      vy: 0,
      id: model.eggnemiesSpawned + model.bosses.length + 1,
      hp: settings.bossInitHP + model.defeatedBosses * settings.hpIncrement,
      maxHp: settings.bossInitHP + model.defeatedBosses * settings.hpIncrement,
      attack: settings.bossInitAttack + model.defeatedBosses * settings.attackIncrement,
      speed: settings.bossInitSpeed + model.defeatedBosses * settings.speedIncrement,
    });
    return Model.make({
      ...model,
      bosses: [...model.bosses, newBoss],
      lastBossSpawnThreshold: currentThreshold,
    });
  } else {
    return model;
  }
}

export const updateBoss = (model: Model, settings: Settings): Model => {
  if (model.egg.levelUp) return model

  let defeatedBossesCount = 0
  const aliveBosses = (model.bosses).filter(boss => {
    if (boss.hp <= 0) {
      defeatedBossesCount++
      return false
    }
    return true
  })

  if (defeatedBossesCount > 0) {
    playSound("../resources/defeated-boss.mp3")
  }

  const updatedBosses = aliveBosses.map(boss => {
    let vx = 0
    let vy = 0
    const bossSpeed = boss.speed

    // attraction to egg
    const dxToEgg = model.egg.x - boss.x
    const dyToEgg = model.egg.y - boss.y
    const distanceToEgg = Math.sqrt(dxToEgg * dxToEgg + dyToEgg * dyToEgg)
    const normalizedDxToEgg = distanceToEgg === 0 ? 0 : dxToEgg / distanceToEgg
    const normalizedDyToEgg = distanceToEgg === 0 ? 0 : dyToEgg / distanceToEgg
    vx += normalizedDxToEgg * bossSpeed * 0.7
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

    return Eggnemies.make({ ...boss, x: newX, y: newY })
  })

  return Model.make({
    ...model,
    bosses: updatedBosses,
    defeatedBosses: model.defeatedBosses + defeatedBossesCount,
  })
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
      return b.seconds - a.seconds
    }
    return b.minutes - a.minutes
  })

  const maxEntries = 3
  return updated.slice(0, 3)
}

// ====== UPDATE FUNCTION ======

type Msg = CanvasMsg

export const makeUpdate = (initModel: Model, settings: Settings) => (msg: Msg, model: Model): Model | { model: Model; cmd: Cmd<Msg> } =>
  Match.value(msg).pipe(
    Match.tag("Canvas.MsgKeyDown", ({ key }) => {

      console.log("Eggnemies:", model.eggnemies)
      console.log("Egg HP:", model.egg.hp)

      let x = model.world.x
      let y = model.world.y
      const velocity = -model.egg.speed

      if (model.isGameOver) {
        if (key === "r"){
            return restart(initModel, settings)
        } return model
      }
      console.log("model egg level up:", model.egg.levelUp)
      if (model.egg.levelUp){
        if (key === "1") return EggUtils.updateInModel(model, {level: model.egg.level+1, hp: model.egg.hp + settings.hpIncrement, maxHp: model.egg.maxHp + settings.hpIncrement})
        else if (key === "2") return EggUtils.updateInModel(model, {level: model.egg.level+1,attack: model.egg.attack + settings.attackIncrement})
        else if (key === "3") return EggUtils.updateInModel(model, {level: model.egg.level+1, speed: model.egg.speed + settings.speedIncrement})
      return model
      }
        if (key === "w") {
            y = Math.min(y - velocity, EggUtils.top(model.egg))
            const eggnemies = model.eggnemies.map((e) => Eggnemies.make({ ...e, y: e.y - velocity }))
            const bosses = (model.bosses ?? []).map((b) => Eggnemies.make({ ...b, y: b.y - velocity }))
            model = y === EggUtils.top(model.egg) ? model : Model.make({ ...model, eggnemies, bosses })
        }
        else if (key === "s") {
            y = Math.max(y + velocity, (model.egg.y + model.egg.height) - model.world.height)
            const eggnemies = model.eggnemies.map((e) => Eggnemies.make({ ...e, y: e.y + velocity }))
            const bosses = (model.bosses ?? []).map((b) => Eggnemies.make({ ...b, y: b.y + velocity }))
            model = y == (model.egg.y + model.egg.height) - model.world.height ? model : Model.make({ ...model, eggnemies, bosses })
        }
        else if (key === "a") {
            x = Math.min(x - velocity, EggUtils.left(model.egg))
            const eggnemies = model.eggnemies.map((e) => Eggnemies.make({ ...e, x: e.x - velocity }))
            const bosses = (model.bosses ?? []).map((b) => Eggnemies.make({ ...b, x: b.x - velocity }))
            model = x === EggUtils.left(model.egg) ? model : Model.make({ ...model, eggnemies, bosses })
        }
        else if (key === "d") {
            x = Math.max(x + velocity, (model.egg.x + model.egg.width) - model.world.width)
            const eggnemies = model.eggnemies.map((e) => Eggnemies.make({ ...e, x: e.x + velocity }))
            const bosses = (model.bosses ?? []).map((b) => Eggnemies.make({ ...b, x: b.x + velocity }))
            model = x === (model.egg.x + model.egg.width) - model.world.width ? model : Model.make({ ...model, eggnemies, bosses })
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
          (model) => updateBoss(model, settings),
          (model) => updateEggnemies(model, settings), 
          updateCollision, 
          (model) => spawnEggnemies(model, settings),
          (model) => spawnBoss(model, settings),
          updateGameOver, 
          updateTicks,
          updateTime,
          (model) => updateEggxperience(model, settings),

        )
    ),
    Match.orElse(() => model)
  )