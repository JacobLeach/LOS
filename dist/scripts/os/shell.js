///<reference path="shellCommand.ts" />
///<reference path="userCommand.ts" />
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
        }
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

            // processes - list the running processes and their IDs
            // kill <id> - kills the specified process id.
            //
            // Display the initial prompt.
            this.putPrompt();
        };

        Shell.prototype.putPrompt = function () {
            _StdOut.putText(this.promptStr);
        };

        Shell.prototype.handleUp = function () {
            if (_OsShell.current == -2) {
                _OsShell.current = _OsShell.historyList.length;
            }
            if (_OsShell.current != 0) {
                _OsShell.current--;
            }
            _Console.clearLine();
            _Console.moveCursorToStartOfLine();
            _OsShell.putPrompt();
            _StdOut.putText(_OsShell.historyList[_OsShell.current]);
            _Console.buffer = _OsShell.historyList[_OsShell.current];
        };

        Shell.prototype.handleDown = function () {
            if (_OsShell.current > 0) {
                if (_OsShell.current != _OsShell.historyList.length - 1) {
                    _OsShell.current++;
                }
                _Console.clearLine();
                _Console.moveCursorToStartOfLine();
                _OsShell.putPrompt();
                _StdOut.putText(_OsShell.historyList[_OsShell.current]);
                _Console.buffer = _OsShell.historyList[_OsShell.current];
            }
        };

        Shell.prototype.handleLeft = function () {
        };

        Shell.prototype.handleRight = function () {
        };

        Shell.prototype.tabCompletion = function (buffer) {
            var tab = buffer.substr(-1) === '\t';

            //Already have one tab in the buffer
            if (tab) {
            } else {
                var command = "";
                for (var i in _OsShell.commandList) {
                    var currentCommand = _OsShell.commandList[i].command;
                    if (currentCommand.indexOf(buffer) == 0) {
                        command = currentCommand;
                    }
                }
                _StdOut.putText(command.substr(buffer.length));
                _Console.buffer = command;
            }
        };

        Shell.prototype.handleInput = function (buffer) {
            _OsShell.historyList[_OsShell.historyList.length] = buffer;
            _OsShell.current = -2;
            _Kernel.krnTrace("Shell Command~" + buffer);

            //
            // Parse the input...
            //
            var userCommand = new TSOS.UserCommand();
            userCommand = this.parseInput(buffer);

            // ... and assign the command and args to local variables.
            var cmd = userCommand.command;
            var args = userCommand.args;

            //
            // Determine the command and execute it.
            //
            // JavaScript may not support associative arrays in all browsers so we have to
            // iterate over the command list in attempt to find a match.  TODO: Is there a better way? Probably.
            if (this.commandList[cmd] != undefined) {
                this.execute(this.commandList[cmd].func, args);
            } else {
                // It's not found, so check for curses and apologies before declaring the command invalid.
                if (this.curses.indexOf("[" + TSOS.Utils.rot13(cmd) + "]") >= 0) {
                    this.execute(this.shellCurse);
                } else if (this.apologies.indexOf("[" + cmd + "]") >= 0) {
                    this.execute(this.shellApology);
                } else {
                    this.execute(this.shellInvalidCommand);
                }
            }
        };

        // args is an option parameter, ergo the ? which allows TypeScript to understand that
        Shell.prototype.execute = function (fn, args) {
            // We just got a command, so advance the line...
            _StdOut.advanceLine();

            // ... call the command function passing in the args...
            fn(args);

            // Check to see if we need to advance the line again
            if (_StdOut.currentXPosition > 0) {
                _StdOut.advanceLine();
            }

            // ... and finally write the prompt again.
            this.putPrompt();
        };

        Shell.prototype.parseInput = function (buffer) {
            var retVal = new TSOS.UserCommand();

            // 1. Remove leading and trailing spaces.
            buffer = TSOS.Utils.trim(buffer);

            // 2. Lower-case it.
            buffer = buffer.toLowerCase();

            // 3. Separate on spaces so we can determine the command and command-line args, if any.
            var tempList = buffer.split(" ");

            // 4. Take the first (zeroth) element and use that as the command.
            var cmd = tempList.shift();

            // 4.1 Remove any left-over spaces.
            cmd = TSOS.Utils.trim(cmd);

            // 4.2 Record it in the return value.
            retVal.command = cmd;

            for (var i in tempList) {
                var arg = TSOS.Utils.trim(tempList[i]);
                if (arg != "") {
                    retVal.args[retVal.args.length] = tempList[i];
                }
            }
            return retVal;
        };

        //
        // Shell Command Functions.  Again, not part of Shell() class per se', just called from there.
        //
        Shell.prototype.shellInvalidCommand = function () {
            _StdOut.putText("Invalid Command. ");
            if (_SarcasticMode) {
                _StdOut.putText("Duh. Go back to your Speak & Spell.");
            } else {
                _StdOut.putText("Type 'help' for, well... help.");
            }
        };

        Shell.prototype.shellCurse = function () {
            _StdOut.putText("Oh, so that's how it's going to be, eh? Fine.");
            _StdOut.advanceLine();
            _StdOut.putText("Bitch.");
            _SarcasticMode = true;
        };

        Shell.prototype.shellApology = function () {
            if (_SarcasticMode) {
                _StdOut.putText("Okay. I forgive you. This time.");
                _SarcasticMode = false;
            } else {
                _StdOut.putText("For what?");
            }
        };

        Shell.prototype.shellVer = function (args) {
            _StdOut.putText(APP_NAME + " version " + APP_VERSION);
        };

        Shell.prototype.shellHelp = function (args) {
            _StdOut.putText("Commands:");
            for (var i in _OsShell.commandList) {
                _StdOut.advanceLine();
                _StdOut.putText("  " + _OsShell.commandList[i].command + " " + _OsShell.commandList[i].description);
            }
        };

        Shell.prototype.shellShutdown = function (args) {
            _StdOut.putText("Shutting down...");

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
                        _StdOut.putText("Help displays a list of (hopefully) valid commands.");
                        break;
                    default:
                        _StdOut.putText("No manual entry for " + args[0] + ".");
                }
            } else {
                _StdOut.putText("Usage: man <topic>  Please supply a topic.");
            }
        };

        Shell.prototype.shellTrace = function (args) {
            if (args.length > 0) {
                var setting = args[0];
                switch (setting) {
                    case "on":
                        if (_Trace && _SarcasticMode) {
                            _StdOut.putText("Trace is already on, dumbass.");
                        } else {
                            _Trace = true;
                            _StdOut.putText("Trace ON");
                        }

                        break;
                    case "off":
                        _Trace = false;
                        _StdOut.putText("Trace OFF");
                        break;
                    default:
                        _StdOut.putText("Invalid arguement.  Usage: trace <on | off>.");
                }
            } else {
                _StdOut.putText("Usage: trace <on | off>");
            }
        };

        Shell.prototype.shellRot13 = function (args) {
            if (args.length > 0) {
                // Requires Utils.ts for rot13() function.
                _StdOut.putText(args.join(' ') + " = '" + TSOS.Utils.rot13(args.join(' ')) + "'");
            } else {
                _StdOut.putText("Usage: rot13 <string>  Please supply a string.");
            }
        };

        Shell.prototype.shellPrompt = function (args) {
            if (args.length > 0) {
                _OsShell.promptStr = args[0];
            } else {
                _StdOut.putText("Usage: prompt <string>  Please supply a string.");
            }
        };

        Shell.prototype.shellKirby = function (args) {
            _StdOut.putText("<(^.^)>");
        };

        Shell.prototype.shellAlias = function (args) {
            if (args.length > 1) {
                //Only work if the command exists and the alias is not already a command
                if (_OsShell.commandList[args[1]] != undefined && _OsShell.commandList[args[0]] === undefined) {
                    var sc = new TSOS.ShellCommand(_OsShell.commandList[args[1]].func, args[0], _OsShell.commandList[args[1]].description);
                    _OsShell.commandList[sc.command] = sc;
                }
            } else {
                _StdOut.putText("Usage: alias <alias> <command>  Please supply a alias and a command.");
            }
        };

        Shell.prototype.shellDate = function (args) {
            var date = new Date();
            var formatted = (date.getMonth() + 1) + "/" + date.getDay() + "/" + date.getFullYear() + " " + date.getHours() + ":" + date.getMinutes() + ":" + ((date.getSeconds() < 10) ? ("0" + date.getSeconds()) : ("" + date.getSeconds()));
            _StdOut.putText(formatted);
        };

        Shell.prototype.shellLocate = function (args) {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function (position) {
                    _StdOut.putText("Latitude: " + position.coords.latitude + " Longitude: " + position.coords.longitude);
                });
            } else {
                _StdOut.putText("I've alerted the NSA of your location.");
            }
        };

        Shell.prototype.shellCrash = function (args) {
            _Console.bluescreen("Gotta crash... Mmmhh kay.");
        };
        return Shell;
    })();
    TSOS.Shell = Shell;
})(TSOS || (TSOS = {}));
