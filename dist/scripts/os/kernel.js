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

            //Set kernel PCB to kernel mode
            this.kernelPCB.setKernelMode(true);

            //Set the kernel PCB to the idle process
            this.setIdle();

            //Set the kernelPCB to running
            this.running = this.kernelPCB;

            //Set the CPU to execute the kernel
            this.contextSwitchToKernel();

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
        }
        Kernel.prototype.forkExec = function () {
            return 0;
        };

        //Switches context to the next PCB in the ready queue
        Kernel.prototype.contextSwitchToNext = function () {
            //If size is 1, do not do a context switch since it is pointless
            if (this.ready.size() > 1) {
                if (this.running != undefined) {
                    this.running.updatePCB();
                    this.ready.add(this.running);
                }

                this.running = this.ready.dequeue();
                this.running.setCPU();
            }
        };

        Kernel.prototype.contextSwitchToKernel = function () {
            //If kernel is already running, just reset the CPU to the kernel PCB
            if (this.running != this.kernelPCB) {
                this.running.updatePCB();

                //Put what was running at the front so it runs after we are done
                this.ready.front(this.running);

                this.running = this.kernelPCB;
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

            return pids;
        };

        Kernel.prototype.runShell = function () {
        };

        Kernel.prototype.kill = function (pid) {
            if (this.running != undefined && this.running.getPid() === pid) {
                _CPU.executing = false;
                this.running = undefined;
                this.memoryManager.deallocate(this.running.getSegment());
                ;
                TSOS.liblos.deallocate(this.running.getSegment());
            } else {
                for (var i = 0; i < this.loaded.length; i++) {
                    console.log(this.loaded[i].getPid());
                    console.log(pid);
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
            this.kernelPCB.setProgramCounter(new TSOS.Short(0x0371));
        };

        Kernel.prototype.shutdown = function () {
            this.krnTrace("begin shutdown OS");
            this.krnTrace("end shutdown OS");
        };

        Kernel.prototype.handleKernelInterrupt = function (interrupt) {
            //If the kernel is not already running, save the current PCB
            //and put it at the front of the ready queue
            if (this.running != this.kernelPCB) {
                this.running.updatePCB();
                this.ready.front(this.running);
                this.running = this.kernelPCB;

                //Add a context switch call to go back to the running process
                //after the kernel is finished
                _KernelInterruptQueue.add(3 /* CONTEXT_SWITCH */);
            }

            switch (interrupt) {
                case 0 /* PUT_STRING */:
                    _CPU.ignoreInterrupts = true;
                    _CPU.returnRegister = _CPU.programCounter;
                    this.kernelPCB.setProgramCounter(new TSOS.Short(0x0308));
                    this.contextSwitchToKernel();
                    break;
                case 1 /* LOAD_PROGRAM */:
                    break;
                case 2 /* CLEAR_SEGMENT */:
                    break;
                case 3 /* CONTEXT_SWITCH */:
                    break;
            }
        };

        Kernel.prototype.programBreak = function () {
        };

        Kernel.prototype.segmentationFault = function () {
        };

        Kernel.prototype.timerInterrupt = function () {
            //Never switch from Kernel Prcoess until it is done
            if (this.running != this.kernelPCB) {
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
                    //I can't figure out the segment so I need the whole address.
                    //Overwrite the accumulator with the base register
                    _CPU.accumulator = new TSOS.Byte(_CPU.lowAddress.getHighByte().asNumber());
                    _CPU.programCounter = new TSOS.Short(0x0342);
                    break;
            }
        };

        Kernel.prototype.krnTimerISR = function () {
            // The built-in TIMER (not clock) Interrupt Service Routine (as opposed to an ISR coming from a device driver). {
            // Check multiprogramming parameters and enforce quanta here. Call the scheduler / context switch here if necessary.
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
