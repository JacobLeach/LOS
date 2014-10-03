/* ------------
  PCB.ts
  
  A Proccess Control Block  
------------ */

module TSOS {

  export class PCB {
    private programCounter: number;
    private accumulator: number;
    private xRegister: number;
    private yRegister: number;
    private zFlag: boolean;
    private kernelMode: boolean;

    private pid: number;
    private lowAddress: number;
    private highAddress: number;

    constructor() {
      this.programCounter = 0;
      this.accumulator = 0;
      this.xRegister = 0;
      this.yRegister = 0;
      this.zFlag = false;
      this.kernelMode = false; 
    }
  }

}
