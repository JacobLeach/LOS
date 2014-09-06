///<reference path="../globals.ts" />

/* ------------
Console.ts

Requires globals.ts

The OS Console - stdIn and stdOut by default.
Note: This is not the Shell.  The Shell is the "command line interface" (CLI) or interpreter for this console.
------------ */

module TSOS {

  export class Console {
    //Constant
    static START_OF_LINE : number = 0;
    private ansi : boolean = false;

    constructor(public currentFont = _DefaultFontFamily,
                public currentFontSize = _DefaultFontSize,
                public currentXPosition = Console.START_OF_LINE,
                public currentYPosition = _DefaultFontSize,
                public buffer = "") {}

    public init(): void {
      this.clearScreen();
      this.resetXY();
    }

    private clearScreen(): void {
      _DrawingContext.clearRect(0, 0, _Canvas.width, _Canvas.height);
    }

    private resetXY(): void {
      this.currentXPosition = 0;
      this.currentYPosition = this.currentFontSize;
    }

    public handleInput(): void {
      while (_KernelInputQueue.getSize() > 0) {
        var chr = _KernelInputQueue.dequeue();

        //Set flag for whether the last character is escape
        var lastEscape = (this.buffer.substr(-1) === String.fromCharCode(27)); 
        
        //Handle the new character
        
        //If the ANSI CSI squence has been set, handle the control code
        //This is simplified... aka no numbers
        if(this.ansi) {
          //Cursor Up
          if(chr === 'A') {
            this.currentYPosition += _DefaultFontSize + _FontHeightMargin;
          }

          this.ansi = false;
        }
        //Enter
        else if (chr === String.fromCharCode(13)) {
          _OsShell.handleInput(this.buffer);
          this.buffer = "";
        }
        //Backspace
        else if(chr === String.fromCharCode(8)) {
          var charWidth = _DrawingContext.measureText(this.currentFont, 
                                                      this.currentFontSize, 
                                                      this.buffer.substr(-1));

          var ascent = _DrawingContext.fontAscent(this.currentFont, 
                                                  this.currentFontSize);

          var descent = _DrawingContext.fontDescent(this.currentFont, 
                                                    this.currentFontSize);

          //Add one because it doesn't erase it all without it
          var charHeight = 1 + ascent + descent;
          
          //If escape is the last character, we have nothing to delete
          if(!lastEscape) {
            _DrawingContext.clearRect(
                                  this.currentXPosition - charWidth, 
                                  this.currentYPosition - ascent, 
                                  charWidth, 
                                  charHeight + 1
                                 );  
            
            //Move the cursor back one character
            this.currentXPosition -= charWidth;
          }

          //Remove the last character from the buffer
          this.buffer = this.buffer.substr(0, this.buffer.length - 1);
        } 
        //Escape
        //Used for ANSI escape codes but not printable
        //Just add it to the buffer
        //If there is already one, don't add another
        else if(chr === String.fromCharCode(27) && !lastEscape) {
          this.buffer += chr; 
        }
        //ANSI-CSI detected
        //Set ANSI control code flag
        else if((chr === '[') && lastEscape) {
          this.ansi = true; 
        }
        //Any other character
        else {
          this.buffer += chr;
          this.putText(chr);
        }
        // TODO: Write a case for Ctrl-C.
      }
    }

    public putText(text): void {
      //Check to see that we have something to write
      //If we do, write it to the current position on the screen
      if (text !== "") {
        _DrawingContext.drawText(this.currentFont, 
                                 this.currentFontSize, 
                                 this.currentXPosition, 
                                 this.currentYPosition, 
                                 text);

        var offset = _DrawingContext.measureText(this.currentFont, 
                                                 this.currentFontSize, 
                                                 text);

        this.currentXPosition = this.currentXPosition + offset;
      }
    }

    public advanceLine(): void {
      this.currentXPosition = Console.START_OF_LINE;
      this.currentYPosition += _DefaultFontSize + _FontHeightMargin;
      // TODO: Handle scrolling. (Project 1)
    }
  }
}
