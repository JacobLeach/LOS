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
    private pid: number;
    private lowAddress: number;
    private highAddress: number;
  }

}
