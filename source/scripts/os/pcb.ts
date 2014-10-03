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
    
    private executing: boolean;

    private pid: number;
    private lowAddress: Short;
    private highAddress: Short;

    constructor() {
      this.programCounter = new Short(0);
      this.accumulator = new Byte(0);
      this.xRegister = new Byte(0);
      this.yRegister = new Byte(0);
      this.zFlag = false;
      this.kernelMode = false; 

      this.executing = false;
    }
  }
}
