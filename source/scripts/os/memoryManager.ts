/*
 * MemoryManager.ts
 *
 * A memory manager object. Handles allocating and deallocating memory.
 */

module TSOS {

  export class MemoryManager {
    private static SEGMENT_SIZE: number = 256;

    private nextPid: number;
    private memorySegments: boolean[];

    constructor() {
      this.memorySegments = [];
      this.memorySegments[3] = true;
    }

    public allocate(): MemoryBounds {
      var toReturn: MemoryBounds = undefined;

      for(var i = 0; i < this.memorySegments.length; i++) {
        if(!this.memorySegments[i] || this.memorySegments[i] === undefined) {
          var lowerBound = i * MemoryManager.SEGMENT_SIZE;
          var upperBound = lowerBound + MemoryManager.SEGMENT_SIZE - 1;
          
          toReturn = new MemoryBounds(new Short(lowerBound), new Short(upperBound)); 
          this.memorySegments[i] = true;

          break;
        }
      }
      return toReturn;
    }

    public deallocate(segment: number): void {
      if(segment < 0 || 
         segment > this.memorySegments.length || 
         !this.memorySegments[segment] ||
         segment == 3)//Segment 3 is always used for system call functions 
      {
        //SEGFAULT
      }
      else 
      {
        this.memorySegments[segment] = false;
      }
    }
  }

  export class MemoryBounds {
    private lowerBound: Short;
    private upperBound: Short;

    constructor(lowerBound: Short, upperBound: Short) {
      this.lowerBound = lowerBound;
      this.upperBound = upperBound;
    }
    
    public lower(): Short {
      return this.lowerBound;
    }

    public upper(): Short {
      return this.upperBound;
    }
  }
}
