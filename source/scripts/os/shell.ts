///<reference path="shellCommand.ts" />
///<reference path="userCommand.ts" />
///<reference path="stdio.ts" />
///<reference path="../utils.ts" />

/* ------------
   Shell.ts

   The OS Shell - The "command line interface" (CLI) for the console.
   ------------ */

// TODO: Write a base class / prototype for system services and let Shell inherit from it.

module TSOS {
    export class Shell {
        // Properties
        public promptStr = ">";
        public commandList = {};
        public curses = "[fuvg],[cvff],[shpx],[phag],[pbpxfhpxre],[zbgureshpxre],[gvgf]";
        public apologies = "[sorry]";
        public historyList = [];
        private current = -2;

        constructor() {

        }

        public isr(params) {
          var noNewLine = params.substr(0, params.length - 1);
          this.handleInput(noNewLine);
        }

        public init() {
            var sc = null;
            //
            // Load the command list.

            // ver
            sc = new ShellCommand(this.shellVer,
                                  "ver",
                                  "- Displays the current version data.");
            this.commandList[sc.command] = sc;

            // help
            sc = new ShellCommand(this.shellHelp,
                                  "help",
                                  "- This is the help command. Seek help.");
            this.commandList[sc.command] = sc;

            // shutdown
            sc = new ShellCommand(this.shellShutdown,
                                  "shutdown",
                                  "- Shuts down the virtual OS but leaves the underlying hardware simulation running.");
            this.commandList[sc.command] = sc;

            // cls
            sc = new ShellCommand(this.shellCls,
                                  "cls",
                                  "- Clears the screen and resets the cursor position.");
            this.commandList[sc.command] = sc;

            // man <topic>
            sc = new ShellCommand(this.shellMan,
                                  "man",
                                  "<topic> - Displays the MANual page for <topic>.");
            this.commandList[sc.command] = sc;

            // trace <on | off>
            sc = new ShellCommand(this.shellTrace,
                                  "trace",
                                  "<on | off> - Turns the OS trace on or off.");
            this.commandList[sc.command] = sc;

            // rot13 <string>
            sc = new ShellCommand(this.shellRot13,
                                  "rot13",
                                  "<string> - Does rot13 obfuscation on <string>.");
            this.commandList[sc.command] = sc;

            // prompt <string>
            sc = new ShellCommand(this.shellPrompt,
                                  "prompt",
                                  "<string> - Sets the prompt.");
            this.commandList[sc.command] = sc;
            
            // prompt <string>
            sc = new ShellCommand(this.shellKirby,
                                  "kirby",
                                  "- Displays Kirby");
            this.commandList[sc.command] = sc;
            
            // alias <alias> <command>
            sc = new ShellCommand(this.shellAlias,
                                  "alias",
                                  "<alias> <command> - Aliases a command");
            this.commandList[sc.command] = sc;
            
            // alias <alias> <command>
            sc = new ShellCommand(this.shellDate,
                                  "date",
                                  "- Displays current date and time");
            this.commandList[sc.command] = sc;
            
            // whereami
            sc = new ShellCommand(this.shellLocate,
                                  "whereami",
                                  "- Displays current location");
            this.commandList[sc.command] = sc;
            
            sc = new ShellCommand(this.shellCrash,
                                  "crash",
                                  "- Crashes the OS");
            this.commandList[sc.command] = sc;
            
            sc = new ShellCommand(this.shellStatus,
                                  "status",
                                  "- Changes the status bar status");
            this.commandList[sc.command] = sc;

            // processes - list the running processes and their IDs
            // kill <id> - kills the specified process id.

            //
            // Display the initial prompt.
            this.putPrompt();
        }

        public putPrompt() {
            Stdio.putString(this.promptStr, _StdOut);
        }

        public handleInput(buffer) {
          _Kernel.krnTrace("Shell Command~" + buffer);
            //
            // Parse the input...
            //
            var userCommand = new UserCommand();
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
                if (this.curses.indexOf("[" + Utils.rot13(cmd) + "]") >= 0) {     // Check for curses. {
                    this.execute(this.shellCurse);
                } else if (this.apologies.indexOf("[" + cmd + "]") >= 0) {    // Check for apologies. {
                    this.execute(this.shellApology);
                } else { // It's just a bad command. {
                    this.execute(this.shellInvalidCommand);
                }
            }
        }

        // args is an option parameter, ergo the ? which allows TypeScript to understand that
        public execute(fn, args?) {
            // ... call the command function passing in the args...
            fn(args);
            // Check to see if we need to advance the line again
            if (_Console.getCursorPosition().x > 0) {
              Stdio.putString(ESCAPE + '[E',_StdOut);
            }
            // ... and finally write the prompt again.
            this.putPrompt();
        }

        public parseInput(buffer) {
            var retVal = new UserCommand();

            // 1. Remove leading and trailing spaces.
            buffer = Utils.trim(buffer);

            // 2. Lower-case it.
            buffer = buffer.toLowerCase();

            // 3. Separate on spaces so we can determine the command and command-line args, if any.
            var tempList = buffer.split(" ");

            // 4. Take the first (zeroth) element and use that as the command.
            var cmd = tempList.shift();  // Yes, you can do that to an array in JavaScript.  See the Queue class.
            // 4.1 Remove any left-over spaces.
            cmd = Utils.trim(cmd);
            // 4.2 Record it in the return value.
            retVal.command = cmd;

            // 5. Now create the args array from what's left.
            for (var i in tempList) {
                var arg = Utils.trim(tempList[i]);
                if (arg != "") {
                    retVal.args[retVal.args.length] = tempList[i];
                }
            }
            return retVal;
        }

