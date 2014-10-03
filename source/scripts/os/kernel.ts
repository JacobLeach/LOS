/* ------------
  Kernel.ts

  ------------ */

module TSOS {

  export class Kernel {

    public static TIMER_IRQ:       number  = 0;
    public static KEYBOARD_IRQ:    number  = 1;
    public static TERMINAL_IRQ:    number  = 2;
    public static SYSTEM_CALL_IQR: number  = 3;

    private readyQueue: PCB[];
    private running: PCB;
    private waiting: PCB[];

    //
    // OS Startup and Shutdown Routines
    //
    public krnBootstrap() {      // Page 8. {
      Control.hostLog("bootstrap", "host");  // Use hostLog because we ALWAYS want this, even if _Trace is off.

      this.readyQueue = [];
      this.waiting = [];

      // Initialize our global queues.
      _KernelInterruptQueue = new Queue();  // A (currently) non-priority queue for interrupt requests (IRQs).
      _KernelBuffers = new Array();         // Buffers... for the kernel.
      _KernelInputQueue = new Queue();      // Where device input lands before being processed out somewhere.
      _Console = new Terminal(_Canvas);          // The command line interface / console I/O device.

      // Initialize standard input and output to the _Console.
      _StdIn  = _Console;
      _StdOut = _Console;

      // Load the Keyboard Device Driver
      this.krnTrace("Loading the keyboard device driver.");
      _krnKeyboardDriver = new DeviceDriverKeyboard();     // Construct it.
      _krnKeyboardDriver.driverEntry();                    // Call the driverEntry() initialization routine.
      this.krnTrace(_krnKeyboardDriver.status);

      this.krnTrace("Enabling the interrupts.");
      this.krnEnableInterrupts();

      this.krnTrace("Creating and Launching the shell.");
      _OsShell = new Shell();
      _OsShell.init();

      // Finally, initiate testing.
      //_GLaDOS.afterStartup();
    }

    public krnShutdown() {
      this.krnTrace("begin shutdown OS");
      this.krnTrace("Disabling the interrupts.");
      this.krnDisableInterrupts();
      this.krnTrace("end shutdown OS");
    }


    public krnOnCPUClockPulse() 
    {
      if (_KernelInterruptQueue.getSize() > 0) 
      {
        var interrupt = _KernelInterruptQueue.dequeue();
        this.krnInterruptHandler(interrupt.irq, interrupt.params);
      } 
      else if (_CPU.isExecuting()) 
      { 
        _CPU.cycle();
      } 
      else 
      {                      
        this.krnTrace("Idle");
      }
    }


    //
    // Interrupt Handling
    //
    public krnEnableInterrupts() {
      // Keyboard
      Devices.hostEnableKeyboardInterrupt();
      // Put more here.
    }

    public krnDisableInterrupts() {
      // Keyboard
      Devices.hostDisableKeyboardInterrupt();
      // Put more here.
    }

    public krnInterruptHandler(irq, params) {
      this.krnTrace("Handling IRQ~" + irq);

      switch (irq) {
        case Kernel.TIMER_IRQ:
          this.krnTimerISR();
          break;
        case Kernel.KEYBOARD_IRQ:
          _krnKeyboardDriver.isr(params);
          //Handle all the characters in the queue
          //Multiple can come in at once because of the ANSI control codes
          while(_KernelInputQueue.getSize() > 0) {
            _OsShell.isr(_KernelInputQueue.dequeue());
          }
          break;
        case Kernel.SYSTEM_CALL_IQR:
          this.handleSystemCall();  
          break;
        default:
          this.krnTrapError("Invalid Interrupt Request. irq=" + irq + " params=[" + params + "]");
      }
    }
    
    private handleSystemCall(): void
    {
      if(_CPU.isExecuting())
      {
        this.saveState(this.running); 
      }

      //Give us all the power!
      _CPU.setKernelMode();

      //X Register tells us what system call the program wants
      switch(_CPU.xRegister.asNumber())
      {
        case 1:
          break;
        case 2:
          _CPU.programCounter = new Short(0x0300);
          break;
      }   
    }

    private saveState(pcb: PCB): void
    {
      pcb.setState(_CPU.programCounter, 
                   _CPU.accumulator, 
                   _CPU.xRegister, 
                   _CPU.yRegister, 
                   _CPU.zFlag, 
                   _CPU.kernelMode,
                   _CPU.lowAddress,
                   _CPU.highAddress);
    }

    public krnTimerISR() {
      // The built-in TIMER (not clock) Interrupt Service Routine (as opposed to an ISR coming from a device driver). {
      // Check multiprogramming parameters and enforce quanta here. Call the scheduler / context switch here if necessary.
    }

    public krnTrace(msg: string) {
      if (_Trace) {
        if (msg === "Idle") {
          if (_OSclock % 10 == 0) {
            Control.hostLog(msg, "OS");
          }
        } 
        else {
         Control.hostLog(msg, "OS");
        }
      }
    }

    public krnTrapError(msg) {
      Control.hostLog("OS ERROR - TRAP: " + msg);
      _Console.bluescreen();
      _Console.writeWhiteText(msg);
      this.krnShutdown();
    }
  }
}
