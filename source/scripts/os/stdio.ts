/* ------------
  Stdio.ts
  
  Standard IO for the Terminal.
  ------------ */

module TSOS {

  export class Stdio {
    public static putString(text: String, terminal: Terminal) {
      for(var i = 0; i < text.length; i++) {
        terminal.putChar(text.charAt(i));
      }
    }
  }
}
