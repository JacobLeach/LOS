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
      this.memory[0] = new Byte(0xA2); //Load X with 3
      this.memory[1] = new Byte(3);
      this.memory[2] = new Byte(0xFF); //System call
      this.memory[3] = new Byte(0xA8); //Transfer acc to Y
      this.memory[4] = new Byte(0xA2); //Load X with 2
      this.memory[5] = new Byte(2);
      this.memory[6] = new Byte(0xFF); //System call
      this.memory[7] = new Byte(0x00);
      
      //Print single char
      this.memory[0x0300] = new Byte(0x8C);
      this.memory[0x0301] = new Byte(0x00);
      this.memory[0x0302] = new Byte(0xFF);
      this.memory[0x0303] = new Byte(0x40);

      //Load char from buffer
      this.memory[0x0304] = new Byte(0xAD); //Load accumulator from memory
      this.memory[0x0305] = new Byte(0xF0); //Device address for buffer
      this.memory[0x0306] = new Byte(0xFF);
      this.memory[0x0307] = new Byte(0x40);

      //STDIO putString
      //Load char from liblos buffer
      this.memory[0x0308] = new Byte(0xAD); 
      this.memory[0x0309] = new Byte(0xF0); 
      this.memory[0x030A] = new Byte(0xFF);
      this.memory[0x030B] = new Byte(0xA8);

      //Compare Y to null
      this.memory[0x030C] = new Byte(0xCC);
      this.memory[0x030D] = new Byte(0x18);
      this.memory[0x030E] = new Byte(0x03);
      this.memory[0x030F] = new Byte(0xD0);
      this.memory[0x0310] = new Byte(6);

      //Print char
      this.memory[0x0311] = new Byte(0x8C);
      this.memory[0x0312] = new Byte(0x00);
      this.memory[0x0313] = new Byte(0xFF);
      this.memory[0x0314] = new Byte(0x4C);
      this.memory[0x0315] = new Byte(0x08);
      this.memory[0x0316] = new Byte(0x03);
      this.memory[0x0317] = new Byte(0x40);
      this.memory[0x0318] = new Byte(0x00);
      
      //Load program
      this.memory[0x0319] = new Byte(0xA9);
      this.memory[0x031A] = new Byte(0xFF);
      this.memory[0x031B] = new Byte(0xFF);
      this.memory[0x031C] = new Byte(0x8E);
      this.memory[0x031D] = new Byte(0xF1);
      this.memory[0x031E] = new Byte(0xFF);
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
