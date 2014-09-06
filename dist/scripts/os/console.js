///<reference path="../globals.ts" />
/* ------------
Console.ts
Requires globals.ts
The OS Console - stdIn and stdOut by default.
Note: This is not the Shell.  The Shell is the "command line interface" (CLI) or interpreter for this console.
------------ */
var TSOS;
(function (TSOS) {
    var Console = (function () {
        function Console(currentFont, currentFontSize, currentXPosition, currentYPosition, buffer) {
            if (typeof currentFont === "undefined") { currentFont = _DefaultFontFamily; }
            if (typeof currentFontSize === "undefined") { currentFontSize = _DefaultFontSize; }
            if (typeof currentXPosition === "undefined") { currentXPosition = Console.START_OF_LINE; }
            if (typeof currentYPosition === "undefined") { currentYPosition = _DefaultFontSize; }
            if (typeof buffer === "undefined") { buffer = ""; }
            this.currentFont = currentFont;
            this.currentFontSize = currentFontSize;
            this.currentXPosition = currentXPosition;
            this.currentYPosition = currentYPosition;
            this.buffer = buffer;
            this.ansi = false;
        }
        Console.prototype.init = function () {
            this.clearScreen();
            this.resetXY();
        };

        Console.prototype.clearScreen = function () {
            _DrawingContext.clearRect(0, 0, _Canvas.width, _Canvas.height);
        };

        Console.prototype.resetXY = function () {
            this.currentXPosition = 0;
            this.currentYPosition = this.currentFontSize;
        };

        Console.prototype.clearLine = function () {
            var ascent = _DrawingContext.fontAscent(this.currentFont, this.currentFontSize);

            var descent = _DrawingContext.fontDescent(this.currentFont, this.currentFontSize);

            //Add one because it doesn't erase it all without it
            var charHeight = 1 + ascent + descent;

            _DrawingContext.clearRect(Console.START_OF_LINE, this.currentYPosition - ascent, _Canvas.width, charHeight + 1);
        };

        Console.prototype.moveCursorToStartOfLine = function () {
            this.currentXPosition = Console.START_OF_LINE;
        };

        Console.prototype.moveCursorUpOneLine = function () {
            this.currentYPosition -= _DefaultFontSize + _FontHeightMargin;
        };

        Console.prototype.moveCursorDownOneLine = function () {
            this.currentYPosition += _DefaultFontSize + _FontHeightMargin;
        };

        Console.prototype.handleInput = function () {
            while (_KernelInputQueue.getSize() > 0) {
                var chr = _KernelInputQueue.dequeue();

                //Set flag for whether the last character is escape
                var lastEscape = (this.buffer.substr(-1) === String.fromCharCode(27));

                //Handle the new character
                //If the ANSI CSI squence has been set, handle the control code
                //This is simplified... aka no numbers
                //Also since we are not monospace, I can only do a subset
                if (this.ansi) {
                    //Character is a shift or something
                    if (chr != String.fromCharCode(0)) {
                        //Cursor Start of next line
                        if (chr === 'E') {
                            this.moveCursorToStartOfLine();
                            this.moveCursorDownOneLine();
                        } else if (chr === 'F') {
                            this.moveCursorToStartOfLine();
                            this.moveCursorUpOneLine();
                        } else if (chr == 'A') {
                            _OsShell.handleUp();
                        } else if (chr == 'B') {
                            _OsShell.handleDown();
                        } else if (chr == 'C') {
                            _OsShell.handleRight();
                        } else if (chr == 'D') {
                            _OsShell.handleLeft();
                        }
                        this.ansi = false;
                    }
                } else if (chr === String.fromCharCode(13)) {
                    _OsShell.handleInput(this.buffer);
                    this.buffer = "";
                } else if (chr === String.fromCharCode(8)) {
                    var charWidth = _DrawingContext.measureText(this.currentFont, this.currentFontSize, this.buffer.substr(-1));

                    var ascent = _DrawingContext.fontAscent(this.currentFont, this.currentFontSize);

                    var descent = _DrawingContext.fontDescent(this.currentFont, this.currentFontSize);

                    //Add one because it doesn't erase it all without it
                    var charHeight = 1 + ascent + descent;

                    //If escape is the last character, we have nothing to delete
                    if (!lastEscape) {
                        _DrawingContext.clearRect(this.currentXPosition - charWidth, this.currentYPosition - ascent, charWidth, charHeight + 1);

                        //Move the cursor back one character
                        this.currentXPosition -= charWidth;
                    }

                    //Remove the last character from the buffer
                    this.buffer = this.buffer.substr(0, this.buffer.length - 1);
                } else if (chr === String.fromCharCode(27) && !lastEscape) {
                    this.buffer += chr;
                } else if ((chr === '[') && lastEscape) {
                    this.ansi = true;
                } else if (chr === '\t') {
                    _OsShell.tabCompletion(this.buffer);
                } else {
                    this.buffer += chr;
                    this.putText(chr);
                }
                // TODO: Write a case for Ctrl-C.
            }
        };

        Console.prototype.putText = function (text) {
            //Check to see that we have something to write
            //If we do, write it to the current position on the screen
            if (text !== "") {
                _DrawingContext.drawText(this.currentFont, this.currentFontSize, this.currentXPosition, this.currentYPosition, text);

                var offset = _DrawingContext.measureText(this.currentFont, this.currentFontSize, text);

                this.currentXPosition = this.currentXPosition + offset;
            }
        };

        Console.prototype.advanceLine = function () {
            this.currentXPosition = Console.START_OF_LINE;
            this.currentYPosition += _DefaultFontSize + _FontHeightMargin;
            // TODO: Handle scrolling. (Project 1)
        };
        Console.START_OF_LINE = 0;
        return Console;
    })();
    TSOS.Console = Console;
})(TSOS || (TSOS = {}));
