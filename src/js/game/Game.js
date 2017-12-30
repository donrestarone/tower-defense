
import { observable, computed, action, autorun } from 'mobx'

import WaveSpawner from '../WaveSpawner'
import Cooldown from '../Cooldown'
import Performance from '../Performance'
import Unit from '../units/Unit'
import Cannon from '../units/Cannon'
import Flamethrower from '../units/Flamethrower'
import MachineGun from '../units/MachineGun'
import Tank from '../units/Tank'

import Map from '../map/Map'
import { GAME_REFRESH_RATE } from '../appConstants'
import { setCorrectingInterval } from '../utility/time'


export default class Game {
  @observable placingTower = false
  @observable enemies = []
  @observable towers = []
  @observable gameCanvas = undefined
  @observable gameCanvasContext = undefined
  @observable credits = {
    start: 55,
    current: 55,
  }
  @observable lives = 20
  @observable inProgress = false

  @observable selectedEntity

  @observable control = {
    run: false,
    speedMultiplier: 1,
  }

  height = 700
  width = 700

  constructor(emitter, actions) {
    this.actions = actions
    this.emitter = emitter

    this.UNIT_TYPES = { Tank, Cannon, Flamethrower, MachineGun }

    this.map = new Map(this)

    // to be overwritten by a subclass if another wave spawner is needed
    this.wave = new WaveSpawner(this.createEnemy.bind(this))
  }

  /*
   * Allows for quick lookups of enemies by ID.
   * Mostly for server communication/updates.
   */
  @computed get enemiesById() {
    const output = {}
    this.enemies.forEach((enemy) => {
      output[enemy.id] = enemy
    })
    return output
  }

  newGame() {
    this.start()
  }

  start() {
    if (this.inProgress) { return }
    this.inProgress = true
    this.reset()
    this.play()
    this.wave.initializeWaveTimer(GAME_REFRESH_RATE)
  }

  @action reset() {
    this.wave.reset()
    this.lives = 20
    this.credits.current = this.credits.start
  }

  /*
   * Simply starts the game loop. Does NOT actually start the game.
   * Ie. play vs pause rather than starting a new game.
   */
  play() {
    if (this.control.run) { return }
    this.control.run = true
    this.initializeLoop()
  }

  @action pause() {
    this.control.run = false
  }

  initializeLoop() {
    // handle moving units, tower scanning, spawning waves, etc.
    return setCorrectingInterval(
      this.gameLogic.bind(this),
      GAME_REFRESH_RATE * this.control.speedMultiplier,
      this.control,
    )
  }

  /*
   * The core logic for the game.
   * Called as part of the game loop. Should likely never be called separately.
   */
  gameLogic() {
    this.updateWave()
    this.commandUnits(this.enemies)
    this.commandUnits(this.towers)
    if (this.lives <= 0) {
      this.endGame()
      this.actions.destroyGame() // could possibly pass scores/end-state here
    }
  }

  loseLife() {
    return --this.lives
  }

  commandUnits(units) {
    for (let i = units.length - 1; i >= 0; i--) {
      let unit = units[i]
      if (unit.completed) { // assume it also has `removed = true`
        const livesLeft = this.loseLife()
        console.log(`Unit reached goal! Remaining lives: ${livesLeft}`);
      }
      if (unit.removed) {
        units.splice(i, 1)
        continue
      }
      if (!unit.disabled && unit.act) {
        unit.act()
      }
    }
  }

  setUpSendPerformance() {
    this.performanceCooldown = Cooldown.createTimeBased(1000, GAME_REFRESH_RATE, {
      callback: this.sendPerformance.bind(this),
      autoActivate: true,
    })
  }

  updateWave() {
    this.wave.updateWaveTimer()
    if (this.wave.ready()) {
      this.spawnWave()
    }
  }

  spawnWave() {
    const newEnemies = this.wave.spawn()
    this.placeWaveEnemies(newEnemies)

    this.enemies = this.enemies.concat(newEnemies)

    // for fun! To see how many enemies there are.
    // Note that enemies are not yet removed from the array upon death.
    console.log("Wave size:", newEnemies.length);
    console.log("Total enemies:", this.enemies.length);
    return newEnemies
  }

  createEnemy(type, subtype) {
    const UnitClass = this.UNIT_TYPES[type]
    return new UnitClass(this, subtype)
  }

  placeWaveEnemies(newEnemies) {
    newEnemies.forEach((enemy, index) => {
      this.placeEnemy(enemy, newEnemies.length, index)
      const enemyTarget = this.getEnemyGoal(enemy)
      enemy.setMoveTarget(enemyTarget.x, enemyTarget.y)
    })
  }

  placeEnemy(enemy, enemiesInWave, numEnemy) {
    const enemyDistance = Math.floor(this.height / enemiesInWave)
    enemy.jumpTo(this.width, numEnemy * enemyDistance)
  }

  canAfford(unit) {
    return this.credits.current >= unit.purchaseCost
  }

  @action buyTower(tower) {
    if (!this.canAfford(tower)) {
      return false
    }
    this.credits.current -= tower.purchaseCost
    return true
  }

  @action profit(amount) {
    this.credits.current += amount
  }

  deselectPlacingTower() {
    if (this.placingTower) {
      this.placingTower.hide()
      this.placingTower = false
    }
  }

  deselectAll() {
    this.deselectPlacingTower()
    this.deselectEntity()
    if (this.selectedEntity) {
      this.selectedEntity.deselect()
      delete this.selectEntity
    }
  }

  deselectEntity() {
    if (this.selectedEntity) {
      this.selectedEntity.deselect()
      delete this.selectEntity
    }
  }

  selectEntity(entity) {
    this.deselectEntity()
    entity.select()
    this.selectedEntity = entity
  }

  placeTower(tower) {
    if (!this.inProgress) { return }
    const placingTower = tower || this.placingTower
    if (!placingTower) { return }

    const TowerType = this.UNIT_TYPES[placingTower.type]
    const finalTower = new TowerType(this)
    // const finalTower = new Flamethrower(this)
    finalTower.jumpTo(placingTower.x, placingTower.y)

    if (finalTower && this.buyTower(finalTower)) {
      finalTower.place()
      finalTower.show()
      this.towers.push(finalTower)
      return finalTower
    }
  }

  clearEnemies() {
    this.enemies.forEach((enemy) => {
      enemy.destroy()
    })
    this.enemies = []
  }

  endGame() {
    this.pause()
    this.clearTowers()
    this.clearEnemies()
    this.waveTimer = null
    this.inProgress = false
  }

  getEnemyGoal(enemy) {
    return {
      x: -enemy.width,
      y: this.height / 2,
    }
  }

  @action adjustGameSpeed(multiplier) {
    // console.log('Setting game speed to:', multiplier);
    this.control.speedMultiplier = multiplier
  }



  // GAME UPDATE METHODS ---------------------

  clearTowers() {
    this.towers.forEach((tower) => {
      tower.destroy()
    })
    this.towers = []
  }

  buildEntityFromData(entity, data) {
    Object.keys(data).forEach((datum) => {
      if (['target', 'cooldown'].indexOf(datum) !== -1) { return } // ignore certain keys
      entity.setAttr(datum, data[datum])
    })
    return entity
  }

}
