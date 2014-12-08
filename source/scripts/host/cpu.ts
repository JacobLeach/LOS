/* ------------
  CPU.ts
  
  A basic modifed 6502 CPU simulation.
------------ */

module TSOS 
{

  enum Interrupt
  {
    SegmentationFault,
    Break,
    Software,
    Clock,
    Return
  }

  export class Cpu 
  {

    public programCounter: Short;
    public accumulator: Byte;
    public xRegister: Byte;
    public yRegister: Byte;
    public instructionRegister: Byte;
    public zFlag: boolean;
    public cFlag: boolean;
    public kernelMode: boolean;
    public lowAddress: Short;
    public highAddress: Short;
    public returnRegister: Short;
    public executing: boolean;
    private interruptFlag: Interrupt;
    public ignoreInterrupts: boolean;
    public tickCount: number;

    private deviceController: DeviceController;
    private clock: Clock;

    constructor() 
    {
      this.programCounter = new Short(0);
      this.accumulator = new Byte(0);
      this.xRegister = new Byte(0);
      this.yRegister = new Byte(0);
      this.zFlag = false;
      this.cFlag = false;
      this.kernelMode = false;
      this.lowAddress = new Short(0);
      this.highAddress = new Short(0);
      this.executing = false;
      this.interruptFlag = undefined;
      this.ignoreInterrupts = false;
      this.tickCount = _Quant;

      this.deviceController = new DeviceController();
    }

    public start()
    {
      this.clock = new Clock(this, CPU_CLOCK_INTERVAL);
    }

    /*
     * WARNING! WARNING! WARNING! 
     * DO NOT USE "THIS." IN THE FUNCTION!
     * WARNING! WARNING! WARNING! 
     * 
     * Javascript is shit and this is a callback so we do not
     * have the correct this. Use _CPU instead. Fuckers.
     */
    public tick(): void
    {

      if(!singleStep || (singleStep && step))
      {
        if(_CPU.interruptFlag != undefined)
        {
          if(_CPU.interruptFlag === Interrupt.SegmentationFault)
          {
            _Kernel.segmentationFault();
          }
          else if(_CPU.interruptFlag === Interrupt.Break)
          {
            _Kernel.programBreak();
          }
          else if(_CPU.interruptFlag === Interrupt.Software)
          {
            _Kernel.softwareInterrupt();
          }
          else if(_CPU.interruptFlag === Interrupt.Clock)
          {
            _Kernel.timerInterrupt();
          }
          else if(_CPU.interruptFlag === Interrupt.Return)
          {
            _Kernel.returnInterrupt();
          }

          _CPU.interruptFlag = undefined;
        }
          
        //If the previous clock cycle set the interrupt flag
        //AND a timer interrupt should have happened as well,
        //then the timer interrupt is not set and is checked here
        if(_CPU.tickCount === 0 && _CPU.interruptFlag === undefined)
        {
          _Kernel.timerInterrupt();
          _CPU.tickCount = _Quant;
        }
        
        /*
         * This is a hack because the kernel is not all running on this hardware.
         * When the Kernel needs to run some code on the CPU or do some task that
         * does not use the CPY at all it adds it to this queue.
         */
        if(!_CPU.ignoreInterrupts && _KernelInterruptQueue.size() > 0)
        {
          _CPU.ignoreInterrupts = true;
          /*
           * Call the kernel function to handle the interrupts.
           * It will make sure that the CPU is correctly setup to 
           * either run the kernel code that is needed or to do the work
           * that the kernel needs to do (aka stuff written in typescript
           * does not need CPU time to run)
           */
          _Kernel.handleKernelInterrupt(_KernelInterruptQueue.dequeue());
        }

        _CPU.cycle();
        
        if(!_CPU.ignoreInterrupts)
        {
          _CPU.tickCount--;
          if(_CPU.tickCount === 0 && _CPU.interruptFlag === undefined)
          {
            _CPU.interruptFlag = Interrupt.Clock; 
            _CPU.tickCount = _Quant;
          }
        }
        
        //Please do not hurt me for this
        (<HTMLInputElement>document.getElementById("cpuBox")).value = _CPU.toString();      

        step = false;
      }
    }

