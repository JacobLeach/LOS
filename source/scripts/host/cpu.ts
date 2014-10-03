/* ------------
  CPU.ts
  
  A basic modifed 6502 CPU simulation.
------------ */

module TSOS {

  export class Cpu {
    private programCounter: Short;
    private accumulator: Byte;
    private xRegister: Byte;
    private yRegister: Byte;
    private instructionRegister: Byte;

    private zFlag: boolean;
    private executing: boolean;

    private deviceController: DeviceController;

    constructor() {
      this.programCounter = new Short(0);
      this.accumulator = new Byte(0);
      this.xRegister = new Byte(0);
      this.yRegister = new Byte(0);
      this.zFlag = false;
      this.executing = true;

      this.deviceController = new DeviceController();
    }

    public cycle(): void {
      _Kernel.krnTrace('CPU cycle');      
      this.loadInstruction(); 
      this.executeInstruction();
      this.programCounter.increment();
    }

    public isExecuting(): boolean {
      return this.executing;
    }

    private loadInstruction(): void {
      this.instructionRegister = this.deviceController.getByte(this.programCounter);
    }

    private executeInstruction(): void {
      switch(this.instructionRegister.asNumber()) {
        //Break
        case 0x00:
          this.programEnd(); 
          break;
        case 0x6D:
          this.addWithCarry();
          break;
        case 0x8A:
          this.transferXRegisterToAccumulator();
          break;
        case 0x8D:
          this.storeAccumulatorInMemory();
          break;
        case 0x98:
          this.transferYRegisterToAccumulator();
          break;
        case 0xA0:
          this.loadYRegisterWithConstant();
          break;
        case 0xA2:
          this.loadXRegisterWithConstant();
          break;
        case 0xA8:
          this.transferAccumulatorToYRegister();
          break;
        case 0xA9:
          this.loadAccumulatorWithConstant();
          break;
        case 0xAA:
          this.transferAccumulatorToXRegister();
          break;
        case 0xAC:
          this.loadYRegisterFromMemory();
          break;
        case 0xAD:
          this.loadAccumulatorFromMemory();
          break;
        case 0xAE:
          this.loadXRegisterFromMemory();
          break;
        //Branch
        case 0xD0:
          break;
        case 0xEA:
          this.noOperation();
          break;
        //Compare memory to X register
        case 0xEC:
          break;
        case 0xEE:
          this.increment();
          break;
        //System call
        case 0xFF:
          break;
      }
    }
    
    private programEnd(): void {
      this.executing = false;
    }

    private transferXRegisterToAccumulator(): void {
      this.accumulator = this.xRegister;
    }
    
    private transferYRegisterToAccumulator(): void {
      this.accumulator = this.yRegister;
    }
    
    private transferAccumulatorToXRegister(): void {
      this.xRegister = this.accumulator;
    }
    
    private transferAccumulatorToYRegister(): void {
      this.yRegister = this.accumulator;
    }

    private addWithCarry() {
      var value: Byte = this.deviceController.getByte(this.loadAddressFromMemory());

      //We are not implementing carry.
      //Instead we are just wrapping the value around
      this.accumulator = new Byte((this.accumulator.asNumber() + value.asNumber()) % 256);
    }
    
    private storeAccumulatorInMemory() {
      this.deviceController.setByte(this.loadAddressFromMemory(), this.accumulator);
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

        var branchAmount: number = this.deviceController.getByte(this.programCounter).asNumber();

        //We have to wrap when branch goes above our memory range
        this.programCounter = new Short((this.programCounter.asNumber() + branchAmount) % 256);
      }
    }

    private noOperation() {
      //Do nothing
    }

    private increment() {
      var address: Short = this.loadAddressFromMemory();
      var value: Byte = this.deviceController.getByte(address);

      value.increment();

      this.deviceController.setByte(address, value);
    }
    
    private loadInstructionConstant(): Byte {
      //The constant is one byte ahead of the instruction in memory so incremenet the PC
      this.programCounter.increment();
             
      return this.deviceController.getByte(this.programCounter);
    }

    private loadAddressFromMemory(): Short {
      //The lower address byte is one byte ahread of the instruction so increment the PC
      this.programCounter.increment();
      var lowByte: Byte = this.deviceController.getByte(this.programCounter);

      //The high address byte is two bytes ahread of the instruction so increment the PC
      this.programCounter.increment();
      var highByte: Byte = this.deviceController.getByte(this.programCounter);

      return bytesToShort(lowByte, highByte);
    }

    private loadValueFromAddress(): Byte {
      return this.deviceController.getByte(this.loadAddressFromMemory());
    }
  }
}
