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
            this.cyclesLeft = _Quant;

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
            var segment = this.memoryManager.allocate();

            if (segment === undefined) {
                return undefined;
            } else {
                var pcb = new TSOS.PCB(segment);
                _KernelInterruptQueue.enqueue(new TSOS.Interrupt(2 /* SYSTEM_CALL */, [5, true, segment.lower()]));
                this.ready.push(pcb);

                return pcb.getPid();
            }
        };

        Kernel.prototype.ps = function () {
            var pids = [];
            for (var i = 0; i < this.ready.length; i++) {
                pids[this.ready[i].getPid()] = true;
            }

            for (var i = 0; i < this.waiting.q.length; i++) {
                pids[this.waiting.q[i].getPid()] = true;
            }

            if (this.running != undefined) {
                pids[this.running.getPid()] = true;
            }

            return pids;
        };

        Kernel.prototype.contextSwitch = function () {
            this.saveProcessorState();
            this.setProcessorState(this.waiting.dequeue());
        };

        Kernel.prototype.runShell = function () {
            if (_CPU.isExecuting()) {
                this.waiting.front(this.running);
            }

            this.saveProcessorState();
            this.setProcessorState(this.shellPCB);
        };

        Kernel.prototype.kill = function (pid) {
            if (this.running != undefined && this.running.getPid() === pid) {
                _CPU.executing = false;
                this.running = undefined;
            } else {
                for (var i = 0; i < this.ready.length; i++) {
                    console.log(this.ready[i].getPid());
                    console.log(pid);
                    if (this.ready[i].getPid() == pid) {
                        this.memoryManager.deallocate(this.ready[i].getSegment());
                        ;
                        TSOS.liblos.deallocate(this.ready[i].getSegment());
                        this.ready.splice(i, 1);
                    }
                }

                for (var i = 0; i < this.waiting.q.length; i++) {
                    if (this.waiting.q[i].getPid() == pid) {
                        this.memoryManager.deallocate(this.waiting.q[i].getSegment());
                        ;
                        TSOS.liblos.deallocate(this.waiting.q[i].getSegment());
                        this.waiting.q.splice(i, 1);
                    }
                }
            }
        };

        Kernel.prototype.killAll = function () {
            this.running = undefined;
            this.waiting = new TSOS.Queue();
            this.ready = [];
        };

        Kernel.prototype.runAll = function () {
            for (var i = 0; i < this.ready.length;) {
                this.waiting.enqueue(this.ready[i]);
                this.ready.splice(i, 1);
            }
        };

        Kernel.prototype.runProgram = function (pid) {
            for (var i = 0; i < this.ready.length; i++) {
                if (this.ready[i].getPid() == pid) {
                    this.waiting.enqueue(this.ready[i]);
                    this.ready.splice(i, 1);
                }
            }
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
                    this.waiting.enqueue(this.running);
                }
                this.print(this.running);

                this.running = undefined;
            }

            _CPU.executing = false;
        };

        Kernel.prototype.saveProcessorState1 = function () {
            if (this.running != undefined) {
                this.running.setProgramCounter(_CPU.programCounter);
                this.running.setAccumulator(_CPU.accumulator);
                this.running.setXRegister(_CPU.xRegister);
                this.running.setYRegister(_CPU.yRegister);
                this.running.setZFlag(_CPU.zFlag);
                this.running.setKernelMode(_CPU.kernelMode);

                if (this.running.getPid() != this.shellPCB.getPid()) {
                }
                this.print(this.running);

                this.running = undefined;
            }

            _CPU.executing = false;
        };
        Kernel.prototype.setProcessorState = function (pcb) {
            if (pcb.getPid() == this.shellPCB.getPid()) {
                this.running = this.shellPCB;
            } else {
                this.running = pcb;
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

            this.print(this.running);
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

                    if (!this.interrupt && this.running.getPid() != this.shellPCB.getPid()) {
                        this.cyclesLeft--;
                        console.log("HEAD: " + this.cyclesLeft);
                    }
                }
            } else if (this.waiting.getSize() > 0) {
                this.contextSwitch();
                this.cyclesLeft = _Quant;
            } else {
                this.krnTrace("Idle");
            }

            if (this.cyclesLeft === 0 && this.waiting.getSize() > 0) {
                console.log("JOB");
                this.contextSwitch();
                this.cyclesLeft = _Quant;
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
                case 5 /* SEG_FAULT */:
                    var save = this.running;
                    this.saveProcessorState1();
                    TSOS.liblos.deallocate(save.getSegment());
                    this.memoryManager.deallocate(save.getSegment());
                    ;
                    this.interrupt = false;
                    this.print(save);
                    TSOS.Stdio.putStringLn("Segfault. Program killed");
                    break;
                case 6 /* INVALID_OP */:
                    var save = this.running;
                    this.saveProcessorState1();
                    TSOS.liblos.deallocate(save.getSegment());
                    this.memoryManager.deallocate(save.getSegment());
                    ;
                    this.interrupt = false;
                    this.print(save);
                    TSOS.Stdio.putStringLn("Invalid op. Program killed");
                    break;
                default:
                    this.krnTrapError("Invalid Interrupt Request. irq=" + irq + " params=[" + params + "]");
            }
        };

        Kernel.prototype.handleReturn = function (address) {
            if (this.running.getPid() === this.shellPCB.getPid()) {
                this.saveProcessorState();
            } else {
                console.log("FUYCK YOU");
                _CPU.programCounter = address;
            }

            _CPU.setUserMode();
            this.interrupt = false;
        };

        Kernel.prototype.handleSystemCall = function (params) {
            if (this.running === undefined || params[1] == true) {
                this.runShell();
            }

            _CPU.setKernelMode();

            switch (params[0]) {
                case 1:
                    TSOS.Stdio.putString(params[2].toString());
                    this.interrupt = false;
                    _CPU.setUserMode();
                    break;
                case 2:
                    //I can't figure out the segment so I need the whole address.
                    //Therefor, I overwrite the accumulator with the base register
                    _CPU.accumulator = new TSOS.Byte(_CPU.lowAddress.getHighByte().asNumber());
                    _CPU.programCounter = new TSOS.Short(0x0342);
                    break;
                case 3:
                    _CPU.programCounter = new TSOS.Short(0x0304);
                    break;
                case 4:
                    _CPU.programCounter = new TSOS.Short(0x0308);
                    break;
                case 5:
                    console.log(params[2].getHighByte());
                    _Memory.setByte(new TSOS.Short(0x0323), params[2].getHighByte());
                    _CPU.programCounter = new TSOS.Short(0x0319);
                    break;
                case 6:
                    _CPU.programCounter = new TSOS.Short(0x0300);
                    break;
                case 7:
                    _CPU.accumulator = new TSOS.Byte(this.memoryManager.getBounds(params[2]).lower().getHighByte().asNumber());
                    _CPU.programCounter = new TSOS.Short(0x035D);
                    break;
            }
        };

        Kernel.prototype.handleBreak = function (mode) {
            var save = this.running;
            this.saveProcessorState1();
            TSOS.liblos.deallocate(save.getSegment());
            this.memoryManager.deallocate(save.getSegment());
            ;
            this.interrupt = false;
            this.print(save);
            TSOS.Stdio.putStringLn("Program finished");
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