    public stop(): void
    {
      this.clock.stop();
    }

    private interrupt(interrupt: Interrupt): void
    {
      this.interruptFlag = interrupt;
    }
    
    public toString(): string
    {
      var cpuAsString = "";

      cpuAsString += "PC: " + this.programCounter.asNumber().toString(16);
      cpuAsString += "\nIR: " + this.instructionRegister.asNumber().toString(16);
      cpuAsString += "\nAC: " + this.accumulator.asNumber().toString(16);
      cpuAsString += "\nX: " + this.xRegister.asNumber().toString(16);
      cpuAsString += "\nY: " + this.yRegister.asNumber().toString(16);
      cpuAsString += "\nZ: " + this.zFlag;
      cpuAsString += "\nkernelMode: " + this.kernelMode;
      cpuAsString += "\ninterrupt: " + this.interruptToString();
      cpuAsString += "\nlowAddress: " + this.lowAddress.asNumber().toString(16);
      cpuAsString += "\nhighAddress: " + this.highAddress.asNumber().toString(16);

      return cpuAsString;
    }
    
    private interruptToString(): string
    {
      switch(this.interruptFlag)
      {
        case Interrupt.SegmentationFault:
          return "Segmentation Fault";
        case Interrupt.Break:
          return "Break";
        case Interrupt.Software:
          return "Software";
        case Interrupt.Clock:
          return "Clock";
        case Interrupt.Return:
          return "Return";
        default:
          return "None";
      }
    }

    private cycle(): void 
    {
      this.loadInstruction(); 
      this.programCounter = this.programCounter.increment();
      this.executeInstruction();
    }

    public isExecuting(): boolean 
    {
      return this.executing;
    }

    public isKernelMode(): boolean 
    {
      return this.kernelMode;
    }

    public setKernelMode(): void 
    {
      this.kernelMode = true;
    }

    public isUserMode(): boolean 
    {
      return !this.kernelMode;
    }

    public setUserMode(): void 
    {
      this.kernelMode = false;
    }
    
    private loadInstruction(): void 
    {
      this.instructionRegister = this.getByte(this.programCounter);
    }

    private executeInstruction(): void 
    {
      switch(this.instructionRegister.asNumber()) 
      {
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
          this.branchNotEqual();
          break;
        case 0xEA:
          //No operation
          break;
        case 0xEC:
          this.compareX();
          break;
        case 0xEE:
          this.increment();
          break;
        case 0xF0:
          this.branchEqual();
          break;
        case 0xFF:
          this.systemCall();
          break;
        default:
          _Kernel.krnTrace("Invalid opcode: " + 
              this.instructionRegister.asNumber());
      }
    }

    private compareX(): void 
    {
      this.zFlag = (this.xRegister.asNumber() === this.loadValueFromAddress().asNumber());
    }
    
    private compareY(): void 
    {
      this.zFlag = (this.yRegister.asNumber() === this.loadValueFromAddress().asNumber());
    }
    
    private programEnd(): void 
    {
      this.executing = false;
      this.interrupt(Interrupt.Break);
    }
    
    private returnFromInterupt(): void 
    {
      this.ignoreInterrupts = false;
      this.interruptFlag = Interrupt.Return;
    }

    private jump(): void 
    {
      this.programCounter = this.loadAddressFromMemory();  
    }

    private transferXRegisterToAccumulator(): void 
    {
      this.accumulator = this.xRegister;
    }
    
    private transferYRegisterToAccumulator(): void 
    {
      this.accumulator = this.yRegister;
    }
    
    private transferAccumulatorToXRegister(): void 
    {
      this.xRegister = this.accumulator;
    }
    
