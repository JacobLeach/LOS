///<reference path="../globals.ts" />

/* ------------
  CPU.ts

  Requires global.ts.

  Routines for the host CPU simulation, NOT for the OS itself.
  In this manner, it's A LITTLE BIT like a hypervisor,
  in that the Document environment inside a browser is the "bare metal" (so to speak) for which we write code
  that hosts our client OS. But that analogy only goes so far, and the lines are blurred, because we are using
  TypeScript/JavaScript in both the host and client environments.

  This code references page numbers in the text book:
  Operating System Concepts 8th edition by Silberschatz, Galvin, and Gagne.  ISBN 978-0-470-12872-5
  ------------ */

module TSOS {

  export class Cpu {

    private programCounter: number;
    private accumulator: number;
    private xRegister: number;
    private yRegister: number;
    private instructionRegister: number;

    private zFlag: boolean;
    public isExecuting: boolean;

    private memory: Memory;

    constructor() {
      this.init();
    }

    public init(): void {
      this.programCounter = 0;
      this.accumulator = 0;
      this.xRegister = 0;
      this.yRegister = 0;
      this.zFlag = false;
      this.isExecuting = false;

      this.memory = new Memory();
    }

    public cycle(): void {
      _Kernel.krnTrace('CPU cycle');      
      this.loadInstruction(); 
      this.executeInstruction();

      this.programCounter++;
    }

    private loadInstruction(): void {
      this.instructionRegister = this.memory.getByte(this.programCounter);
    }

    private executeInstruction(): void {
      switch(this.instructionRegister) {
        case 0:
          break;
        case 109:
          break;
        case 141:
          break;
        case 160:
          break;
        case 162:
          break;
        case 169:
          break;
        case 172:
          break;
        case 173:
          break;
        case 174:
          break;
        case 208:
          break;
        case 234:
          break;
        case 236:
          break;
        case 238:
          break;
        case 255:
          break;
      }
    }
  
    private loadAccumulatorWithConstant() {
      //The constant is one byte ahead of the instruction so incremenet the PC
      this.programCounter++;

      //Read the constant from memory and put it in the accumulator
      this.accumulator = this.memory.getByte(this.programCounter);
    }
    
    private loadAccumulatorFromMemory() {
      //The low-order memory address byte is one byte ahead of the instruction so incremenet the PC
      this.programCounter++;
    
      //Read the low-order memory address byte from memory
      var lowOrderAddress: number = this.memory.getByte(this.programCounter);
      
      //The high-order memory address byte is two bytes ahead of the instruction so incremenet the PC again
      this.programCounter++;
      
      //Read the high-order memory address byte from memory
      var highOrderAddress: number = this.memory.getByte(this.programCounter);

      //Convert both to strings that represent their binary values and concat them in the correct order
      var addressAsString = highOrderAddress.toString(2) + lowOrderAddress.toString(2);

      //Parse the binary string into an integer
      var address = parseInt(addressAsString, 2);

      //Read the constant from memory at the address loaded and put it in the accumulator
      this.accumulator = this.memory.getByte(address);
    }

    private storeAccumulatorInMemory() {
      
    }
  }
}
