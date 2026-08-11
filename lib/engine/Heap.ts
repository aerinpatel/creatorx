export type Comparator<T> = (a: T, b: T) => number;

export class Heap<T> {
  private data: T[] = [];
  private comparator: Comparator<T>;

  constructor(comparator: Comparator<T>) {
    this.comparator = comparator;
  }

  public push(val: T) {
    this.data.push(val);
    this.bubbleUp(this.data.length - 1);
  }

  public pop(): T | undefined {
    if (this.data.length === 0) return undefined;
    if (this.data.length === 1) return this.data.pop();

    const top = this.data[0];
    this.data[0] = this.data.pop() as T;
    this.bubbleDown(0);
    return top;
  }

  public peek(): T | undefined {
    return this.data.length > 0 ? this.data[0] : undefined;
  }

  public size(): number {
    return this.data.length;
  }

  private bubbleUp(index: number) {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.comparator(this.data[index], this.data[parentIndex]) < 0) {
        this.swap(index, parentIndex);
        index = parentIndex;
      } else {
        break;
      }
    }
  }

  private bubbleDown(index: number) {
    const length = this.data.length;
    while (true) {
      const leftChildIndex = 2 * index + 1;
      const rightChildIndex = 2 * index + 2;
      let smallestOrLargest = index;

      if (
        leftChildIndex < length &&
        this.comparator(this.data[leftChildIndex], this.data[smallestOrLargest]) < 0
      ) {
        smallestOrLargest = leftChildIndex;
      }

      if (
        rightChildIndex < length &&
        this.comparator(this.data[rightChildIndex], this.data[smallestOrLargest]) < 0
      ) {
        smallestOrLargest = rightChildIndex;
      }

      if (smallestOrLargest !== index) {
        this.swap(index, smallestOrLargest);
        index = smallestOrLargest;
      } else {
        break;
      }
    }
  }

  private swap(i: number, j: number) {
    const temp = this.data[i];
    this.data[i] = this.data[j];
    this.data[j] = temp;
  }
}