    private transferAccumulatorToYRegister(): void 
    {
      this.yRegister = this.accumulator;
    }

    private addWithCarry(): void
    {
      var value: Byte = this.getByte(this.loadAddressFromMemory());
      var addition = this.accumulator.asNumber() + value.asNumber(); 

      if(addition > 255)
      {
        this.cFlag = true;
      }

      this.accumulator = new Byte(addition % 256);
    }
    
    private storeYRegisterInMemory(): void
    {
      this.setByte(this.loadAddressFromMemory(), this.yRegister);
    }
    
    private storeAccumulatorInMemory(): void
    {
      this.setByte(this.loadAddressFromMemory(), this.accumulator);
    }
    
    private storeXRegisterInMemory(): void
    {
      this.setByte(this.loadAddressFromMemory(), this.xRegister);
    }

    private loadYRegisterWithConstant(): void
    {
      this.yRegister = this.loadInstructionConstant(); 
    }

    private loadXRegisterWithConstant(): void
    {
      this.xRegister = this.loadInstructionConstant(); 
    }
    
    private loadAccumulatorWithConstant(): void
    {
      this.accumulator = this.loadInstructionConstant();
    }
    
    private loadYRegisterFromMemory(): void
    {
      this.yRegister = this.loadValueFromAddress();
    }

    private loadAccumulatorFromMemory(): void
    {
      this.accumulator = this.loadValueFromAddress();
    }
    
    private loadXRegisterFromMemory(): void
    {
      this.xRegister = this.loadValueFromAddress();
    }

    private branchNotEqual(): void
    {
      var branchAmount: number = this.loadInstructionConstant().asNumber();
      
      if(!this.zFlag) 
      {
        this.programCounter = new Short((this.programCounter.asNumber() + branchAmount) % 256);
      }
    }
    
    private branchEqual(): void
    {
      var branchAmount: number = this.loadInstructionConstant().asNumber();
      
      if(this.zFlag) 
      {
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

    private increment(): void
    {
      var address: Short = this.loadAddressFromMemory();
      var value: Byte = this.getByte(address);
      var newValue: Byte = value.increment();

      this.setByte(address, newValue);
    }
    
    private loadInstructionConstant(): Byte 
    {
      var toReturn: Byte = new Byte(this.getByte(this.programCounter).asNumber());
      
      //The next instruction needs to be in the PC, so increment again
      this.programCounter = this.programCounter.increment();

      return toReturn;
    }

    private loadAddressFromMemory(): Short 
    {
      var lowByte: Byte = new Byte(this.getByte(this.programCounter).asNumber());

      //The high address byte is two bytes ahread of the instruction so increment the PC
      this.programCounter = this.programCounter.increment();
      var highByte: Byte = new Byte(this.getByte(this.programCounter).asNumber());

      //The next instruction needs to be in the PC, so increment again
      this.programCounter = this.programCounter.increment();

      return bytesToShort(lowByte, highByte);
    }

    private loadValueFromAddress(): Byte 
    {
      return new Byte(this.getByte(this.loadAddressFromMemory()).asNumber());
    }

    private systemCall(): void 
    {
      this.interrupt(Interrupt.Software);
    }
    
    private getByte(address: Short): Byte
    {
      return new Byte(this.deviceController.getByte(this.adjustAddress(address)).asNumber());
    }

    private setByte(address: Short, data: Byte): void
    {
      this.deviceController.setByte(this.adjustAddress(address), new Byte(data.asNumber()));
    }

    private adjustAddress(address: Short): Short
    {
      //We can access anything, use absolute addressing
      if(this.kernelMode)
      {
        return new Short(address.asNumber());
      }
      else
      {
        var adjustedAddress: Short = new Short(address.asNumber() + this.lowAddress.asNumber());
        
        if(adjustedAddress.asNumber() > this.highAddress.asNumber())
        {
          this.interrupt(Interrupt.SegmentationFault);
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
