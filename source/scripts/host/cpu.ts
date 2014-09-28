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
        //Break
        case 0x00:
          break;
        //Add with carry
        case 0x6D:
          break;
        //Store accumulator in memory
        case 0x8D:
          break;
        //Load Y register with a constant
        case 0xA0:
          break;
        //Load X register with a constant
        case 0xA2:
          break;
        //Load accumulator with a constant
        case 0xA9:
          break;
        //Load Y register from memory  
        case 0xAC:
          break;
        //Load accumulator from memory
        case 0xAD:
          break;
        //Load X register from memory
        case 0xAE:
          break;
        //Branch
        case 0xD0:
          break;
        //No Operation
        case 0xEA:
          break;
        //Compare memory to X register
        case 0xEC:
          break;
        //Increment
        case 0xEE:
          break;
        //System call
        case 0xFF:
          break;
      }
    }
    
    private storeAccumulatorInMemory() {
      //The address is one byte ahread of the instruction so increment the PC
      this.programCounter++;

      var address: number = this.memory.getByte(this.programCounter);
      this.memory.setByte(address, this.accumulator);

      //There is an extra byte (for high order addresses we ignore)
      //So we have to increment the PC again
      this.programCounter++;
    }

    private loadYRegisterWithConstant() {
      //The constant is one byte ahead of the instruction in memory so incremenet the PC
      this.programCounter++;
             
      this.yRegister = this.memory.getByte(this.programCounter);
    }

    private loadXRegisterWithConstant() {
      //The constant is one byte ahead of the instruction in memory so incremenet the PC
      this.programCounter++;
             
      this.xRegister = this.memory.getByte(this.programCounter);
    }
    
    private loadAccumulatorWithConstant() {
      //The constant is one byte ahead of the instruction in memory so incremenet the PC
      this.programCounter++;

      this.accumulator = this.memory.getByte(this.programCounter);
    }
    
    private loadYRegisterFromMemory() {
      //The low-order memory address byte is one byte ahead of the instruction so incremenet the PC
      this.programCounter++;
    
      var address: number = this.memory.getByte(this.programCounter);
      this.yRegister = this.memory.getByte(address);
      
      //There is an extra byte (for high order addresses we ignore)
      //So we have to increment the PC again
      this.programCounter++;
    }

    private loadAccumulatorFromMemory() {
      //The low-order memory address byte is one byte ahead of the instruction so incremenet the PC
      this.programCounter++;
    
      var address: number = this.memory.getByte(this.programCounter);
      this.accumulator = this.memory.getByte(address);
      
      //There is an extra byte (for high order addresses we ignore)
      //So we have to increment the PC again
      this.programCounter++;
    }
    
    private loadXRegisterFromMemory() {
      //The low-order memory address byte is one byte ahead of the instruction so incremenet the PC
      this.programCounter++;
    
      var address: number = this.memory.getByte(this.programCounter);
      this.xRegister = this.memory.getByte(address);
      
      //There is an extra byte (for high order addresses we ignore)
      //So we have to increment the PC again
      this.programCounter++;
    }
  }
}
