///<reference path="shellCommand.ts" />
///<reference path="userCommand.ts" />
///<reference path="stdio.ts" />
///<reference path="../utils.ts" />
/* ------------
Shell.ts
The OS Shell - The "command line interface" (CLI) for the console.
------------ */
// TODO: Write a base class / prototype for system services and let Shell inherit from it.
var TSOS;
(function (TSOS) {
    var Shell = (function () {
        function Shell() {
            // Properties
            this.promptStr = ">";
            this.commandList = {};
            this.curses = "[fuvg],[cvff],[shpx],[phag],[pbpxfhpxre],[zbgureshpxre],[gvgf]";
            this.apologies = "[sorry]";
            this.historyList = [];
            this.current = -2;
            this.ansi = false;
            this.lastCharEscape = false;
            this.ansiNumber = "";
            this.inputBuffer = "";
        }
        Shell.prototype.isr = function (character) {
            this.handleCharacter(character);
        };

        Shell.prototype.init = function () {
            var sc = null;

            //
            // Load the command list.
            // ver
            sc = new TSOS.ShellCommand(this.shellVer, "ver", "- Displays the current version data.");
            this.commandList[sc.command] = sc;

            // help
            sc = new TSOS.ShellCommand(this.shellHelp, "help", "- This is the help command. Seek help.");
            this.commandList[sc.command] = sc;

            // shutdown
            sc = new TSOS.ShellCommand(this.shellShutdown, "shutdown", "- Shuts down the virtual OS but leaves the underlying hardware simulation running.");
            this.commandList[sc.command] = sc;

            // cls
            sc = new TSOS.ShellCommand(this.shellCls, "cls", "- Clears the screen and resets the cursor position.");
            this.commandList[sc.command] = sc;

            // man <topic>
            sc = new TSOS.ShellCommand(this.shellMan, "man", "<topic> - Displays the MANual page for <topic>.");
            this.commandList[sc.command] = sc;

            // trace <on | off>
            sc = new TSOS.ShellCommand(this.shellTrace, "trace", "<on | off> - Turns the OS trace on or off.");
            this.commandList[sc.command] = sc;

            // rot13 <string>
            sc = new TSOS.ShellCommand(this.shellRot13, "rot13", "<string> - Does rot13 obfuscation on <string>.");
            this.commandList[sc.command] = sc;

            // prompt <string>
            sc = new TSOS.ShellCommand(this.shellPrompt, "prompt", "<string> - Sets the prompt.");
            this.commandList[sc.command] = sc;

            // prompt <string>
            sc = new TSOS.ShellCommand(this.shellKirby, "kirby", "- Displays Kirby");
            this.commandList[sc.command] = sc;

            // alias <alias> <command>
            sc = new TSOS.ShellCommand(this.shellAlias, "alias", "<alias> <command> - Aliases a command");
            this.commandList[sc.command] = sc;

            // alias <alias> <command>
            sc = new TSOS.ShellCommand(this.shellDate, "date", "- Displays current date and time");
            this.commandList[sc.command] = sc;

            // whereami
            sc = new TSOS.ShellCommand(this.shellLocate, "whereami", "- Displays current location");
            this.commandList[sc.command] = sc;

            sc = new TSOS.ShellCommand(this.shellCrash, "crash", "- Crashes the OS");
            this.commandList[sc.command] = sc;

            sc = new TSOS.ShellCommand(this.shellStatus, "status", "- Changes the status bar status");
            this.commandList[sc.command] = sc;

            sc = new TSOS.ShellCommand(this.shellLoad, "load", "- Loads a program");
            this.commandList[sc.command] = sc;

            // processes - list the running processes and their IDs
            // kill <id> - kills the specified process id.
            //
            // Display the initial prompt.
            this.putPrompt();
        };

        Shell.prototype.putPrompt = function () {
            TSOS.Stdio.putString(this.promptStr, _StdOut);
        };

        Shell.prototype.handleTabCompletion = function () {
            var command = "";

            for (var current in this.commandList) {
                var currentCommand = this.commandList[current].command;
                if (currentCommand.indexOf(this.inputBuffer) == 0) {
                    command = currentCommand;
                }
            }

            //Firgure out what part of the command we need to print
            var toPrint = command.substr(this.inputBuffer.length);

            //Correct the input buffer
            this.inputBuffer = command;

            //Make the screen look correct
            TSOS.Stdio.putString(toPrint, _StdOut);
        };

        Shell.prototype.handleCharacter = function (character) {
            if (character === ENTER) {
                //Put line in history
                this.historyList[this.historyList.length] = this.inputBuffer;
                this.current = -2;

                //Send the enter to the terminal before processing
                TSOS.Stdio.putString(character, _StdOut);

                //Remove leading and trailing spaces.
                this.inputBuffer = TSOS.Utils.trim(this.inputBuffer);

                //Handle the command
                this.handleCommand();

                //Flush the buffer after we handle the command
                this.inputBuffer = "";
            } else if (character === TAB) {
                //Erase the tab that got printed to the screen
                this.handleTabCompletion();
            } else if (character === ESCAPE) {
                this.lastCharEscape = true;
            } else if (character === BACKSPACE) {
                if (this.inputBuffer.length > 0) {
                    this.inputBuffer = this.inputBuffer.substr(0, this.inputBuffer.length - 1);
                    TSOS.Stdio.putString(character, _StdOut);
                }
            } else if (character === '[') {
                if (this.lastCharEscape) {
                    this.ansi = true;
                }
                this.lastCharEscape = false;
            } else if (character === String.fromCharCode(0)) {
                //Do nothing
            } else if (this.ansi) {
                if (character >= '0' && character <= '9') {
                    //+ "" is to make the type system happy
                    this.ansiNumber += character + "";
                } else {
                    var amount;
                    if (this.ansiNumber === "") {
                        amount = 1;
                    } else {
                        amount = parseInt(this.ansiNumber, 10);
                    }

                    switch (character) {
                        case 'A':
                            if (this.current == -2) {
                                this.current = this.historyList.length;
                            }
                            if (this.current != 0) {
                                this.current--;
                            }

                            //These are ANSI control codes to control the cursor
                            //And to erase characters and stuff
                            //http://en.wikipedia.org/wiki/ANSI_escape_code
                            TSOS.Stdio.putString(ESCAPE + "[K", _StdOut);
                            TSOS.Stdio.putString(ESCAPE + "[0G", _StdOut);
                            this.putPrompt();
                            TSOS.Stdio.putString(this.historyList[this.current], _StdOut);
                            this.inputBuffer = this.historyList[this.current];
                            break;

                        case 'B':
                            if (this.current >= 0) {
                                if (this.current != this.historyList.length - 1) {
                                    this.current++;
                                }
                                TSOS.Stdio.putString(ESCAPE + "[K", _StdOut);
                                TSOS.Stdio.putString(ESCAPE + "[0G", _StdOut);
                                this.putPrompt();
                                TSOS.Stdio.putString(this.historyList[this.current], _StdOut);
                                this.inputBuffer = this.historyList[this.current];
                            }
                            break;
                        case 'C':
                            break;
                        case 'D':
                            break;
                        case 'E':
                            break;
                        case 'F':
                            break;
                    }
                    this.ansiNumber = "";
                    this.ansi = false;
                }
            } else {
                //Add input to the input buffer
                this.inputBuffer += character + "";

                //Send it to the terminal to display
                TSOS.Stdio.putString(character, _StdOut);
            }
        };

        Shell.prototype.handleCommand = function () {
            //Split by spaces for command and arguments
            var temp = this.inputBuffer.split(" ");

            //First element is the command
            var command = temp.shift();

            //Rest are parameters
            var parameters = temp;

            //If we haven't typed anything, don't check for a command
            if (this.inputBuffer.length > 0) {
                this.executeCommand(command, parameters);
            }

            /*
            * If the cursor is not at the beginning of the line,
            * we need to advance it to the next line before we
            * print the prompt
            */
            if (_Console.getCursorPosition().x > 0) {
                TSOS.Stdio.putString(ESCAPE + '[E', _StdOut);
            }

            if (command != "crash") {
                this.putPrompt();
            }
        };

        /*
        * Command is 'any' so typescript does not bitch about
        * indexing by String which is valid javascript
        */
        Shell.prototype.executeCommand = function (command, parameters) {
            if (this.commandList[command] != undefined) {
                this.commandList[command].func(parameters);
            } else {
                this.shellInvalidCommand();
            }
        };

        //
        // Shell Command Functions.  Again, not part of Shell() class per se', just called from there.
        //
        Shell.prototype.shellInvalidCommand = function () {
            TSOS.Stdio.putString("Invalid Command. ", _StdOut);
            if (_SarcasticMode) {
                TSOS.Stdio.putString("Duh. Go back to your Speak & Spell.", _StdOut);
            } else {
                TSOS.Stdio.putString("Type 'help' for, well... help.", _StdOut);
            }
        };

        Shell.prototype.shellCurse = function () {
            TSOS.Stdio.putString("Oh, so that's how it's going to be, eh? Fine.", _StdOut);
            _StdOut.advanceLine();
            TSOS.Stdio.putString("Bitch.", _StdOut);
            _SarcasticMode = true;
        };

        Shell.prototype.shellApology = function () {
            if (_SarcasticMode) {
                TSOS.Stdio.putString("Okay. I forgive you. This time.", _StdOut);
                _SarcasticMode = false;
            } else {
                TSOS.Stdio.putString("For what?", _StdOut);
            }
        };

        Shell.prototype.shellVer = function (args) {
            TSOS.Stdio.putString(APP_NAME + " version " + APP_VERSION, _StdOut);
        };

        Shell.prototype.shellHelp = function (args) {
            TSOS.Stdio.putString("Commands:", _StdOut);
            for (var i in _OsShell.commandList) {
                TSOS.Stdio.putString(ESCAPE + '[E', _StdOut);
                TSOS.Stdio.putString("  " + _OsShell.commandList[i].command + " " + _OsShell.commandList[i].description, _StdOut);
            }
        };

        Shell.prototype.shellShutdown = function (args) {
            TSOS.Stdio.putString("Shutting down...", _StdOut);

            // Call Kernel shutdown routine.
            _Kernel.krnShutdown();
            // TODO: Stop the final prompt from being displayed.  If possible.  Not a high priority.  (Damn OCD!)
        };

        Shell.prototype.shellCls = function (args) {
            _StdOut.clearScreen();
            _StdOut.resetXY();
        };

        Shell.prototype.shellMan = function (args) {
            if (args.length > 0) {
                var topic = args[0];
                switch (topic) {
                    case "help":
                        TSOS.Stdio.putString("Help displays a list of (hopefully) valid commands.", _StdOut);
                        break;
                    default:
                        TSOS.Stdio.putString("No manual entry for " + args[0] + ".", _StdOut);
                }
            } else {
                TSOS.Stdio.putString("Usage: man <topic>  Please supply a topic.", _StdOut);
            }
        };

        Shell.prototype.shellTrace = function (args) {
            if (args.length > 0) {
                var setting = args[0];
                switch (setting) {
                    case "on":
                        if (_Trace && _SarcasticMode) {
                            TSOS.Stdio.putString("Trace is already on, dumbass.", _StdOut);
                        } else {
                            _Trace = true;
                            TSOS.Stdio.putString("Trace ON", _StdOut);
                        }

                        break;
                    case "off":
                        _Trace = false;
                        TSOS.Stdio.putString("Trace OFF", _StdOut);
                        break;
                    default:
                        TSOS.Stdio.putString("Invalid arguement.  Usage: trace <on | off>.", _StdOut);
                }
            } else {
                TSOS.Stdio.putString("Usage: trace <on | off>", _StdOut);
            }
        };

        Shell.prototype.shellRot13 = function (args) {
            if (args.length > 0) {
                // Requires Utils.ts for rot13() function.
                TSOS.Stdio.putString(args.join(' ') + " = '" + TSOS.Utils.rot13(args.join(' ')) + "'", _StdOut);
            } else {
                TSOS.Stdio.putString("Usage: rot13 <string>  Please supply a string.", _StdOut);
            }
        };

        Shell.prototype.shellPrompt = function (args) {
            if (args.length > 0) {
                _OsShell.promptStr = args[0];
            } else {
                TSOS.Stdio.putString("Usage: prompt <string>  Please supply a string.", _StdOut);
            }
        };

        Shell.prototype.shellKirby = function (args) {
            TSOS.Stdio.putString("<(^.^)>", _StdOut);
        };

        Shell.prototype.shellAlias = function (args) {
            if (args.length > 1) {
                //Only work if the command exists and the alias is not already a command
                if (_OsShell.commandList[args[1]] != undefined && _OsShell.commandList[args[0]] === undefined) {
                    var sc = new TSOS.ShellCommand(_OsShell.commandList[args[1]].func, args[0], _OsShell.commandList[args[1]].description);
                    _OsShell.commandList[sc.command] = sc;
                }
            } else {
                TSOS.Stdio.putString("Usage: alias <alias> <command>  Please supply a alias and a command.", _StdOut);
            }
        };

        Shell.prototype.shellDate = function (args) {
            var date = new Date();
            var formatted = (date.getMonth() + 1) + "/" + date.getDate() + "/" + date.getFullYear() + " " + date.getHours() + ":" + date.getMinutes() + ":" + ((date.getSeconds() < 10) ? ("0" + date.getSeconds()) : ("" + date.getSeconds()));
            TSOS.Stdio.putString(formatted, _StdOut);
        };

        Shell.prototype.shellLocate = function (args) {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function (position) {
                    TSOS.Stdio.putString("Latitude: " + position.coords.latitude + " Longitude: " + position.coords.longitude, _StdOut);
                });
            } else {
                TSOS.Stdio.putString("I've alerted the NSA of your location.", _StdOut);
            }
        };

        //HACKS HACKS HACKS
        Shell.prototype.shellCrash = function (args) {
            _Console.bluescreen();
            _Console.writeWhiteText("Gotta crash... Mmmhh kay.");
        };

        Shell.prototype.shellStatus = function (args) {
            document.getElementById("status").innerHTML = args[0];
        };

        Shell.prototype.shellLoad = function (args) {
            var valid = true;
            var code = document.getElementById("taProgramInput").value;
            console.log(code);
            for (var i = 0; i < code.length; i++) {
                if (!((code[i] >= '0' && code[i] <= '9') || (code[i] >= 'A' && code[i] <= 'F') || (code[i] === ' ') || (code[i] === ENTER) || (code[i] === String.fromCharCode(10)))) {
                    console.log(code[i].charCodeAt(0));
                    valid = false;
                }
            }

            if (valid) {
                TSOS.Stdio.putString("It's valid!", _StdOut);
            } else {
                TSOS.Stdio.putString("You done goofed.", _StdOut);
            }
        };
        return Shell;
    })();
    TSOS.Shell = Shell;
})(TSOS || (TSOS = {}));
