/* ------------
  PCB.ts
  
  A Proccess Control Block  
------------ */

module TSOS {

  export class PCB {
    private static next_pid = 0;

    private programCounter: Short;
    private accumulator: Byte;
    private xRegister: Byte;
    private yRegister: Byte;
    private zFlag: boolean;
    private kernelMode: boolean; 
    
    private memoryBounds: MemoryBounds;
    private pid: number;
    private disk: boolean;

    constructor(memoryBounds: MemoryBounds) {
      this.programCounter = new Short(0);
      this.accumulator = new Byte(0);
      this.xRegister = new Byte(0);
      this.yRegister = new Byte(0);
      this.zFlag = false;
      this.kernelMode = false; 

      this.memoryBounds = memoryBounds;
      this.pid = PCB.next_pid++;
    }

    public toString(): string
    {
      var print = "";
      print += "Pid: " + this.getPid();
      print += "\nPC: " + this.getProgramCounter().asNumber().toString(16);
      print += "\nACC: " + this.getAccumulator().asNumber().toString(16);
      print += "\nX: " + this.getXRegister().asNumber().toString(16);
      print += "\nY: " + this.getYRegister().asNumber().toString(16);
      print += "\nZ: " + this.getZFlag();
      print += "\nKernel Mode: " + this.getKernelMode();
      print += "\nbase: " + this.getLowAddress().asNumber().toString(16);
      print += "\nlimit: " + this.getHighAddress().asNumber().toString(16);

      return print;
    }

    public onDisk(): void
    {
      this.disk = true;
    }

    public inMemory(): void
    {
      this.disk = false;
    }

    public getLocation(): boolean
    {
      return this.disk;
    }

    public updatePCB()
    {
      this.setProgramCounter(_CPU.programCounter);  
      this.setAccumulator(_CPU.accumulator);
      this.setXRegister(_CPU.xRegister);
      this.setYRegister(_CPU.yRegister);
      this.setZFlag(_CPU.zFlag);
      this.setKernelMode(_CPU.kernelMode);
    }
    
    public setCPU(): void
    {
      _CPU.programCounter = this.getProgramCounter();  
      _CPU.accumulator = this.getAccumulator();
      _CPU.xRegister = this.getXRegister();
      _CPU.yRegister = this.getYRegister();
      _CPU.zFlag = this.getZFlag();
      _CPU.kernelMode = this.getKernelMode();
      _CPU.lowAddress = this.getLowAddress();
      _CPU.highAddress = this.getHighAddress();
    }

    public getSegment(): number
    {
      return this.memoryBounds.getSegment();
    }
    
    public getBase(): Short
    {
      return this.memoryBounds.lower();
    }

    public getPid(): number
    {
      return this.pid;
    }

    public getProgramCounter(): Short
    {
      return this.programCounter;
    }

    public getAccumulator(): Byte
    { 
      return this.accumulator;
    }

    public getXRegister(): Byte
    { 
      return this.xRegister;
    }
    
    public getYRegister(): Byte
    { 
      return this.yRegister;
    }

    public getZFlag(): boolean
    {
      return this.zFlag;
    }

    public getKernelMode(): boolean
    {
      return this.kernelMode;
    }

    public getLowAddress(): Short
    {
      return this.memoryBounds.lower();
    } 
    
    public getHighAddress(): Short
    {
      return this.memoryBounds.upper();
    } 

    public setProgramCounter(data: Short): void
    {
      this.programCounter = data;
    }

    public setAccumulator(data: Byte): void
    {
      this.accumulator = data;
    }

    public setXRegister(data: Byte): void
    {
      this.xRegister = data;
    }
    
    public setYRegister(data: Byte): void
    {
      this.yRegister = data;
    }

    public setZFlag(data: boolean): void
    {
      this.zFlag = data;
    }

    public setKernelMode(data: boolean): void
    {
      this.kernelMode = data;
    }
  }
}
