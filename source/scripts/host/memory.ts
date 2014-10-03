/* ------------
  Memory.ts

  Memory simulation for our CPU.
  ------------ */

module TSOS {

  export class Memory {
    private static DEFAULT_SIZE = 1024;

    private memory: Byte[];  
    private size: number;

    constructor(size: number = Memory.DEFAULT_SIZE) {
      this.size = size;
      this.memory = [];

      for(var i: number = 0; i < size; i++) {
        this.memory[i] = new Byte(0);
      }

      //System calls
      this.memory[0] = new Byte(0xA9);
      this.memory[1] = new Byte(65);
      this.memory[2] = new Byte(0x8D);
      this.memory[3] = new Byte(0x00);
      this.memory[4] = new Byte(0xFF);
      this.memory[5] = new Byte(0x00);
    }

    public getSize(): number {
      return this.size;
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
      if(this.lowByte.asNumber() == 255) {
        this.highByte.increment();
      }
      
      this.lowByte.increment();
    }

    public asNumber(): number {
      var lowAsString: string = this.lowByte.asNumber().toString(2); 
      
      while(lowAsString.length < 8) {
        lowAsString = "0" + lowAsString;
      }
      
      var highAsString: string = this.highByte.asNumber().toString(2);
      
      while(highAsString.length < 8) {
        highAsString = "0" + highAsString;
      }

      var shortAsString: string = highAsString + lowAsString;
      var shortAsNumber = parseInt(shortAsString, 2);
      
      return shortAsNumber;
    }
  }

  export function bytesToShort(lowByte: Byte, highByte: Byte): Short {
    return new Short(lowByte.asNumber() + (highByte.asNumber() << 8));
  }
}
