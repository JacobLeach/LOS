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

      for(var i: number = 0; i < size; i++) {
        this.memory[i] = new Byte();
      }
    }

    public setByte(address: number, value: number): void {
      if(address > this.size) {
        this.memory[this.size - 1].setValue(value);
      }
      else if(address < this.size) {
        this.memory[0].setValue(value); 
      }
      else {
        this.memory[address].setValue(value);
      }
    }

    public getByte(address): number {
      var toReturn: number;
      
      if(address > this.size) {
        toReturn = this.memory[this.size - 1].getValue();
      }
      else if(address < this.size) {
        toReturn = this.memory[0].getValue();
      }
      else {
        toReturn = this.memory[address].getValue();
      }

      return toReturn;
    }
  }

  class Byte {
    private value: number;

    constructor() {
      this.value = 0;
    }

    public setValue(value: number): void {
      if(value > 256) {
        new Error("Tried setting byte value higher than 256");
      }
      else if(value < -128) {
        new Error("Tried setting byte value less than -128");
      }
      else {
        this.value = value;
      }
    }

    public getValue(): number {
      return this.value;
    }
  }
}
