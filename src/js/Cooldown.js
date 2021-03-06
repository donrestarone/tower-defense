
class Cooldown {

  ticksPassed = 0
  totalTicks = 0
  numActivations = 0

  constructor(cooldownLength, options={}) {
    this.cooldownLength = cooldownLength
    this.softReset = options.softReset
    this.autoActivate = options.autoActivate
    this.callback = options.callback || (() => {})

    if (!options.delayActivation) {
      this.ticksPassed = cooldownLength
    }
  }

  toJSON() {
    return {
      ticksPassed: this.ticksPassed,
    }
  }

  /*
   * Increment time. Main function. Cooldown will become ready or closer to use.
   */
  tick() {
    this.ticksPassed++
    this.totalTicks++
    if (this.autoActivate && this.ready()) {
      this.activate()
    }
  }

  /*
   * Inform the Cooldown class that the ability has been activated.
   * This will trigger the cooldown and potentially call a callback.
   */
  activate() {
    this.coolDown()
    this.callback()
    this.numActivations += 1
  }

  /*
   * Trigger the cooldown period.
   * Will either subtract time or reset to 0, depending on settings.
   */
  coolDown() {
    if (this.softReset) {
      this.ticksPassed -= this.cooldownLength
    } else {
      this.ticksPassed = 0
    }
  }

  /*
   * Returns whether or not the ability is ready to use.
   */
  ready() {
    return this.ticksPassed >= this.cooldownLength
  }

  /*
   * A synonym for ready() for certain contexts (eg. ammo used up)
   */
  spent() {
    return this.ready()
  }

  /*
   * Set ticksPassed to a new value (required for game updates/corrections).
   */
  setTicksPassed(newTicksPassed) {
    this.ticksPassed = newTicksPassed
  }
}

/*
 * This function allows for passing time-based information to build a tick-based
 * Cooldown.
 * This allows for cooldowns that are not dependent on the frequency of ticks.
 */
Cooldown.createTimeBased = function(cooldownLength, tickLength, options={}) {
  const numTicks = parseInt(cooldownLength / tickLength)
  return new Cooldown(numTicks, options)
}

export default Cooldown
