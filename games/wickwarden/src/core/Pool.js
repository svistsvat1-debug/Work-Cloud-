// Object pooling: reuse dead objects instead of creating garbage every frame.

export class Pool {
  constructor(factory) {
    this.factory = factory;
    this.free = [];
  }

  get() {
    return this.free.length > 0 ? this.free.pop() : this.factory();
  }

  release(object) {
    this.free.push(object);
  }
}

/**
 * Removes inactive entities from an array in place (no splice, no new array)
 * and hands them back to their pool.
 */
export function removeInactive(array, pool) {
  let write = 0;
  for (let read = 0; read < array.length; read++) {
    const entity = array[read];
    if (entity.active) array[write++] = entity;
    else if (pool) pool.release(entity);
  }
  array.length = write;
}

/** Deactivates everything and returns it to the pool (used on restart). */
export function releaseAll(array, pool) {
  for (const entity of array) {
    entity.active = false;
    if (pool) pool.release(entity);
  }
  array.length = 0;
}
