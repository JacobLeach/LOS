/* ------------
  Stdio.ts
  
  Standard IO for the Terminal.
  ------------ */

module TSOS {
  
  export class Stdio {
    
    private static buffer: string = "";

    public static getChar(): number {
      var character = Stdio.buffer[0];
      Stdio.buffer = Stdio.buffer.substring(1, Stdio.buffer.length);
      return character.charCodeAt(0);
    }
    
    //Wrapper to write text to output
    public static putString(text: String, terminal: Terminal) {
      for(var i = 0; i < text.length; i++) {
        Stdio.buffer += (text.charAt(i));
        console.log("THIS SHIT: " + Stdio.buffer);
        _KernelInterruptQueue.enqueue(new Interrupt(Kernel.SYSTEM_CALL_IQR, 4));
      }
    }
  }
}
