/**
 * ObjectPool recycles objects instead of creating new ones all the time.
 * Creating thousands of short-lived objects per second (particles!) makes the
 * browser stop now and then to clean up memory, which shows up as small
 * stutters. Reusing the same objects avoids that.
 */
class ObjectPool {
  /** create(): makes a brand-new object when the pool is empty. */
  constructor(create) {
    this.create = create;
    this.free = [];
  }

  get() {
    return this.free.pop() || this.create();
  }

  release(object) {
    this.free.push(object);
  }
}