        //
        // Shell Command Functions.  Again, not part of Shell() class per se', just called from there.
        //
        public shellInvalidCommand() {
            Stdio.putString("Invalid Command. ", _StdOut);
            if (_SarcasticMode) {
                Stdio.putString("Duh. Go back to your Speak & Spell.", _StdOut);
            } else {
                Stdio.putString("Type 'help' for, well... help.", _StdOut);
            }
        }

        public shellCurse() {
            Stdio.putString("Oh, so that's how it's going to be, eh? Fine.", _StdOut);
            _StdOut.advanceLine();
            Stdio.putString("Bitch.", _StdOut);
            _SarcasticMode = true;
        }

        public shellApology() {
           if (_SarcasticMode) {
              Stdio.putString("Okay. I forgive you. This time.", _StdOut);
              _SarcasticMode = false;
           } else {
              Stdio.putString("For what?", _StdOut);
           }
        }

        public shellVer(args) {
            Stdio.putString(APP_NAME + " version " + APP_VERSION, _StdOut);
        }

        public shellHelp(args) {
            Stdio.putString("Commands:", _StdOut);
            for (var i in _OsShell.commandList) {
                _StdOut.advanceLine();
                Stdio.putString("  " + _OsShell.commandList[i].command + " " + _OsShell.commandList[i].description, _StdOut);
            }
        }

        public shellShutdown(args) {
             Stdio.putString("Shutting down...", _StdOut);
             // Call Kernel shutdown routine.
            _Kernel.krnShutdown();
            // TODO: Stop the final prompt from being displayed.  If possible.  Not a high priority.  (Damn OCD!)
        }

        public shellCls(args) {
            _StdOut.clearScreen();
            _StdOut.resetXY();
        }

        public shellMan(args) {
            if (args.length > 0) {
                var topic = args[0];
                switch (topic) {
                    case "help":
                        Stdio.putString("Help displays a list of (hopefully) valid commands.", _StdOut);
                        break;
                    default:
                        Stdio.putString("No manual entry for " + args[0] + ".", _StdOut);
                }
            } else {
                Stdio.putString("Usage: man <topic>  Please supply a topic.", _StdOut);
            }
        }

        public shellTrace(args) {
            if (args.length > 0) {
                var setting = args[0];
                switch (setting) {
                    case "on":
                        if (_Trace && _SarcasticMode) {
                            Stdio.putString("Trace is already on, dumbass.", _StdOut);
                        } else {
                            _Trace = true;
                            Stdio.putString("Trace ON", _StdOut);
                        }

                        break;
                    case "off":
                        _Trace = false;
                        Stdio.putString("Trace OFF", _StdOut);
                        break;
                    default:
                        Stdio.putString("Invalid arguement.  Usage: trace <on | off>.", _StdOut);
                }
            } else {
                Stdio.putString("Usage: trace <on | off>", _StdOut);
            }
        }

        public shellRot13(args) {
            if (args.length > 0) {
                // Requires Utils.ts for rot13() function.
                Stdio.putString(args.join(' ') + " = '" + Utils.rot13(args.join(' ')) +"'", _StdOut);
            } else {
                Stdio.putString("Usage: rot13 <string>  Please supply a string.", _StdOut);
            }
        }

        public shellPrompt(args) {
            if (args.length > 0) {
                _OsShell.promptStr = args[0];
            } else {
                Stdio.putString("Usage: prompt <string>  Please supply a string.", _StdOut);
            }
        }
        
        public shellKirby(args) {
          Stdio.putString("<(^.^)>", _StdOut);
        }
        
        public shellAlias(args) {
            if (args.length > 1) {
              //Only work if the command exists and the alias is not already a command
              if (_OsShell.commandList[args[1]] != undefined && _OsShell.commandList[args[0]] === undefined) {
                var sc = new ShellCommand(_OsShell.commandList[args[1]].func,
                                          args[0],
                                          _OsShell.commandList[args[1]].description);
                _OsShell.commandList[sc.command] = sc;
              }
            } 
            else {
              Stdio.putString("Usage: alias <alias> <command>  Please supply a alias and a command.", _StdOut);
            }
        }
        
        public shellDate(args) {
          var date = new Date();
          var formatted =  (date.getMonth() + 1) + "/" +
                            date.getDay() + "/" +
                            date.getFullYear() + " " + 
                            date.getHours() + ":" +
                            date.getMinutes() + ":" +
                           ((date.getSeconds() < 10) ? ("0" + date.getSeconds()) : ("" + date.getSeconds()));
          Stdio.putString(formatted, _StdOut);
        }
        
        public shellLocate(args) {
          if(navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position) {
              Stdio.putString("Latitude: " + position.coords.latitude + " Longitude: " + position.coords.longitude, _StdOut);
            });
          }
          else {
            Stdio.putString("I've alerted the NSA of your location.", _StdOut);
          }
        }
        
        public shellCrash(args) {
          //_Console.bluescreen("Gotta crash... Mmmhh kay.");
        }
        
        public shellStatus(args) {
          document.getElementById("status").innerHTML = args[0];
        }

    }
}
