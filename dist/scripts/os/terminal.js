///<reference path="../globals.ts" />
/* ------------
Terminal.ts
Requires globals.ts
A terminal emulator.
------------ */
var TSOS;
(function (TSOS) {
    var Terminal = (function () {
        function Terminal(canvas) {
            this.font = '12pt Courier';
            this.lineSpacing = 4;
            this.cursor = { x: 0, y: 0 };
            this.inputBuffer = [];
            this.echo = true;
            this.lastCharEscape = false;
            this.ansi = false;
            this.ansiNumber = "";
            /*
            * This controls whether or not the terminal is canonical or not.
            *
            * In other words, whether or not it buffers.
            * If it is canonical, it only passes the input back after a newline.
            * If it is non-ccanonical it passes back each character as they come.
            *
            * TODO: Make the shell do ALL the buffering
            *       AKA, put this in non-canonical mode
            *       AKA, make this SUPER dumb
            */
            this.canonical = false;
            this.canvas = canvas;

            this.context = canvas.getContext('2d');
            this.context.font = this.font;

            this.charWidth = this.context.measureText(' ').width;
            this.lineHeight = 12 * 1.5;

            //This is a bit of a hack
            //I chose -2 because it works
            this.columns = Math.round(this.canvas.height / this.charWidth) - 2;
            this.rows = Math.round(this.canvas.width / this.lineHeight) - 2;
        }
        /*
        * HACKS HACKS HACKS!
        *
        * But seriously, this is a hack. Should be done with ANSI control codes,
        * not a function call. That would be more true to a real life terminal.
        * However, I am a bit lazy and ANSI and color is a lot of crap.
        */
        Terminal.prototype.bluescreen = function () {
            this.cursor.x = 0;
            console.log("FUCK");
            this.cursor.y = 0;
            this.context.fillStyle = '#0000FF';
            this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.context.fillStyle = '#000000';
        };

        //HACKS HACKS HACKS!
        //Yea same here. ANSI control codes but that's too much work.
        Terminal.prototype.writeWhiteText = function (text) {
            this.context.fillStyle = '#FFFFFF';
            for (var i = 0; i < text.length; i++) {
                this.printChar(text.charAt(i), false);
            }
        };

        Terminal.prototype.getCursorPosition = function () {
            return { x: this.cursor.x, y: this.cursor.y };
        };

        Terminal.prototype.handleInputChar = function () {
            if (this.inputBuffer.length > 0) {
                var character = this.inputBuffer[this.inputBuffer.length - 1];
                this.handleChar(character, true);
            }
        };

        Terminal.prototype.handleChar = function (character, isInput) {
            //Add character to the input buffer
            //Wow. This is totally a bug somehow. I bet in canonical mode this is broken.
            this.inputBuffer.push(character);

            var printable = true;
            var input = "";

            //Checking to see if this is going to be an ANSI control code
            //If it is, then handle it
            if (character === ESCAPE) {
                printable = false;
                this.lastCharEscape = true;
            } else if (character === '[') {
                if (this.lastCharEscape) {
                    this.ansi = true;
                    printable = false;
                }
                this.lastCharEscape = false;
            } else if (character === String.fromCharCode(0)) {
                printable = false;
            } else if (this.ansi) {
                if (character >= '0' && character <= '9') {
                    //+ "" is to make the type system happy
                    this.ansiNumber += character + "";
                    printable = false;
                } else {
                    var amount;
                    if (this.ansiNumber === "") {
                        amount = 1;
                    } else {
                        amount = parseInt(this.ansiNumber, 10);
                    }
                    switch (character) {
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
                        case 'G':
                            this.cursor.x = amount;
                            break;
                        case 'J':
                            this.clearAll();
                            break;
                        case 'K':
                            this.clearLine();
                            break;
                    }
                    this.ansiNumber = "";
                    printable = false;
                    this.ansi = false;
                }
            }

            if (character === BACKSPACE) {
                //Pop the backspace
                this.inputBuffer.pop();
                printable = false;

                if (!this.canonical || this.inputBuffer.length > 0) {
                    //Do not print the backspace
                    this.moveCursorLeft(1);
                    this.clear();

                    //Pop the erased character
                    this.inputBuffer.pop();
                }
            } else if (character === ENTER) {
                printable = false;

                while (this.inputBuffer[0] != ENTER) {
                    input += this.inputBuffer.shift();
                }

                //Remove the newline
                input += this.inputBuffer.shift();

                this.makeNewLine();
            } else if (!this.canonical) {
                input += this.inputBuffer.shift();
            }

            //If it is a printable character, print it
            if (((this.echo && isInput) || !isInput) && printable) {
                this.printChar(character, true);
            }

            if ((!this.canonical || character === ENTER) && isInput) {
                _KernelInterruptQueue.enqueue(new TSOS.Interrupt(TSOS.Kernel.TERMINAL_IRQ, input));
            }
        };

        Terminal.prototype.putChar = function (character) {
            this.handleChar(character, false);
        };

        Terminal.prototype.moveCursorUp = function (amount) {
            if (this.cursor.y - amount < 0) {
                this.cursor.y = 0;
            } else {
                this.cursor.y -= amount;
            }
        };

        Terminal.prototype.moveCursorDown = function (amount) {
            if (this.cursor.y + amount > this.rows) {
                this.cursor.y = this.rows;
            } else {
                this.cursor.y += amount;
            }
        };

        Terminal.prototype.moveCursorLeft = function (amount) {
            if (this.cursor.x - amount < 0) {
                this.cursor.x = 0;
            } else {
                this.cursor.x -= amount;
            }
        };

        Terminal.prototype.moveCursorRight = function (amount) {
            if (this.cursor.x + amount > this.columns) {
                this.cursor.x = this.columns;
            } else {
                this.cursor.x += amount;
            }
        };

        Terminal.prototype.makeNewLine = function () {
            this.cursor.x = 0;
            if (this.cursor.y === this.rows) {
                //Get an image of the canvas of all but the top line
                var image = this.context.getImageData(0, this.lineHeight, this.context.canvas.width, this.rows * this.lineHeight);

                //Draw it at the top (aka scroll up)
                this.context.putImageData(image, 0, 0);

                //Clear the line that was just created (aka the bottom)
                this.clearLine();
            } else {
                this.moveCursorDown(1);
            }
        };

        Terminal.prototype.printChar = function (character, clearLine) {
            if (this.cursor.x == this.columns) {
                this.cursor.x = 0;
                this.makeNewLine();
            }

            //Get coordinates on the screen
            var coords = this.cursorToCoords();

            //Clear the spot incase a letter is already here
            if (clearLine) {
                this.clear();
            }

            //Write the letter to the screen
            this.context.fillText(character, coords.x, coords.y);

            //Advance the cursor
            this.cursor.x++;
        };

        Terminal.prototype.clear = function () {
            //Get topleft corner of the cursor location
            var topLeft = this.cursorTopLeft();

            //Clear the place of any previous character
            //Add the line spacing to make sure the lowest characters are removed
            this.context.clearRect(topLeft.x, topLeft.y, this.charWidth + 1, this.lineHeight + this.lineSpacing);
        };

        Terminal.prototype.clearLine = function () {
            //Get topleft corner of the cursor location
            var topLeft = this.cursorTopLeft();
            this.context.clearRect(0, topLeft.y, this.canvas.width, this.lineHeight + this.lineSpacing);
        };

        Terminal.prototype.clearAll = function () {
            this.cursor.x = 0;
            this.cursor.y = 0;
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        };

        Terminal.prototype.cursorToCoords = function () {
            var newX = (this.cursor.x * this.charWidth) + 1;
            var newY = ((this.cursor.y + 1) * this.lineHeight) - this.lineSpacing;

            return { x: newX, y: newY };
        };

        Terminal.prototype.cursorTopLeft = function () {
            //Add one to move font off the edge one pixel
            var newX = (this.cursor.x * this.charWidth) + 1;
            var newY = this.cursor.y * this.lineHeight;

            return { x: newX, y: newY };
        };
        return Terminal;
    })();
    TSOS.Terminal = Terminal;
})(TSOS || (TSOS = {}));
