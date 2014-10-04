/* ------------
  CPU.ts
  
  A basic modifed 6502 CPU simulation.
------------ */

module TSOS {

  export class Cpu {
    public programCounter: Short;
    public accumulator: Byte;
    public xRegister: Byte;
    public yRegister: Byte;
    public instructionRegister: Byte;
    public zFlag: boolean;
    public kernelMode: boolean;
    
    public lowAddress: Short;
    public highAddress: Short;

    public returnRegister: Short;

    public executing: boolean;

    private deviceController: DeviceController;

    constructor() {
      this.programCounter = new Short(0);
      this.accumulator = new Byte(0);
      this.xRegister = new Byte(0);
      this.yRegister = new Byte(0);
      this.zFlag = false;
      this.kernelMode = false;

      this.executing = false;

      this.deviceController = new DeviceController();
    }

    public cycle(): void {
      _Kernel.krnTrace('CPU cycle');      
      this.loadInstruction(); 
      this.programCounter.increment();
      this.executeInstruction();
    }

    public isExecuting(): boolean {
      return this.executing;
    }

    public isKernelMode(): boolean {
      return this.kernelMode;
    }

    public setKernelMode(): void {
      this.kernelMode = true;
    }

    public isUserMode(): boolean {
      return !this.kernelMode;
    }

    public setUserMode(): void {
      this.kernelMode = false;
    }
    
    private loadInstruction(): void {
      this.instructionRegister = this.getByte(this.programCounter);
    }

    private executeInstruction(): void {
      switch(this.instructionRegister.asNumber()) {
        //Break
        case 0x00:
          this.programEnd(); 
          break;
        case 0x40:
          this.returnFromInterupt(); 
          break;
        case 0x4C:
          this.jump(); 
          break;
        case 0x6D:
          this.addWithCarry();
          break;
        case 0x8A:
          this.transferXRegisterToAccumulator();
          break;
        case 0x8C:
          this.storeYRegisterInMemory();
          break;
        case 0x8D:
          this.storeAccumulatorInMemory();
          break;
        case 0x8E:
          this.storeXRegisterInMemory();
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
        case 0xCC:
          this.compareY();
          break;
        case 0xD0:
          this.branch();
          break;
        case 0xEA:
          this.noOperation();
          break;
        case 0xEC:
          this.compareX();
          break;
        case 0xEE:
          this.increment();
          break;
        //System call
        case 0xFF:
          this.systemCall();
          break;
      }
    }

    private compareX(): void {
      this.zFlag = this.xRegister.asNumber() === this.loadValueFromAddress().asNumber();
    }
    
    private compareY(): void {
      this.zFlag = this.yRegister.asNumber() === this.loadValueFromAddress().asNumber();
    }
    
    private programEnd(): void {
      _KernelInterruptQueue.enqueue(new Interrupt(IRQ.BREAK, this.kernelMode));
    }
    
    private returnFromInterupt(): void {
      _Kernel.interrupt = false;
      _KernelInterruptQueue.front(new Interrupt(IRQ.RETURN, this.returnRegister));
    }

    private jump(): void {
      this.programCounter = this.loadAddressFromMemory();  
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
      var value: Byte = this.getByte(this.loadAddressFromMemory());

      //We are not implementing carry.
      //Instead we are just wrapping the value around
      this.accumulator = new Byte((this.accumulator.asNumber() + value.asNumber()) % 256);
    }
    
    private storeYRegisterInMemory() {
      this.deviceController.setByte(this.loadAddressFromMemory(), this.yRegister);
    }
    
    private storeAccumulatorInMemory() {
      this.deviceController.setByte(this.loadAddressFromMemory(), this.accumulator);
    }
    
    private storeXRegisterInMemory() {
      this.deviceController.setByte(this.loadAddressFromMemory(), this.xRegister);
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
      var branchAmount: number = this.loadInstructionConstant().asNumber();
      
      //If zFlag is true, we want to branch
      if(this.zFlag) {
        //In kernel mode you address all of memory
        if(this.kernelMode)
        {
          this.programCounter = new Short(this.programCounter.asNumber() + branchAmount);
        }
        else
        {
          //We have to wrap when branch goes above our memory range
          this.programCounter = new Short((this.programCounter.asNumber() + branchAmount) % 256);
        }
      }
    }

    private noOperation() {
      //Do nothing
    }

    private increment() {
      var address: Short = this.loadAddressFromMemory();
      var value: Byte = this.getByte(address);

      value.increment();

      this.deviceController.setByte(address, value);
    }
    
    private loadInstructionConstant(): Byte {
      var toReturn: Byte = this.getByte(this.programCounter);
      
      //The next instruction needs to be in the PC, so increment again
      this.programCounter.increment();

      return toReturn;
    }

    private loadAddressFromMemory(): Short {
      var lowByte: Byte = this.getByte(this.programCounter);

      //The high address byte is two bytes ahread of the instruction so increment the PC
      this.programCounter.increment();
      var highByte: Byte = this.getByte(this.programCounter);

      //The next instruction needs to be in the PC, so increment again
      this.programCounter.increment();

      return bytesToShort(lowByte, highByte);
    }

    private loadValueFromAddress(): Byte {
      return this.getByte(this.loadAddressFromMemory());
    }

    private systemCall(): void {
      this.setKernelMode();
      this.returnRegister = this.programCounter;
      _KernelInterruptQueue.enqueue(new Interrupt(IRQ.SYSTEM_CALL, this.xRegister.asNumber()));
    }
    
    private getByte(address: Short): Byte
    {
      return this.deviceController.getByte(this.adjustAddress(address));
    }

    private setByte(address: Short, data: Byte): void
    {
      this.deviceController.setByte(this.adjustAddress(address), data);
    }

    private adjustAddress(address: Short): Short
    {
      //We can access anything, use absolute addressing
      if(this.kernelMode)
      {
        return address;
      }
      else
      {
        var adjustedAddress: Short = new Short(address.asNumber() + this.lowAddress.asNumber());
        
        if(adjustedAddress.asNumber() > this.highAddress.asNumber())
        {
          //Segfault
          console.log("SEGFAULT: " + adjustedAddress);
          return undefined;
        }
        else
        {
          return adjustedAddress;  
        }
      }
    }
  }
}
