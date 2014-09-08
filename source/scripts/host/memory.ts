/* ------------
  Memory.ts

  Memory simulation for our CPU.
  ------------ */

module TSOS {

  export class Memory {
    private static DEFAULT_SIZE = 256;

    private ram: Byte[];  
    private size: number;

    constructor(size: number = Memory.DEFAULT_SIZE) {
      this.size = size;

      for(var i: number = 0; i < size; i++) {
        this.ram[i] = new Byte();
      }
    }

    public setByte(address: number, value: number): void {
      if(address > this.size) {
        this.ram[this.size - 1].setValue(value);
      }
      else if(address < this.size) {
        this.ram[0].setValue(value); 
      }
      else {
        this.ram[address].setValue(value);
      }
    }

    public getByte(address): number {
      var toReturn: number;
      
      if(address > this.size) {
        toReturn = this.ram[this.size - 1].getValue();
      }
      else if(address < this.size) {
        toReturn = this.ram[0].getValue();
      }
      else {
        toReturn = this.ram[address].getValue();
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
      if(value > 128) {
        this.value = 128;
      }
      else if(value < -128) {
        this.value = -128;
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
