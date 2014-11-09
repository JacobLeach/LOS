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

            sc = new TSOS.ShellCommand(this.shellRun, "run", "- runs a program");
            this.commandList[sc.command] = sc;

            sc = new TSOS.ShellCommand(this.ps, "ps", "- list loaded programs");
            this.commandList[sc.command] = sc;

            /*sc = new ShellCommand(this.kill,
            "kill",
            "<pid> - kills a program");
            this.commandList[sc.command] = sc;
            
            sc = new ShellCommand(this.clearmem,
            "clearmem",
            "- clears memory");
            this.commandList[sc.command] = sc;
            */
            sc = new TSOS.ShellCommand(this.runall, "runall", "- runs all programs");
            this.commandList[sc.command] = sc;

            sc = new TSOS.ShellCommand(this.quantum, "quantum", "<ticks> - Changes round robin quantum");
            this.commandList[sc.command] = sc;

            // processes - list the running processes and their IDs
            // kill <id> - kills the specified process id.
            //
            // Display the initial prompt.
            this.putPrompt();
        };

        Shell.prototype.ps = function (args) {
            TSOS.liblos.ps();
        };

        /*public kill(args): void
        {
        liblos.kill(args[0]);
        }
        
        public clearmem(args): void
        {
        liblos.clearmem();
        }*/
        Shell.prototype.runall = function (args) {
            TSOS.liblos.runall();
        };

        Shell.prototype.quantum = function (args) {
            _Quant = args[0];
        };

        Shell.prototype.putPrompt = function () {
            TSOS.Stdio.putString(this.promptStr);
        };

        Shell.prototype.handleTabCompletion = function () {
            var command = [];

            for (var current in this.commandList) {
                var currentCommand = this.commandList[current].command;

                if (currentCommand.indexOf(this.inputBuffer) == 0) {
                    command.push(currentCommand);
                }
            }

            if (command.length > 1) {
                TSOS.Stdio.putString(ESCAPE + "[K");
                TSOS.Stdio.putString(ESCAPE + "[G");
                this.putPrompt();

                for (var i = 0; i < command.length; i++) {
                    TSOS.Stdio.putString(command[i]);
                    TSOS.Stdio.putString(" ");
                }

                TSOS.Stdio.putStringLn("");
                this.putPrompt();
                TSOS.Stdio.putString(this.inputBuffer);
            } else {
                //Figure out what part of the command we need to print
                var toPrint = command[0].substr(this.inputBuffer.length);

                //Correct the input buffer
                this.inputBuffer = command[0];

                //Make the screen look correct
                TSOS.Stdio.putString(toPrint);
            }
        };

        Shell.prototype.handleCharacter = function (character) {
            if (character === ENTER) {
                //Put line in history
                this.historyList[this.historyList.length] = this.inputBuffer;
                this.current = -2;

                //Send the enter to the terminal before processing
                TSOS.Stdio.putString(character);

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
                    TSOS.Stdio.putString(character);
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
                                if (this.current === 0) {
                                    this.current = -2;
                                }
                            }
                            if (this.current != 0 && this.current != -2) {
                                this.current--;
                            }

                            //These are ANSI control codes to control the cursor
                            //And to erase characters and stuff
                            //http://en.wikipedia.org/wiki/ANSI_escape_code
                            if (this.current != -2) {
                                TSOS.Stdio.putString(ESCAPE + "[K");
                                TSOS.Stdio.putString(ESCAPE + "[0G");
                                this.putPrompt();
                                TSOS.Stdio.putString(this.historyList[this.current]);
                                this.inputBuffer = this.historyList[this.current];
                            }
                            break;

                        case 'B':
                            if (this.current >= 0) {
                                if (this.current != this.historyList.length - 1) {
                                    this.current++;
                                }
                                TSOS.Stdio.putString(ESCAPE + "[K");
                                TSOS.Stdio.putString(ESCAPE + "[0G");
                                this.putPrompt();
                                TSOS.Stdio.putString(this.historyList[this.current]);
                                this.inputBuffer = this.historyList[this.current];
                            }
                            break;
                        case 'C':
                            TSOS.Stdio.putString(ESCAPE + "[C");
                            break;
                        case 'D':
                            TSOS.Stdio.putString(ESCAPE + "[D");
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
                TSOS.Stdio.putString(character);
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
            //if(_Console.getCursorPosition().x > 0) {
            //  Stdio.putString(ESCAPE + '[E');
            //}
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
            TSOS.Stdio.putStringLn("Invalid Command. ");
            if (_SarcasticMode) {
                TSOS.Stdio.putStringLn("Duh. Go back to your Speak & Spell.");
            } else {
                TSOS.Stdio.putStringLn("Type 'help' for, well... help.");
            }
        };

        Shell.prototype.shellCurse = function () {
            TSOS.Stdio.putStringLn("Oh, so that's how it's going to be, eh? Fine.");
            _StdOut.advanceLine();
            TSOS.Stdio.putStringLn("Bitch.");
            _SarcasticMode = true;
        };

        Shell.prototype.shellApology = function () {
            if (_SarcasticMode) {
                TSOS.Stdio.putStringLn("Okay. I forgive you. This time.");
                _SarcasticMode = false;
            } else {
                TSOS.Stdio.putStringLn("For what?");
            }
        };

        Shell.prototype.shellVer = function (args) {
            TSOS.Stdio.putStringLn(APP_NAME + " version " + APP_VERSION);
        };

        Shell.prototype.shellHelp = function (args) {
            TSOS.Stdio.putStringLn("Commands:");
            for (var i in _OsShell.commandList) {
                TSOS.Stdio.putStringLn("  " + _OsShell.commandList[i].command + " " + _OsShell.commandList[i].description);
            }
        };

        Shell.prototype.shellShutdown = function (args) {
            TSOS.Stdio.putStringLn("Shutting down...");
            TSOS.liblos.shutdown();
        };

        Shell.prototype.shellCls = function (args) {
            TSOS.Stdio.putString(ESCAPE + '[J');
        };

        Shell.prototype.shellMan = function (args) {
            if (args.length > 0) {
                var topic = args[0];
                switch (topic) {
                    case "help":
                        TSOS.Stdio.putStringLn("Help displays a list of (hopefully) valid commands.");
                        break;
                    default:
                        TSOS.Stdio.putStringLn("No manual entry for " + args[0] + ".");
                }
            } else {
                TSOS.Stdio.putStringLn("Usage: man <topic>  Please supply a topic.");
            }
        };

        Shell.prototype.shellTrace = function (args) {
            if (args.length > 0) {
                var setting = args[0];
                switch (setting) {
                    case "on":
                        if (_Trace && _SarcasticMode) {
                            TSOS.Stdio.putStringLn("Trace is already on, dumbass.");
                        } else {
                            _Trace = true;
                            TSOS.Stdio.putStringLn("Trace ON");
                        }

                        break;
                    case "off":
                        _Trace = false;
                        TSOS.Stdio.putStringLn("Trace OFF");
                        break;
                    default:
                        TSOS.Stdio.putStringLn("Invalid arguement.  Usage: trace <on | off>.");
                }
            } else {
                TSOS.Stdio.putStringLn("Usage: trace <on | off>");
            }
        };

        Shell.prototype.shellRot13 = function (args) {
            if (args.length > 0) {
                // Requires Utils.ts for rot13() function.
                TSOS.Stdio.putStringLn(args.join(' ') + " = '" + TSOS.Utils.rot13(args.join(' ')) + "'");
            } else {
                TSOS.Stdio.putStringLn("Usage: rot13 <string>  Please supply a string.");
            }
        };

        Shell.prototype.shellPrompt = function (args) {
            if (args.length > 0) {
                _OsShell.promptStr = args[0];
            } else {
                TSOS.Stdio.putStringLn("Usage: prompt <string>  Please supply a string.");
            }
        };

        Shell.prototype.shellKirby = function (args) {
            TSOS.Stdio.putStringLn("<(^.^)>");
        };

        Shell.prototype.shellAlias = function (args) {
            if (args.length > 1) {
                //Only work if the command exists and the alias is not already a command
                if (_OsShell.commandList[args[1]] != undefined && _OsShell.commandList[args[0]] === undefined) {
                    var sc = new TSOS.ShellCommand(_OsShell.commandList[args[1]].func, args[0], _OsShell.commandList[args[1]].description);
                    _OsShell.commandList[sc.command] = sc;
                }
            } else {
                TSOS.Stdio.putStringLn("Usage: alias <alias> <command>  Please supply a alias and a command.");
            }
        };

        Shell.prototype.shellDate = function (args) {
            var date = new Date();
            var formatted = (date.getMonth() + 1) + "/" + date.getDate() + "/" + date.getFullYear() + " " + date.getHours() + ":" + date.getMinutes() + ":" + ((date.getSeconds() < 10) ? ("0" + date.getSeconds()) : ("" + date.getSeconds()));
            TSOS.Stdio.putStringLn(formatted);
        };

        Shell.prototype.shellLocate = function (args) {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function (position) {
                    TSOS.Stdio.putStringLn("Latitude: " + position.coords.latitude + " Longitude: " + position.coords.longitude);
                });
            } else {
                TSOS.Stdio.putStringLn("I've alerted the NSA of your location.");
            }
        };

        //HACKS HACKS HACKS
        Shell.prototype.shellCrash = function (args) {
            _Console.bluescreen();
            _Console.writeWhiteText("Gotta crash... Mmmhh kay.");
            _Kernel.shutdown();
        };

        Shell.prototype.shellStatus = function (args) {
            document.getElementById("status").innerHTML = args[0];
        };

        Shell.prototype.shellRun = function (args) {
            TSOS.liblos.runProgram(args[0]);
        };

        Shell.prototype.shellLoad = function (args) {
            var code = document.getElementById("taProgramInput").value;
            code = code.replace(/ /g, '');
            code = code.replace(/\n/g, '');
            var valid = true;

            for (var i = 0; i < code.length; i++) {
                if (!((code[i] >= '0' && code[i] <= '9') || (code[i] >= 'A' && code[i] <= 'F'))) {
                    valid = false;
                }
            }

            if (valid && code != "" && ((code.length % 2) == 0)) {
                TSOS.Stdio.putString("Loading...");
                var pid = TSOS.liblos.loadProgram();
                if (pid === undefined) {
                    TSOS.Stdio.putStringLn("No space.");
                } else {
                    TSOS.Stdio.putStringLn(" Done.");
                    TSOS.Stdio.putStringLn("Pid: " + pid);
                }
            } else {
                TSOS.Stdio.putStringLn("You done goofed.");
            }
        };
        return Shell;
    })();
    TSOS.Shell = Shell;
})(TSOS || (TSOS = {}));
