///<reference path="../globals.ts" />

/* ------------
  Terminal.ts
  
  Requires globals.ts
  
  A terminal emulator.
------------ */

module TSOS {

  export class Terminal {

    private canvas: HTMLCanvasElement;
    private context;
    private font = '12pt Courier'

    private lineSpacing: number = 4;
    private rows: number;
    private columns: number;
    private charWidth: number;
    private lineHeight: number;

    private cursor = {x: 0, y: 0}
    private inputBuffer;

    private echo: boolean = true;
    private lastCharEscape: boolean = false;
    private ansi: boolean = false;
    private ansiNumber = "";

    constructor(canvas: HTMLCanvasElement, inputBuffer) {
      this.canvas = canvas;
      this.inputBuffer = inputBuffer;

      this.context = canvas.getContext('2d'); 
      this.context.font = this.font;

      this.charWidth = this.context.measureText(' ').width;
      this.lineHeight = 12 * 1.5;

      //This is a bit of a hack
      //I chose -2 because it works
      this.columns = Math.round(this.canvas.height / this.charWidth) - 2
      this.rows = Math.round(this.canvas.width / this.lineHeight) - 2;
    }

    public getCursorPosition() {
      return {x: this.cursor.x, y: this.cursor.y};
    }

    public handleInputChar(): void {
      if(this.inputBuffer.length > 0) {
        var character: String = this.inputBuffer[this.inputBuffer.length - 1]; 
        this.handleChar(character, true);
      }
    }

    public handleChar(character: String, isInput: boolean): void {
      var printable: boolean = true;
     
      //Checking to see if this is going to be an ANSI control code
      //If it is, then handle it
      if(character === String.fromCharCode(27)) {
        printable = false;
        this.lastCharEscape = true;
      }
      else if(character === '[') {
        if(this.lastCharEscape) {
          this.ansi = true;
          printable = false;
        }
        this.lastCharEscape = false;
      }
      else if(character === String.fromCharCode(0)) {
        printable = false; 
      }
      else if(this.ansi) {
        if(character >= '0' && character <= '9') {
          //+ "" is to make the type system happy
          this.ansiNumber += character + "";
          printable = false;
        }
        else {
          var amount: any;
          if(this.ansiNumber === "") {
            amount = 1; 
          }
          else {
            amount= parseInt(this.ansiNumber, 10);
          }
          switch(character) {
            case 'A':
              this.moveCursorUp(amount);
              break;
            case 'B':
              this.moveCursorDown(amount);
              break;
            case 'C':
              this.moveCursorRight(amount);
              break;
            case 'D':
              this.moveCursorLeft(amount);
              break;
            case 'E':
              this.makeNewLine();
              break;
            case 'F':
              this.cursor.x = 0;
              this.moveCursorUp(1);
              break;
          }
          this.ansiNumber = "";
          printable = false;
          this.ansi = false;
        }
      }

      //Backspace
      if(character === String.fromCharCode(8)) {
        //Pop the backspace
        this.inputBuffer.pop();
        printable = false;
         
        if(this.inputBuffer.length > 0) { 
          //Do not print the backspace
          this.moveCursorLeft(1);
          this.clear();

          //Pop the erased character
          this.inputBuffer.pop();
        }
      }
      //Enter
      else if(character === String.fromCharCode(13)) {
        printable = false;
        
        var input: String = "";
        
        while(this.inputBuffer[0] != String.fromCharCode(13)) {
          input += this.inputBuffer.shift();
        }
        
        //Remove the newline
        input += this.inputBuffer.shift();
  
        this.makeNewLine();

        _KernelInterruptQueue.enqueue(new Interrupt(TERMINAL_IRQ, [input]));
      }

      //If it is a printable character, print it
      if(((this.echo && isInput) || !isInput)  && printable) {
        this.printChar(character); 
      }
    }

    public putChar(character: String): void {
      this.handleChar(character, false);
    }

    private moveCursorUp(amount: number): void {
      if(this.cursor.y - amount < 0) {
        this.cursor.y = 0;
      }
      else {
        this.cursor.y -= amount;   
      }
    }
    
    private moveCursorDown(amount: number): void {
      if(this.cursor.y + amount > this.rows) {
        this.cursor.y = this.rows;   
      }
      else {
        this.cursor.y += amount;   
      }
    }

    private moveCursorLeft(amount: number): void {
      if(this.cursor.x - amount < 0) {
        this.cursor.x = 0;
      }
      else {
        this.cursor.x -= amount;
      }
    }
    
    private moveCursorRight(amount: number): void {
      if(this.cursor.x + amount > this.columns) {
        this.cursor.x = this.columns;
      }
      else {
        this.cursor.x += amount;
      }
    }

    private makeNewLine() {
      this.cursor.x = 0;
      if(this.cursor.y === this.rows) { 
        var image = this.context.getImageData(0, this.lineHeight, this.context.canvas.width, this.rows * this.lineHeight);
        this.context.putImageData(image, 0, 0);
        this.clearLine();
      }
      else {
        this.moveCursorDown(1);
      }
    }

    private printChar(character: String): void {
      if(this.cursor.x == this.columns) {
        this.cursor.x = 0;
        this.makeNewLine(); 
      }
      //Get coordinates on the screen
      var coords = this.cursorToCoords();
      
      //Clear the spot incase a letter is already here
      this.clear();

      //Write the letter to the screen
      this.context.fillText(character, coords.x, coords.y);
      
      //Advance the cursor
      this.cursor.x++;
    }

    private clear(): void {
      //Get topleft corner of the cursor location
      var topLeft = this.cursorTopLeft();

      //Clear the place of any previous character
      //Add the line spacing to make sure the lowest characters are removed
      this.context.clearRect(topLeft.x, topLeft.y, this.charWidth + 1, this.lineHeight + this.lineSpacing);
    }

    public clearLine(): void {
      //Get topleft corner of the cursor location
      var topLeft = this.cursorTopLeft();
      this.context.clearRect(0, topLeft.y, this.canvas.width, this.lineHeight + this.lineSpacing);
    }

    private cursorToCoords() {
      var newX = (this.cursor.x * this.charWidth) + 1;
      var newY = ((this.cursor.y + 1) * this.lineHeight) - this.lineSpacing;

      return {x: newX, y: newY};
    }
    
    private cursorTopLeft() {
      //Add one to move font off the edge one pixel
      var newX = (this.cursor.x * this.charWidth) + 1;
      var newY = this.cursor.y * this.lineHeight;

      return {x: newX, y: newY};
    }
  }
}
