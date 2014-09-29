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

    public setByte(bytes: Byte[], value: Byte): void {
      var address: number = twoBytesToNumber(bytes[0], bytes[1]);

      if(address < this.size) {
        this.memory[address] = value;
      }
      else {
        //Should throw an interrupt
      }
    }

    public getByte(bytes: Byte[]): Byte {
      var toReturn: Byte;
      var address: number = twoBytesToNumber(bytes[0], bytes[1]);

      if(address < this.size) {
        toReturn = this.memory[address];
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

    public setValue(value: number): void {
      this.value = value & 255;
    }

    public asNumber(): number {
      return this.value;
    }
  
  }
  
  export function twoBytesToNumber(lowByte: Byte, highByte: Byte): number {
    var addressAsString: string = highByte.asNumber().toString(2) + lowByte.asNumber().toString(2);
    var address = parseInt(addressAsString, 2);
    
    return address;
  }
}
