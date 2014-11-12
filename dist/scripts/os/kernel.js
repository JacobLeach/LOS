/* ------------
Kernel.ts
------------ */
var TSOS;
(function (TSOS) {
    var Kernel = (function () {
        function Kernel() {
            this.memoryManager = new TSOS.MemoryManager();

            this.loaded = [];
            this.ready = new TSOS.Queue();
            this.running = undefined;
            this.cyclesLeft = _Quant;

            //Create a kernel PCB to reserve memory where system call functions are located
            this.kernelPCB = new TSOS.PCB(this.memoryManager.reserve(3));

            //Set the kernel PCB to the idle process
            this.setIdle();

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
            this.krnTrace(_krnKeyboardDriver.status);

            this.krnTrace("Creating and Launching the shell.");
            _OsShell = new TSOS.Shell();
            _OsShell.init();
        }
        Kernel.prototype.forkExec = function () {
            var segment = this.memoryManager.allocate();

            if (segment === undefined) {
                return undefined;
            } else {
                var pcb = new TSOS.PCB(segment);
                _KernelInterruptQueue.enqueue(new TSOS.Interrupt(2 /* SYSTEM_CALL */, [5, true, segment.lower()]));
                this.loaded.push(pcb);

                return pcb.getPid();
            }
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

        Kernel.prototype.contextSwitch = function () {
            this.saveProcessorState();
            this.setProcessorState(this.ready.dequeue());
        };

        Kernel.prototype.runShell = function () {
            if (_CPU.isExecuting()) {
                this.ready.front(this.running);
            }

            this.saveProcessorState();
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

        Kernel.prototype.saveProcessorState = function () {
            if (this.running != undefined) {
                this.running.setProgramCounter(_CPU.programCounter);
                this.running.setAccumulator(_CPU.accumulator);
                this.running.setXRegister(_CPU.xRegister);
                this.running.setYRegister(_CPU.yRegister);
                this.running.setZFlag(_CPU.zFlag);
                this.running.setKernelMode(_CPU.kernelMode);

                this.ready.add(this.running);
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

                this.print(this.running);

                this.running = undefined;
            }

            _CPU.executing = false;
        };
        Kernel.prototype.setProcessorState = function (pcb) {
            this.running = pcb;

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

        Kernel.prototype.setIdle = function () {
            this.kernelPCB.setProgramCounter(new TSOS.Short(0x0371));
        };

        Kernel.prototype.shutdown = function () {
            this.krnTrace("begin shutdown OS");
            this.krnTrace("end shutdown OS");
        };

        Kernel.prototype.programBreak = function () {
            var save = this.running;
            this.saveProcessorState1();
            TSOS.liblos.deallocate(save.getSegment());
            this.memoryManager.deallocate(save.getSegment());
            ;

            this.print(save);
            TSOS.Stdio.putStringLn("Program finished");
        };

        Kernel.prototype.segmentationFault = function () {
            var save = this.running;
            this.saveProcessorState1();
            TSOS.liblos.deallocate(save.getSegment());
            this.memoryManager.deallocate(save.getSegment());
            ;

            this.print(save);
            TSOS.Stdio.putStringLn("Segfault. Program killed");
        };

        Kernel.prototype.timerInterrupt = function () {
            //Never switch from Kernel Prcoess until it is done
            if (this.running != this.kernelPCB) {
                //If size is 1, do not do a context switch since it is pointless
                if (this.ready.size() > 1) {
                    this.running.updatePCB();
                    this.ready.add(this.running);

                    this.running = this.ready.dequeue();
                    this.running.setCPU();
                }
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

        Kernel.prototype.handleBreak = function (mode) {
            var save = this.running;
            this.saveProcessorState1();
            TSOS.liblos.deallocate(save.getSegment());
            this.memoryManager.deallocate(save.getSegment());
            ;

            this.print(save);
            TSOS.Stdio.putStringLn("Program finished");
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
