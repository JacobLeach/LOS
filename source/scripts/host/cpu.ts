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

  export function numberToShort(value: number): Short {
    var lowByte: Byte = new Byte(value & 0xFF);
    var highByte: Byte = new Byte((value & 0xFF00) >> 8);

    return bytesToShort(lowByte, highByte);
  }

  export class Cpu {

    private programCounter: Short;
    private accumulator: Byte;
    private xRegister: Byte;
    private yRegister: Byte;
    private instructionRegister: Byte;

    private zFlag: boolean;
    public isExecuting: boolean;

    private memory: Memory;

    constructor() {
      this.init();
    }

    public init(): void {
      this.programCounter = new Short(0);
      this.accumulator = new Byte(0);
      this.xRegister = new Byte(0);
      this.yRegister = new Byte(0);
      this.zFlag = false;
      this.isExecuting = false;

      this.memory = new Memory();
    }

    public cycle(): void {
      _Kernel.krnTrace('CPU cycle');      
      this.loadInstruction(); 
      this.executeInstruction();

      this.programCounter.increment();
    }

    private loadInstruction(): void {
      this.instructionRegister = this.memory.getByte(this.programCounter);
    }

    private executeInstruction(): void {
      switch(this.instructionRegister.asNumber()) {
        //Break
        case 0x00:
          break;
        //Add with carry
        case 0x6D:
          this.addWithCarry();
          break;
        //Store accumulator in memory
        case 0x8D:
          this.storeAccumulatorInMemory();
          break;
        //Load Y register with a constant
        case 0xA0:
          this.loadYRegisterWithConstant();
          break;
        //Load X register with a constant
        case 0xA2:
          this.loadXRegisterWithConstant();
          break;
        //Load accumulator with a constant
        case 0xA9:
          this.loadAccumulatorWithConstant();
          break;
        //Load Y register from memory  
        case 0xAC:
          this.loadYRegisterFromMemory();
          break;
        //Load accumulator from memory
        case 0xAD:
          this.loadAccumulatorFromMemory();
          break;
        //Load X register from memory
        case 0xAE:
          this.loadXRegisterFromMemory();
          break;
        //Branch
        case 0xD0:
          break;
        //No Operation
        case 0xEA:
          this.noOperation();
          break;
        //Compare memory to X register
        case 0xEC:
          break;
        //Increment
        case 0xEE:
          this.increment();
          break;
        //System call
        case 0xFF:
          break;
      }
    }

    private loadInstructionConstant(): Byte {
      //The constant is one byte ahead of the instruction in memory so incremenet the PC
      this.programCounter.increment();
             
      return this.memory.getByte(this.programCounter);
    }

    private loadAddressFromMemory(): Short {
      //The lower address byte is one byte ahread of the instruction so increment the PC
      this.programCounter.increment();
      var lowByte: Byte = this.memory.getByte(this.programCounter);

      //The high address byte is two bytes ahread of the instruction so increment the PC
      this.programCounter.increment();
      var highByte: Byte = this.memory.getByte(this.programCounter);

      return bytesToShort(lowByte, highByte);
    }

    private loadValueFromAddress(): Byte {
      return this.memory.getByte(this.loadAddressFromMemory());
    }

    private addWithCarry() {
      var value: Byte = this.memory.getByte(this.loadAddressFromMemory());

      //We are not implementing carry.
      //Instead we are just wrapping the value around
      this.accumulator = new Byte((this.accumulator.asNumber() + value.asNumber()) % 256);
    }
    
    private storeAccumulatorInMemory() {
      this.memory.setByte(this.loadAddressFromMemory(), this.accumulator);
    }

    private loadYRegisterWithConstant() {
      this.yRegister = this.loadInstructionConstant(); 
    }

    private loadXRegisterWithConstant() {
      this.xRegister = this.loadInstructionConstant(); 
    }
    
    private loadAccumulatorWithConstant() {
      this.accumulator = this.loadInstructionConstant();
    }
    
    private loadYRegisterFromMemory() {
      this.yRegister = this.loadValueFromAddress();
    }

    private loadAccumulatorFromMemory() {
      this.accumulator = this.loadValueFromAddress();
    }
    
    private loadXRegisterFromMemory() {
      this.xRegister = this.loadValueFromAddress();
    }

    private branch() {
      //If zFlag is true, we want to branch
      if(this.zFlag) {
        //The constant is one byte ahead of the instruction in memory so incremenet the PC
        this.programCounter.increment();

        var branchAmount: number = this.memory.getByte(this.programCounter).asNumber();

        //We have to wrap when branch goes above our memory range
        this.programCounter = new Short((this.programCounter.asNumber() + branchAmount) % 256);
      }
    }

    private noOperation() {
      //Do nothing
    }

    private increment() {
      var address: Short = this.loadAddressFromMemory();
      var value: Byte = this.memory.getByte(address);

      value.increment();

      this.memory.setByte(address, value);
    }
  }
}
