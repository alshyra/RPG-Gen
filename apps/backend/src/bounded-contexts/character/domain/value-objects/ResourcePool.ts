/**
 * Value Object representing a resource pool (PA/PM/HP).
 * Immutable - all modifications return a new instance.
 */
export class ResourcePool {
  public readonly current: number;
  public readonly max: number;

  constructor(current: number, max: number) {
    if (max < 0) {
      throw new Error("Max value cannot be negative");
    }
    if (current < 0) {
      throw new Error("Current value cannot be negative");
    }
    if (current > max) {
      throw new Error("Current cannot exceed max");
    }
    this.current = current;
    this.max = max;
  }

  spend(amount: number): ResourcePool {
    if (amount < 0) {
      throw new Error("Amount to spend cannot be negative");
    }
    if (amount > this.current) {
      throw new Error("Insufficient resources");
    }
    return new ResourcePool(this.current - amount, this.max);
  }

  reduce(amount: number): ResourcePool {
    if (amount < 0) {
      throw new Error("Amount to reduce cannot be negative");
    }
    const newCurrent = Math.max(0, this.current - amount);
    return new ResourcePool(newCurrent, this.max);
  }

  restore(): ResourcePool {
    return new ResourcePool(this.max, this.max);
  }

  add(amount: number): ResourcePool {
    if (amount < 0) {
      throw new Error("Amount to add cannot be negative");
    }
    const newCurrent = Math.min(this.max, this.current + amount);
    return new ResourcePool(newCurrent, this.max);
  }

  withMax(newMax: number): ResourcePool {
    const newCurrent = Math.min(this.current, newMax);
    return new ResourcePool(newCurrent, newMax);
  }

  increaseMax(amount: number): ResourcePool {
    if (amount < 0) {
      throw new Error("Amount cannot be negative");
    }
    return new ResourcePool(this.current, this.max + amount);
  }

  isEmpty(): boolean {
    return this.current === 0;
  }

  isFull(): boolean {
    return this.current === this.max;
  }

  getPercentage(): number {
    if (this.max === 0) return 0;
    return (this.current / this.max) * 100;
  }

  static create(max: number): ResourcePool {
    return new ResourcePool(max, max);
  }

  static createEmpty(max: number): ResourcePool {
    return new ResourcePool(0, max);
  }
}
