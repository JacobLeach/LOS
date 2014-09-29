/* ------------
  Memory.ts

  Memory simulation for our CPU.
  ------------ */

module TSOS {

  export class Memory {
    private static DEFAULT_SIZE = 768;

    private memory: Byte[];  
    private size: number;

    constructor(size: number = Memory.DEFAULT_SIZE) {
      this.size = size;
      this.memory = [];

      for(var i: number = 0; i < size; i++) {
        this.memory[i] = new Byte(0);
      }
    }

    public setByte(address: Short, value: Byte): void {
      if(address.asNumber() < this.size) {
        this.memory[address.asNumber()] = value;
      }
      else {
        //Should throw an interrupt
      }
    }

    public getByte(address: Short): Byte {
      var toReturn: Byte;

      if(address.asNumber() < this.size) {
        toReturn = this.memory[address.asNumber()];
      }
      else {
        //Should throw an interrupt
        toReturn = undefined;
      }

      return toReturn;
    }
  }

  export class Byte {
    private value: number;

    constructor(value: number) {
      this.setValue(value);  
    } 

    private setValue(value: number): void {
      this.value = value & 0xFF;
    }

    public increment(): void {
      this.setValue(++this.value);
    }

    public asNumber(): number {
      return this.value;
    }
  }

  export class Short {
    private lowByte: Byte;
    private highByte: Byte;

    constructor(value: number) {
      this.lowByte = new Byte(value & 0xFF);
      this.highByte = new Byte((value & 0xFF00) >> 8);
    }

    public increment() {
      
    }

    public asNumber(): number {
      var shortAsString: string = this.highByte.asNumber().toString(2) + this.lowByte.asNumber().toString(2);
      var shortAsNumber = parseInt(shortAsString, 2);
      
      return shortAsNumber;
    }
  }

  export function bytesToShort(lowByte: Byte, highByte: Byte): Short {
    return new Short(lowByte.asNumber() + (highByte.asNumber() << 8));
  }
}
