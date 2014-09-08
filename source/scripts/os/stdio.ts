/* ------------
  Stdio.ts
  
  Standard IO for the Terminal.
  ------------ */

module TSOS {

  export class Stdio {
    //Wrapper to write text to output
    public static putString(text: String, terminal: Terminal) {
      for(var i = 0; i < text.length; i++) {
        terminal.putChar(text.charAt(i));
      }
    }
  }
}
