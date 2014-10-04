/* ------------
  PCB.ts
  
  A Proccess Control Block  
------------ */

module TSOS {

  export class PCB {
    private programCounter: Short;
    private accumulator: Byte;
    private xRegister: Byte;
    private yRegister: Byte;
    private zFlag: boolean;
    private kernelMode: boolean;
    
    private pid: number;
    private lowAddress: Short;
    private highAddress: Short;

    constructor(memoryBounds: MemoryBounds) {
      this.programCounter = new Short(0);
      this.accumulator = new Byte(0);
      this.xRegister = new Byte(0);
      this.yRegister = new Byte(0);
      this.zFlag = false;
      this.kernelMode = false; 

      this.lowAddress = memoryBounds.lower();
      this.highAddress = memoryBounds.upper();
    }

    public setState(pc: Short, acc: Byte, x: Byte, y: Byte, z: boolean, mode: boolean, low: Short, high: Short)
    {
      this.programCounter = pc;
      this.accumulator = acc;
      this.xRegister = x;
      this.yRegister = y;
      this.zFlag = z;
      this.kernelMode = mode;
      this.lowAddress = low;
      this.highAddress = high;
    }
  }
}
