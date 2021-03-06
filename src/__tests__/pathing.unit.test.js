
import Pathing from 'map/Pathing'
import { GRID_SIZE } from 'appConstants'

describe('Pathing', function() {

  it('should calculate whether a coordinate is valid', () => {
    const dimensions = getDimensions(5, 5)
    const pathHelper = new Pathing(dimensions, 1)
    expect(pathHelper.weights.coordinateIsValid(0, 0)).toBe(true)

    expect(pathHelper.weights.coordinateIsValid(-1, 0)).toBe(false)
    expect(pathHelper.weights.coordinateIsValid(0, -1)).toBe(false)

    expect(pathHelper.weights.coordinateIsValid(4, 4)).toBe(true)

    expect(pathHelper.weights.coordinateIsValid(5, 0)).toBe(false)
    expect(pathHelper.weights.coordinateIsValid(0, 5)).toBe(false)
  })

  it('should produce an empty weights grid (all ones) by default', () => {
    const dimensions = getDimensions(5, 5)
    const pathHelper = new Pathing(dimensions, 1)

    pathHelper.weights.values.forEach((columnOfWeights) => {
      columnOfWeights.forEach((weight) => {
        expect(weight).toBe(1)
      })
    })
  })

  it('should generate correct path lengths for empty weights map', () => {
    const dimensions = getDimensions(5, 5)
    const pathHelper = new Pathing(dimensions, 1)

    expect(pathHelper.pathLengths.at(4, 4)).toBe(0) // end point

    expect(pathHelper.pathLengths.at(3, 4)).toBe(1)
    expect(pathHelper.pathLengths.at(4, 3)).toBe(1) // adjacent to end point

    expect(pathHelper.pathLengths.at(0, 4)).toBe(4) // corners
    expect(pathHelper.pathLengths.at(4, 0)).toBe(4)

    expect(pathHelper.pathLengths.at(0, 0)).toBe(8) // start point

    expect(pathHelper.pathLengths.at(0, 1)).toBe(7) // adjacent to start point
    expect(pathHelper.pathLengths.at(1, 0)).toBe(7)
  })

  it('should avoid impassable terrain', () => {
    const dimensions = getDimensions(2, 5)
    const pathHelper = new Pathing(dimensions, 1)
    pathHelper.weights.set(0, 1, 0)
    pathHelper.weights.set(1, 3, 0)
    pathHelper.compute()

    assertPath(pathHelper, [
      [0, 0],
      [1, 0],
      [1, 1],
      [1, 2],
      [0, 2],
      [0, 3],
      [0, 4],
      [1, 4],
    ])
  })

  describe('getDirection', function() {
    it('should provide the next target node given a location with valid x and y', () => {
      const dimensions = getDimensions(2, 5)
      const pathHelper = new Pathing(dimensions, 1)
      pathHelper.weights.set(0, 1, 0)
      pathHelper.weights.set(1, 3, 0)
      pathHelper.compute()

      expect(pathHelper.getDirection(0, 0)).toMatchObject({
        x: 1,
        y: 0,
      })
      expect(pathHelper.getDirection(1, 0)).toMatchObject({
        x: 1,
        y: 1,
      })
      expect(pathHelper.getDirection(1, 1)).toMatchObject({
        x: 1,
        y: 2,
      })
      expect(pathHelper.getDirection(1, 2)).toMatchObject({
        x: 0,
        y: 2,
      })
      expect(pathHelper.getDirection(0, 2)).toMatchObject({
        x: 0,
        y: 3,
      })
      expect(pathHelper.getDirection(0, 3)).toMatchObject({
        x: 0,
        y: 4,
      })
      expect(pathHelper.getDirection(0, 4)).toMatchObject({
        x: 1,
        y: 4,
      })
    })

    it('should provide the next target node given a location with non-integer coordinates', () => {
      const dimensions = getDimensions(2, 5)
      const pathHelper = new Pathing(dimensions, 1)
      pathHelper.weights.set(0, 1, 0)
      pathHelper.weights.set(1, 3, 0)
      pathHelper.compute()

      expect(pathHelper.getDirection(0.4, 0)).toMatchObject({
        x: 1,
        y: 0,
      })
      expect(pathHelper.getDirection(1, 0.9)).toMatchObject({
        x: 1,
        y: 1,
      })
      expect(pathHelper.getDirection(1.7, 1.3)).toMatchObject({
        x: 1,
        y: 2,
      })
    })

    it('should provide the next target node given a location given a larger grid size', () => {
      const tileSize = 10
      const dimensions = getDimensions(2 * tileSize, 5 * tileSize)
      const pathHelper = new Pathing(dimensions, tileSize)
      pathHelper.weights.set(0, 1, 0)
      pathHelper.weights.set(1, 3, 0)
      pathHelper.compute()

      expect(pathHelper.getDirection(0, 0)).toMatchObject({
        x: 1 * tileSize,
        y: 0,
      })
      expect(pathHelper.getDirection(1 * tileSize, 0)).toMatchObject({
        x: 1 * tileSize,
        y: 1 * tileSize,
      })
      expect(pathHelper.getDirection(1 * tileSize, 1 * tileSize)).toMatchObject({
        x: 1 * tileSize,
        y: 2 * tileSize,
      })
      expect(pathHelper.getDirection(1 * tileSize, 2 * tileSize)).toMatchObject({
        x: 0,
        y: 2 * tileSize,
      })
      expect(pathHelper.getDirection(0, 2 * tileSize)).toMatchObject({
        x: 0,
        y: 3 * tileSize,
      })
      expect(pathHelper.getDirection(0, 3 * tileSize)).toMatchObject({
        x: 0,
        y: 4 * tileSize,
      })
      expect(pathHelper.getDirection(0, 4 * tileSize)).toMatchObject({
        x: 1 * tileSize,
        y: 4 * tileSize,
      })
    })

    it('should suggest current location when at target location', () => {
      const endGoal = { x: 1, y: 1 }
      const dimensions = getDimensions(2, 2)
      const pathHelper = new Pathing(dimensions, 1, endGoal)
      pathHelper.compute()

      expect(pathHelper.getDirection(1, 1)).toMatchObject({
        x: 1,
        y: 1,
      })
    })

    it('should suggest a diagonal path if valid', () => {
      const dimensions = getDimensions(3, 3)
      const pathHelper = new Pathing(dimensions, 1)
      pathHelper.compute()

      expect(pathHelper.getDirection(0, 0)).toMatchObject({
        x: 1,
        y: 1,
      })
      expect(pathHelper.getDirection(1, 1)).toMatchObject({
        x: 2,
        y: 2,
      })
      expect(pathHelper.getDirection(0, 1)).toMatchObject({
        x: 1,
        y: 2,
      })
      expect(pathHelper.getDirection(1, 0)).toMatchObject({
        x: 2,
        y: 1,
      })
    })

    it('should not suggest a diagonal path if corner not valid', () => {
      const dimensions = getDimensions(3, 3)
      const pathHelper = new Pathing(dimensions, 1)
      pathHelper.weights.set(0, 1, 0)
      pathHelper.compute()

      expect(pathHelper.getDirection(0, 0)).toMatchObject({
        x: 1,
        y: 0,
      })
      expect(pathHelper.getDirection(1, 0)).toMatchObject({
        x: 2,
        y: 1,
      })
      expect(pathHelper.getDirection(2, 1)).toMatchObject({
        x: 2,
        y: 2,
      })
    })

  })

  describe('addObstacle', function() {

    it('should return true if an obstacle can be added', () => {
      const dimensions = getDimensions(10, 10)
      const pathHelper = new Pathing(dimensions, 1)

      const success = pathHelper.addObstacle({ x: 1, y: 1}, 3, 2)

      expect(success).toBe(true)
    })

    it('should update weights grid with a newly added obstacle', () => {
      const dimensions = getDimensions(5, 5)
      const pathHelper = new Pathing(dimensions, 1)

      pathHelper.addObstacle({ x: 1, y: 1}, 3, 2)

      expect(pathHelper.weights.at(1, 1)).toBe(0)
      expect(pathHelper.weights.at(1, 2)).toBe(0)
      expect(pathHelper.weights.at(2, 1)).toBe(0)
      expect(pathHelper.weights.at(2, 2)).toBe(0)
      expect(pathHelper.weights.at(3, 1)).toBe(0)
      expect(pathHelper.weights.at(3, 2)).toBe(0)

      expect(pathHelper.weights.at(0, 0)).toBe(1)
      expect(pathHelper.weights.at(0, 3)).toBe(1)
      expect(pathHelper.weights.at(3, 0)).toBe(1)
      expect(pathHelper.weights.at(3, 3)).toBe(1)
    })

    it('should update pathLengths grid to account for a new obstacle', () => {
        const dimensions = getDimensions(5, 5)
        const pathHelper = new Pathing(dimensions, 1)

        pathHelper.addObstacle({ x: 1, y: 1}, 3, 2)

        expect(pathHelper.pathLengths.at(1, 1)).toBe(-1)
        expect(pathHelper.pathLengths.at(1, 2)).toBe(-1)
        expect(pathHelper.pathLengths.at(2, 1)).toBe(-1)
        expect(pathHelper.pathLengths.at(2, 2)).toBe(-1)
        expect(pathHelper.pathLengths.at(3, 1)).toBe(-1)
        expect(pathHelper.pathLengths.at(3, 2)).toBe(-1)

        expect(pathHelper.pathLengths.at(4, 4)).toBe(0)
        expect(pathHelper.pathLengths.at(4, 3)).toBe(1)
        expect(pathHelper.pathLengths.at(4, 2)).toBe(2)
        expect(pathHelper.pathLengths.at(4, 1)).toBe(3)
        expect(pathHelper.pathLengths.at(4, 0)).toBe(4)
        expect(pathHelper.pathLengths.at(3, 0)).toBe(5)
        expect(pathHelper.pathLengths.at(2, 0)).toBe(6)
        expect(pathHelper.pathLengths.at(1, 0)).toBe(7)
        expect(pathHelper.pathLengths.at(0, 0)).toBe(8)
    })

    it('should update pathLengths as a maze to account for multiple obstacles', () => {
      const dimensions = getDimensions(2, 5)
      const pathHelper = new Pathing(dimensions, 1)

      pathHelper.addObstacle({ x: 0, y: 1}, 1, 1)
      pathHelper.addObstacle({ x: 1, y: 3}, 1, 1)

      assertPath(pathHelper, [
        [0, 0],
        [1, 0],
        [1, 1],
        [1, 2],
        [0, 2],
        [0, 3],
        [0, 4],
        [1, 4],
      ])
    })

    it('should return false if a single obstacle blocks the goal', () => {
      const dimensions = getDimensions(2, 2)
      const pathHelper = new Pathing(dimensions, 1)

      const success = pathHelper.addObstacle({x: 1, y: 1}, 1, 1)
      expect(success).toBe(false)
    })

    it('should return false if a set of obstacles wall off a tile from the goal', () => {
      const dimensions = getDimensions(3, 3)
      const pathHelper = new Pathing(dimensions, 1)

      pathHelper.addObstacle({x: 0, y: 1}, 1, 1)
      pathHelper.addObstacle({x: 1, y: 1}, 1, 1)
      const success = pathHelper.addObstacle({x: 1, y: 0}, 1, 1)
      expect(success).toBe(false)
    })

    it('should not update map weights if an obstacle blocks the goal', () => {
      const dimensions = getDimensions(2, 2)
      const pathHelper = new Pathing(dimensions, 1)

      expect(pathHelper.weights.at(1, 1)).toBe(1)
      pathHelper.addObstacle({x: 1, y: 1}, 1, 1)
      expect(pathHelper.weights.at(1, 1)).toBe(1)
    })

    it('should not update map pathLengths if an obstacle blocks the goal', () => {
      const dimensions = getDimensions(2, 2)
      const pathHelper = new Pathing(dimensions, 1)
      pathHelper.compute()

      expect(pathHelper.pathLengths.at(0, 0)).toBe(2)

      pathHelper.addObstacle({x: 1, y: 1}, 1, 1)
      expect(pathHelper.pathLengths.at(0, 0)).toBe(2)
    })
  })

  describe('isAreaFree', function() {

    it('should return true if an area does not overlap an existing obstacle', () => {
      const dimensions = getDimensions(10, 10)
      const pathHelper = new Pathing(dimensions, 1)

      pathHelper.addObstacle({ x: 0, y: 0 }, 3, 2)
      const areaFree = pathHelper.isAreaFree({ x: 3, y: 0 }, 2, 2)
      expect(areaFree).toBe(true)
    })

    it('should return false if an area overlaps an existing obstacle', () => {
      const dimensions = getDimensions(10, 10)
      const pathHelper = new Pathing(dimensions, 1)

      pathHelper.addObstacle({ x: 1, y: 1}, 3, 2)
      const areaFree = pathHelper.isAreaFree({ x: 2, y: 2 }, 2, 2)
      expect(areaFree).toBe(false)
    })

    it('should return true if an area does not overlap an existing obstacle on a map with larger tiles', () => {
      const dimensions = getDimensions(10, 10)
      const pathHelper = new Pathing(dimensions, 2)

      pathHelper.addObstacle({ x: 0, y: 0 }, 4, 4)
      const areaFree = pathHelper.isAreaFree({ x: 4, y: 4 }, 4, 4)
      expect(areaFree).toBe(true)
    })

    it('should return false if an area overlaps an existing obstacle on a map with larger tiles', () => {
      const dimensions = getDimensions(10, 10)
      const pathHelper = new Pathing(dimensions, 2)

      pathHelper.addObstacle({ x: 0, y: 0}, 4, 4)
      const areaFree = pathHelper.isAreaFree({ x: 3, y: 3 }, 4, 4)
      expect(areaFree).toBe(false)
    })

  })

  describe('calculateGridLocation', function() {
    it('should convert 0,0 to grid location 0,0', () => {
      const dimensions = getDimensions(10, 10)
      const pathHelper = new Pathing(dimensions, 2)

      const result = pathHelper.calculateGridLocation({ x: 0, y: 0 })
      expect(result).toMatchObject({ x: 0, y: 0 })
    })

    it('should convert location on the map to a matching grid location', () => {
      const dimensions = getDimensions(10, 10)
      const pathHelper = new Pathing(dimensions, 2)

      const result = pathHelper.calculateGridLocation({ x: 4, y: 4 })
      expect(result).toMatchObject({ x: 2, y: 2 })
    })

    it('should convert location at far edge of map to a lesser grid location', () => {
      const dimensions = getDimensions(10, 10)
      const pathHelper = new Pathing(dimensions, 2)

      const result = pathHelper.calculateGridLocation({ x: 10, y: 10 })
      expect(result).toMatchObject({ x: 4, y: 4 })
    })

    it('should convert location inside a map tile to the corresponding grid location', () => {
      const dimensions = getDimensions(10, 10)
      const pathHelper = new Pathing(dimensions, 2)

      const result = pathHelper.calculateGridLocation({ x: 2.357, y: 5.887 })
      expect(result).toMatchObject({ x: 1, y: 2 })
    })

    it('should convert off map coordinates to the closest grid location', () => {
      const dimensions = getDimensions(10, 10)
      const pathHelper = new Pathing(dimensions, 2)

      let result = pathHelper.calculateGridLocation({ x: 15, y: 6 })
      expect(result).toMatchObject({ x: 4, y: 3 })

      result = pathHelper.calculateGridLocation({ x: 3, y: 14 })
      expect(result).toMatchObject({ x: 1, y: 4 })
    })
  })

  // @TODO should not provide a default direction (west?) if at end
})

function getDimensions(width, height) {
  return {
    width,
    height,
  }
}

function getHelpers(width, height) {
  return {
    getEntranceZone: () => {
      return {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
      }
    },
  }
}

/*
 * Given a path of coordinate arrays, traverses it and asserts that
 * the values increase incrementally.
 */
function assertPath(pathHelper, path) {
  path.reverse().forEach((coordinate, index) => {
    let [x, y] = coordinate
    expect(pathHelper.pathLengths.at(x, y)).toBe(index)
  })
}
