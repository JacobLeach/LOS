/* ------------
Kernel.ts
------------ */
var TSOS;
(function (TSOS) {
    (function (IO) {
        IO[IO["PUT_STRING"] = 0] = "PUT_STRING";
        IO[IO["LOAD_PROGRAM"] = 1] = "LOAD_PROGRAM";
        IO[IO["CLEAR_SEGMENT"] = 2] = "CLEAR_SEGMENT";
        IO[IO["CONTEXT_SWITCH"] = 3] = "CONTEXT_SWITCH";
        IO[IO["PCB_IN_LOADED"] = 4] = "PCB_IN_LOADED";
        IO[IO["RUN"] = 5] = "RUN";
    })(TSOS.IO || (TSOS.IO = {}));
    var IO = TSOS.IO;

    var Kernel = (function () {
        function Kernel() {
            this.memoryManager = new TSOS.MemoryManager();

            this.loaded = [];
            this.ready = new TSOS.Queue();
            this.running = undefined;
            this.cyclesLeft = _Quant;

            //Create a kernel PCB to reserve memory where system call functions are located
            this.kernelPCB = new TSOS.PCB(this.memoryManager.reserve(3));
            this.kernelPCB.setKernelMode(true);

            TSOS.Control.hostLog("bootstrap", "host");

            // Initialize our global queues.
            _KernelInterruptQueue = new TSOS.Queue();
            _KernelBuffers = new Array();
            _KernelInputQueue = new TSOS.Queue();
            _StdIn = _Console;
            _StdOut = _Console;

            this.krnTrace("Loading the keyboard device driver.");
            _krnKeyboardDriver = new TSOS.DeviceDriverKeyboard();
            _krnKeyboardDriver.driverEntry();
            TSOS.Devices.hostEnableKeyboardInterrupt();
            this.krnTrace(_krnKeyboardDriver.status);

            this.krnTrace("Creating and Launching the shell.");
            _OsShell = new TSOS.Shell();
            _OsShell.init();

            //Start idling
            this.setIdle();
        }
        Kernel.prototype.loadProgram = function () {
            var segment = this.memoryManager.allocate();

            if (segment === undefined) {
                return undefined;
            } else {
                var pcb = new TSOS.PCB(segment);
                _KernelInterruptQueue.add(new TSOS.Tuple(1 /* LOAD_PROGRAM */, pcb));

                return pcb.getPid();
            }
            return 0;
        };

        //Switches context to the next PCB in the ready queue
        Kernel.prototype.contextSwitchToNext = function () {
            if (this.running != undefined) {
                this.running.updatePCB();

                //Idle and kernel PCBs do not go on the ready queue
                if (this.running != this.idlePCB && this.running != this.kernelPCB) {
                    this.ready.add(this.running);
                }
            }

            if (this.ready.size() > 0) {
                this.running = this.ready.dequeue();
                this.running.setCPU();
                this.krnTrace("Starting user process " + this.running.getPid());
            } else {
                this.setIdle();
            }
        };

        Kernel.prototype.contextSwitchToKernel = function () {
            //If kernel is already running, just reset the CPU to the kernel PCB
            if (this.running != this.kernelPCB) {
                this.running.updatePCB();

                //Don't put the idle PCB on the ready queue
                if (this.running != this.idlePCB) {
                    //Put what was running at the front so it runs after we are done
                    this.ready.front(this.running);
                }

                this.running = this.kernelPCB;
                this.krnTrace("Starting kernel process");
            }

            this.running.setCPU();
        };

        Kernel.prototype.putString = function () {
            this.kernelPCB.setProgramCounter(new TSOS.Short(0x0308));
            _CPU.returnRegister = _CPU.programCounter;
            this.contextSwitchToKernel();
        };

        Kernel.prototype.ps = function () {
            var pids = [];
            for (var i = 0; i < this.loaded.length; i++) {
                pids[this.loaded[i].getPid()] = true;
            }

            for (var i = 0; i < this.ready.q.length; i++) {
                pids[this.ready.q[i].getPid()] = true;
            }

            if (this.running != undefined) {
                pids[this.running.getPid()] = true;
            }

            if (this.idlePCB != undefined) {
                pids[this.idlePCB.getPid()] = true;
            }

            if (this.kernelPCB != undefined) {
                pids[this.kernelPCB.getPid()] = true;
            }

            return pids;
        };

        Kernel.prototype.kill = function (pid) {
            console.log("What?: " + pid);
            if (this.running != undefined && this.running.getPid() == pid) {
                this.memoryManager.deallocate(this.running.getSegment());
                ;
                TSOS.liblos.deallocate(this.running.getSegment());
                this.running = undefined;
            } else if (this.kernelPCB != undefined && this.kernelPCB.getPid() == pid) {
                _Console.bluescreen();
                _Console.writeWhiteText("Kernel killed.");
                _Kernel.shutdown();
            } else if (this.idlePCB != undefined && this.idlePCB.getPid() == pid) {
                this.memoryManager.deallocate(this.idlePCB.getSegment());
                ;
                TSOS.liblos.deallocate(this.idlePCB.getSegment());
                this.idlePCB = undefined;
            } else {
                for (var i = 0; i < this.loaded.length; i++) {
                    if (this.loaded[i].getPid() == pid) {
                        this.memoryManager.deallocate(this.loaded[i].getSegment());
                        ;
                        TSOS.liblos.deallocate(this.loaded[i].getSegment());
                        this.loaded.splice(i, 1);
                    }
                }

                for (var i = 0; i < this.ready.q.length; i++) {
                    if (this.ready.q[i].getPid() == pid) {
                        this.memoryManager.deallocate(this.ready.q[i].getSegment());
                        ;
                        TSOS.liblos.deallocate(this.ready.q[i].getSegment());
                        this.ready.q.splice(i, 1);
                    }
                }
            }
        };

        Kernel.prototype.killAll = function () {
            this.running = undefined;
            this.ready = new TSOS.Queue();
            this.loaded = [];
        };

        Kernel.prototype.runAll = function () {
            for (var i = 0; i < this.loaded.length;) {
                this.ready.add(this.loaded[i]);
                this.loaded.splice(i, 1);
            }
        };

        Kernel.prototype.runProgram = function (pid) {
            for (var i = 0; i < this.loaded.length; i++) {
                if (this.loaded[i].getPid() == pid) {
                    this.ready.add(this.loaded[i]);
                    this.loaded.splice(i, 1);
                }
            }
        };

        Kernel.prototype.print = function (pcb) {
            if (pcb.getPid() != 0) {
                var print = "";
                print += "Pid: " + pcb.getPid();
                print += "\nPC: " + pcb.getProgramCounter().asNumber().toString(16);
                print += "\nACC: " + pcb.getAccumulator().asNumber().toString(16);
                print += "\nX: " + pcb.getXRegister().asNumber().toString(16);
                print += "\nY: " + pcb.getYRegister().asNumber().toString(16);
                print += "\nZ: " + pcb.getZFlag();
                print += "\nKernel Mode: " + pcb.getKernelMode();
                print += "\nbase: " + pcb.getLowAddress().asNumber().toString(16);
                print += "\nlimit: " + pcb.getHighAddress().asNumber().toString(16);

                document.getElementById("pcbBox").value = print;
            }
        };

        Kernel.prototype.getRunning = function () {
            return this.running.getPid();
        };

        Kernel.prototype.setIdle = function () {
            if (this.idlePCB != undefined) {
                this.krnTrace("Starting idle process");
                this.running = this.idlePCB;
                this.running.setCPU();
            } else {
                this.krnTrace("Idle process not started. Starting.");
                this.idlePCB = new TSOS.PCB(this.memoryManager.reserve(4));
                this.setIdle();
            }
        };

        Kernel.prototype.shutdown = function () {
            _CPU.stop();
            this.krnTrace("begin shutdown OS");
            this.krnTrace("end shutdown OS");
        };

        Kernel.prototype.handleKernelInterrupt = function (interrupt) {
            switch (interrupt.first) {
                case 0 /* PUT_STRING */:
                    this.kernelPCB.setProgramCounter(new TSOS.Short(0x0308));
                    this.contextSwitchToKernel();
                    break;
                case 1 /* LOAD_PROGRAM */:
                    this.kernelPCB.setProgramCounter(new TSOS.Short(0x0319));
                    _Memory.setByte(new TSOS.Short(0x0323), interrupt.second.getBase().getHighByte());
                    this.contextSwitchToKernel();
                    _KernelInterruptQueue.front(new TSOS.Tuple(4 /* PCB_IN_LOADED */, interrupt.second));
                    break;
                case 2 /* CLEAR_SEGMENT */:
                    this.kernelPCB.setProgramCounter(new TSOS.Short(0x035D));
                    this.kernelPCB.setAccumulator(new TSOS.Byte(interrupt.second));
                    this.contextSwitchToKernel();
                    break;
                case 4 /* PCB_IN_LOADED */:
                    this.setIdle();
                    this.loaded.push(interrupt.second);
                    _CPU.ignoreInterrupts = false;
                    break;
                case 5 /* RUN */:
                    this.loadedToReady(interrupt.second);
                    this.contextSwitchToNext();
                    _CPU.ignoreInterrupts = false;
                    break;
            }
        };

        Kernel.prototype.loadedToReady = function (pid) {
            for (var i = 0; i < this.loaded.length; i++) {
                if (this.loaded[i].getPid() == pid) {
                    this.ready.add(this.loaded[i]);
                    this.loaded.splice(i, 1);
                    break;
                }
            }
        };

        Kernel.prototype.programBreak = function () {
            this.memoryManager.deallocate(this.running.getSegment());
            TSOS.liblos.deallocate(this.running.getSegment());
            this.running = undefined;

            TSOS.Stdio.putStringLn("Program Finished");
            this.contextSwitchToNext();
        };

        Kernel.prototype.returnInterrupt = function () {
            if (_KernelInterruptQueue.size() === 0) {
                this.contextSwitchToNext();
            }
        };

        Kernel.prototype.segmentationFault = function () {
        };

        Kernel.prototype.timerInterrupt = function () {
            //Only switch to next if we are running more than one program
            if (this.ready.size() > 1) {
                this.contextSwitchToNext();
            }
        };

        Kernel.prototype.keyboardInterrupt = function (parameters) {
            _krnKeyboardDriver.isr(parameters);
            while (_KernelInputQueue.size() > 0) {
                _OsShell.isr(_KernelInputQueue.dequeue());
            }
        };

        Kernel.prototype.softwareInterrupt = function () {
            switch (_CPU.xRegister.asNumber()) {
                case 1:
                    TSOS.Stdio.putString(_CPU.yRegister.asNumber().toString());
                    break;
                case 2:
                    this.kernelPCB.setAccumulator(new TSOS.Byte(_CPU.lowAddress.getHighByte().asNumber()));
                    this.kernelPCB.setProgramCounter(new TSOS.Short(0x0342));
                    this.contextSwitchToKernel();
                    break;
            }
        };

        Kernel.prototype.krnTrace = function (msg) {
            TSOS.Control.hostLog(msg, "OS");
        };

        Kernel.prototype.krnTrapError = function (msg) {
            TSOS.Control.hostLog("OS ERROR - TRAP: " + msg);
            this.shutdown();
        };
        return Kernel;
    })();
    TSOS.Kernel = Kernel;
})(TSOS || (TSOS = {}));
