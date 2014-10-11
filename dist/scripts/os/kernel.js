/* ------------
Kernel.ts
------------ */
var TSOS;
(function (TSOS) {
    var Kernel = (function () {
        function Kernel() {
            this.memoryManager = new TSOS.MemoryManager();

            this.ready = [];
            this.waiting = new TSOS.Queue();
            this.running = undefined;

            /*
            * Reserve the segment system calls are stored in.
            * Save this in the PCB used for system calls from the Shell.
            * This has to happen because devices require CPU time to use
            * and since the shell needs to talk to the devices, it needs
            * to be able to execute system calls on the CPU.
            *
            * Must be in kernel mode since we only use this for I/O
            * and all I/O requires kernel mode.
            */
            this.shellPCB = new TSOS.PCB(this.memoryManager.reserve(3));
            this.shellPCB.setKernelMode(true);

            this.interrupt = false;

            TSOS.Control.hostLog("bootstrap", "host");

            // Initialize our global queues.
            _KernelInterruptQueue = new TSOS.Queue();
            _KernelBuffers = new Array();
            _KernelInputQueue = new TSOS.Queue();
            _StdIn = _Console;
            _StdOut = _Console;

            // Load the Keyboard Device Driver
            this.krnTrace("Loading the keyboard device driver.");
            _krnKeyboardDriver = new TSOS.DeviceDriverKeyboard(); // Construct it.
            _krnKeyboardDriver.driverEntry(); // Call the driverEntry() initialization routine.
            this.krnTrace(_krnKeyboardDriver.status);

            this.krnTrace("Enabling the interrupts.");
            this.enableInterrupts();

            this.krnTrace("Creating and Launching the shell.");
            _OsShell = new TSOS.Shell();
            _OsShell.init();
            // Finally, initiate testing.
            //_GLaDOS.afterStartup();
        }
        Kernel.prototype.forkExec = function () {
            var pcb = new TSOS.PCB(this.memoryManager.allocate());
            this.ready.push(pcb);

            return pcb.getPid();
        };

        Kernel.prototype.contextSwitch = function (pid) {
            if (!_CPU.isExecuting()) {
                this.saveProcessorState();
                this.setProcessorState(pid);
            } else if (this.shellPCB.getPid() == pid) {
                if (_CPU.isExecuting()) {
                    this.waiting.enqueue(this.running);
                }

                this.saveProcessorState();
                this.setProcessorState(pid);
            } else {
                for (var i = 0; i < this.ready.length; i++) {
                    if (this.ready[i].getPid() == pid) {
                        this.waiting.enqueue(this.ready[i]);
                        this.ready.splice(i, 1);
                    }
                }
            }
        };

        Kernel.prototype.runProgram = function (pid) {
            this.contextSwitch(pid);
        };

        Kernel.prototype.saveProcessorState = function () {
            if (this.running != undefined) {
                this.running.setProgramCounter(_CPU.programCounter);
                this.running.setAccumulator(_CPU.accumulator);
                this.running.setXRegister(_CPU.xRegister);
                this.running.setYRegister(_CPU.yRegister);
                this.running.setZFlag(_CPU.zFlag);
                this.running.setKernelMode(_CPU.kernelMode);

                if (this.running.getPid() != this.shellPCB.getPid()) {
                    this.ready.push(this.running);
                }

                this.running = undefined;
            }

            _CPU.executing = false;
        };

        Kernel.prototype.setProcessorState = function (pid) {
            if (pid == this.shellPCB.getPid()) {
                this.running = this.shellPCB;
            } else {
                for (var i = 0; i < this.ready.length; i++) {
                    if (this.ready[i].getPid() == pid) {
                        this.running = this.ready[i];
                        this.ready.splice(i, 1);
                    }
                }
            }

            _CPU.programCounter = this.running.getProgramCounter();
            _CPU.accumulator = this.running.getAccumulator();
            _CPU.xRegister = this.running.getXRegister();
            _CPU.yRegister = this.running.getYRegister();
            _CPU.zFlag = this.running.getZFlag();
            _CPU.kernelMode = this.running.getKernelMode();
            _CPU.lowAddress = this.running.getLowAddress();
            _CPU.highAddress = this.running.getHighAddress();
            _CPU.executing = true;
        };

        Kernel.prototype.getRunning = function () {
            return this.running.getPid();
        };

        Kernel.prototype.getShellPid = function () {
            return this.shellPCB.getPid();
        };

        Kernel.prototype.shutdown = function () {
            this.krnTrace("begin shutdown OS");
            this.krnTrace("Disabling the interrupts.");
            this.disableInterrupts();
            this.krnTrace("end shutdown OS");
        };

        Kernel.prototype.clockTick = function () {
            if (execute) {
                singleStep = true;
            }

            if (_KernelInterruptQueue.getSize() > 0 && !this.interrupt) {
                var interrupt = _KernelInterruptQueue.dequeue();
                this.interruptHandler(interrupt.type(), interrupt.parameters());
            } else if (_CPU.isExecuting()) {
                if (singleStep) {
                    _CPU.cycle();
                    singleStep = false;
                }
            } else if (this.waiting.getSize() > 0) {
                this.contextSwitch(this.waiting.dequeue().getPid());
            } else {
                this.krnTrace("Idle");
            }
        };

        Kernel.prototype.enableInterrupts = function () {
            TSOS.Devices.hostEnableKeyboardInterrupt();
        };

        Kernel.prototype.disableInterrupts = function () {
            TSOS.Devices.hostDisableKeyboardInterrupt();
        };

        Kernel.prototype.interruptHandler = function (irq, params) {
            this.interrupt = true;
            this.krnTrace("Handling InterruptType~" + irq);
            switch (irq) {
                case 0 /* TIMER */:
                    this.interrupt = true;
                    this.krnTimerISR();
                    break;
                case 1 /* KEYBOARD */:
                    _krnKeyboardDriver.isr(params);

                    while (_KernelInputQueue.getSize() > 0) {
                        _OsShell.isr(_KernelInputQueue.dequeue());
                    }
                    this.interrupt = false;
                    break;
                case 2 /* SYSTEM_CALL */:
                    this.handleSystemCall(params);
                    break;
                case 3 /* BREAK */:
                    this.handleBreak(params);
                    break;
                case 4 /* RETURN */:
                    this.handleReturn(params);
                    break;
                default:
                    this.krnTrapError("Invalid Interrupt Request. irq=" + irq + " params=[" + params + "]");
            }
        };

        Kernel.prototype.handleReturn = function (address) {
            if (this.running.getPid() === this.shellPCB.getPid()) {
                this.saveProcessorState();
            } else {
                _CPU.programCounter = address;
            }

            _CPU.setUserMode();
            this.interrupt = false;
        };

        Kernel.prototype.handleSystemCall = function (params) {
            if (this.running === undefined || params[1] == true) {
                this.contextSwitch(this.shellPCB.getPid());
            }

            _CPU.setKernelMode();

            switch (params[0]) {
                case 1:
                    TSOS.Stdio.putString(params[2].toString());
                    this.interrupt = false;
                    break;
                case 2:
                    break;
                case 3:
                    _CPU.programCounter = new TSOS.Short(0x0304);
                    break;
                case 4:
                    _CPU.programCounter = new TSOS.Short(0x0308);
                    break;
                case 5:
                    _CPU.programCounter = new TSOS.Short(0x0319);
                    break;
                case 6:
                    _CPU.programCounter = new TSOS.Short(0x0300);
                    break;
            }
        };

        Kernel.prototype.handleBreak = function (mode) {
            _CPU.executing = false;
            this.interrupt = false;
        };

        Kernel.prototype.krnTimerISR = function () {
            // The built-in TIMER (not clock) Interrupt Service Routine (as opposed to an ISR coming from a device driver). {
            // Check multiprogramming parameters and enforce quanta here. Call the scheduler / context switch here if necessary.
        };

        Kernel.prototype.krnTrace = function (msg) {
            if (_Trace) {
                if (msg === "Idle") {
                    if (_OSclock % 10 == 0) {
                        TSOS.Control.hostLog(msg, "OS");
                    }
                } else {
                    TSOS.Control.hostLog(msg, "OS");
                }
            }
        };

        Kernel.prototype.krnTrapError = function (msg) {
            TSOS.Control.hostLog("OS ERROR - TRAP: " + msg);
            this.shutdown();
        };
        return Kernel;
    })();
    TSOS.Kernel = Kernel;
})(TSOS || (TSOS = {}));
