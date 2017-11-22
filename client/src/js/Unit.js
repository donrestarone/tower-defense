
import { observable, computed, action, autorun } from 'mobx'

import { UNIT_REFRESH_RATE } from 'appConstants'
import getUnitRenderer from 'UnitRenderer'

// this should come from an environment variable so the server can run code without rendering
const RENDER_UNITS = true

let ID = 1

class Unit {
  // defaults (observables)
  @observable x = 0
  @observable y = 0
  @observable id
  @observable name
  @observable speed = 100 // pixels per second
  @observable display = true
  @observable disabled = false
  @observable maxHitPoints = 50
  @observable currentHitPoints
  @observable killValue // should be overridden

  constructor(game, options) {
    options = options || {}
    this.id = ID
    ID += 1
    this.game = game
    this.movementId = undefined

    // set defaults
    this.width = undefined // must override
    this.height = undefined // must override
    this.name = undefined // must override
    this.currentHitPoints = this.maxHitPoints


    // override defaults
    for (let key in options) {
      if (options.hasOwnProperty(key)) {
        this[key] = options[key]
      }
    }

    if (game.ignore_ui) {
      this.startRender = () => {} // do nothing
    } else {
      this.startRender = getUnitRenderer(this) // adds the render methods to this class
    }
  }

  @action hide() {
    this.display = false
  }

  @action show() {
    this.display = true
  }

  @action disable() {
    this.disabled = true
  }

  @action enable() {
    this.disabled = false
  }

  /*
   * Jumps/teleports a unit to the given position.
   */
  @action jumpTo(newX, newY) {
    this.x = newX
    this.y = newY
  }

  /*
   * Pauses movement for the unit. Can be resumed.
   */
  @action pauseMovement() {
    clearInterval(this.movementId)
    delete this.movementId
  }

  /*
   * Clears the movement for the unit. Cannot be resumed (needs new move target).
   */
  @action clearMovement() {
    this.pauseMovement()
    delete this.movement
  }

  /*
   * Kicks off movement for the unit. If already moving, clears the previous movement.
   */
  @action startMovement() {
    if (this.movementId) {
      clearInterval(this.movementId) // stop old movement
    }
    this.movementId = setInterval(this.movement, UNIT_REFRESH_RATE)
  }

  /*
   * This method should set a new move target for the unit.
   * It should NOT actually trigger the unit to move if stopped.
   * If the unit is already moving, it ensures they continue in the new direction.
   */
  @action setMoveTarget(finalX, finalY) {
    this.movement = () => {
      const stopMoving = this.moveXAndY(finalX, finalY)
      if (stopMoving) {
        this.pauseMovement()
      }
    }
    if (this.movementId) { // if already moving, continue in a new direction
      this.startMovement()
    }
  }

  /*
   * Moves the unit by one 'turn' or tick. They should move up to their speed (or less
   * if they are close to their objective).
   */
  @action moveXAndY(finalX, finalY) {
    if (this.x === finalX && this.y === finalY) {
      return true
    }

    const actualSpeed = this.speed / (1000 / UNIT_REFRESH_RATE)
    // use polar coordinates to generate X and Y given target destination
    const deltaX = finalX - this.x
    const deltaY = finalY - this.y
    let distance = Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2))
    distance = Math.min(actualSpeed, distance)
    const angle = this.getAngleToPoint(finalX, finalY)

    const xMovement = distance * Math.cos(angle)
    const yMovement = distance * Math.sin(angle)

    this.x += xMovement
    this.y += yMovement
  }

  /*
   * Makes the unit take damage.
   * Returns true if the unit is killed.
   */
  @action takeDamage(amount) {
    if (this.currentHitPoints <= 0) {
      return
    }
    this.currentHitPoints = Math.max(this.currentHitPoints - amount, 0)
    if (this.currentHitPoints <= 0) {
      this.kill()
      return true
    }
  }

  @action kill() {
    // TERMINATE
    // set alive to false?
    // @TODO remove from enemies array
    this.clearMovement() // @TODO should explode
    this.hide()
  }

  isAlive() {
    return this.currentHitPoints > 0
  }

  getAngleToPoint(x, y) {
    return Math.atan2(y - this.y, x - this.x)
  }

  getDistanceToPoint(x, y) {
    return Math.sqrt(Math.pow(this.x - x, 2) + Math.pow(this.y - y, 2))
  }

}

/*
 * Creates a new unit of the given class provided (eg. Cannon, Tank, etc.).
 * Also triggers their initial rendering loop.
 */
Unit.create = function(UnitClass, game, options) {
  const unit = new UnitClass(game, options)
  unit.startRender()
  return unit
}

export default Unit
