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
    private lowAddress: Short;
    private highAddress: Short;

    private segment: number;
    private pid: number;

    constructor(memoryBounds: MemoryBounds) {
      this.programCounter = new Short(0);
      this.accumulator = new Byte(0);
      this.xRegister = new Byte(0);
      this.yRegister = new Byte(0);
      this.zFlag = false;
      this.kernelMode = false; 

      this.lowAddress = memoryBounds.lower();
      this.highAddress = memoryBounds.upper();
      
      this.segment = memoryBounds.getSegment();
      this.pid = PCB.next_pid++;
    }

    public getPid(): number
    {
      return this.pid;
    }
  }
}
