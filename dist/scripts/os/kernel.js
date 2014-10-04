/* ------------
Kernel.ts
------------ */
var TSOS;
(function (TSOS) {
    var Kernel = (function () {
        function Kernel() {
        }
        //
        // OS Startup and Shutdown Routines
        //
        Kernel.prototype.krnBootstrap = function () {
            TSOS.Control.hostLog("bootstrap", "host"); // Use hostLog because we ALWAYS want this, even if _Trace is off.

            this.memoryManager = new TSOS.MemoryManager();
            this.interrupt = false;
            this.ready = [];
            this.waiting = [];

            // Initialize our global queues.
            _KernelInterruptQueue = new TSOS.Queue(); // A (currently) non-priority queue for interrupt requests (IRQs).
            _KernelBuffers = new Array(); // Buffers... for the kernel.
            _KernelInputQueue = new TSOS.Queue(); // Where device input lands before being processed out somewhere.
            _Console = new TSOS.Terminal(_Canvas); // The command line interface / console I/O device.

            // Initialize standard input and output to the _Console.
            _StdIn = _Console;
            _StdOut = _Console;

            // Load the Keyboard Device Driver
            this.krnTrace("Loading the keyboard device driver.");
            _krnKeyboardDriver = new TSOS.DeviceDriverKeyboard(); // Construct it.
            _krnKeyboardDriver.driverEntry(); // Call the driverEntry() initialization routine.
            this.krnTrace(_krnKeyboardDriver.status);

            this.krnTrace("Enabling the interrupts.");
            this.krnEnableInterrupts();

            this.krnTrace("Creating and Launching the shell.");
            _OsShell = new TSOS.Shell();
            _OsShell.init();
            // Finally, initiate testing.
            //_GLaDOS.afterStartup();
        };

        Kernel.prototype.krnShutdown = function () {
            this.krnTrace("begin shutdown OS");
            this.krnTrace("Disabling the interrupts.");
            this.krnDisableInterrupts();
            this.krnTrace("end shutdown OS");
        };

        Kernel.prototype.krnOnCPUClockPulse = function () {
            if (_KernelInterruptQueue.getSize() > 0 && !this.interrupt) {
                var interrupt = _KernelInterruptQueue.dequeue();
                this.krnInterruptHandler(interrupt.irq, interrupt.params);
            } else if (_CPU.isExecuting()) {
                _CPU.cycle();
            } else {
                this.krnTrace("Idle");
            }
        };

        //
        // Interrupt Handling
        //
        Kernel.prototype.krnEnableInterrupts = function () {
            // Keyboard
            TSOS.Devices.hostEnableKeyboardInterrupt();
            // Put more here.
        };

        Kernel.prototype.krnDisableInterrupts = function () {
            // Keyboard
            TSOS.Devices.hostDisableKeyboardInterrupt();
            // Put more here.
        };

        Kernel.prototype.krnInterruptHandler = function (irq, params) {
            this.interrupt = true;
            this.krnTrace("Handling IRQ~" + irq);
            console.log("INTERUPTTT: " + irq);
            switch (irq) {
                case Kernel.TIMER_IRQ:
                    this.krnTimerISR();
                    break;
                case Kernel.KEYBOARD_IRQ:
                    _krnKeyboardDriver.isr(params);

                    while (_KernelInputQueue.getSize() > 0) {
                        _OsShell.isr(_KernelInputQueue.dequeue());
                    }
                    break;
                case Kernel.SYSTEM_CALL_IQR:
                    this.handleSystemCall(params);
                    break;
                case Kernel.BREAK_IQR:
                    this.handleBreak(params);
                    break;
                case Kernel.RETURN_IQR:
                    this.handleReturn(params);
                    break;
                default:
                    this.krnTrapError("Invalid Interrupt Request. irq=" + irq + " params=[" + params + "]");
            }
        };

        Kernel.prototype.handleReturn = function (address) {
            console.log("GETY");
            if (_CPU.returnRegister != undefined) {
                _CPU.programCounter = address;
            } else {
                _CPU.executing = false;
            }
        };

        Kernel.prototype.handleSystemCall = function (call) {
            if (!_CPU.isExecuting()) {
                _CPU.executing = true;
            }

            switch (call) {
                case 1:
                    break;
                case 2:
                    _CPU.programCounter = new TSOS.Short(0x0300);
                    break;
                case 3:
                    _CPU.programCounter = new TSOS.Short(0x0304);
                    break;
                case 4:
                    _CPU.returnRegister = undefined;
                    _CPU.programCounter = new TSOS.Short(0x0308);
                    break;
            }
        };

        Kernel.prototype.handleBreak = function (mode) {
            //If in kernel mode, return to caller
            if (mode === true) {
                _CPU.setUserMode();
                _CPU.programCounter = _CPU.returnRegister;
            } else {
                _CPU.executing = false;
            }
        };
        Kernel.prototype.saveState = function (pcb) {
            pcb.setState(_CPU.programCounter, _CPU.accumulator, _CPU.xRegister, _CPU.yRegister, _CPU.zFlag, _CPU.kernelMode, _CPU.lowAddress, _CPU.highAddress);
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
            this.krnShutdown();
        };
        Kernel.TIMER_IRQ = 0;
        Kernel.KEYBOARD_IRQ = 1;
        Kernel.TERMINAL_IRQ = 2;
        Kernel.SYSTEM_CALL_IQR = 3;
        Kernel.BREAK_IQR = 4;
        Kernel.RETURN_IQR = 5;
        return Kernel;
    })();
    TSOS.Kernel = Kernel;
})(TSOS || (TSOS = {}));
