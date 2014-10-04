/* ------------
  Kernel.ts

  ------------ */

module TSOS {

  export class Kernel {

    public static TIMER_IRQ:       number  = 0;
    public static KEYBOARD_IRQ:    number  = 1;
    public static TERMINAL_IRQ:    number  = 2;
    public static SYSTEM_CALL_IQR: number  = 3;
    public static BREAK_IQR:       number  = 4;
    public static RETURN_IQR:       number  = 5;


    private ready: PCB[];
    private running: PCB;
    private waiting: PCB[];
    private memoryManager: MemoryManager;
    public interrupt: boolean;

    //
    // OS Startup and Shutdown Routines
    //
    public krnBootstrap() {      // Page 8. {
      Control.hostLog("bootstrap", "host");  // Use hostLog because we ALWAYS want this, even if _Trace is off.
      
      this.memoryManager = new MemoryManager();
      this.interrupt = false;
      this.ready = [];
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
      console.log(this.interrupt);
      if (_KernelInterruptQueue.getSize() > 0 && !this.interrupt) 
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
      this.interrupt = true;
      this.krnTrace("Handling IRQ~" + irq);
      console.log("INTERUPTTT: " + irq);
      switch (irq) {
        case Kernel.TIMER_IRQ:
          this.interrupt = true;
          this.krnTimerISR();
          break;
        case Kernel.KEYBOARD_IRQ:
          _krnKeyboardDriver.isr(params);
          //Handle all the characters in the queue
          //Multiple can come in at once because of the ANSI control codes
          while(_KernelInputQueue.getSize() > 0) {
            _OsShell.isr(_KernelInputQueue.dequeue());
          }
          this.interrupt = false;
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
    }
    
    private handleReturn(address)
    {
      if(_CPU.returnRegister != undefined)
      {
        _CPU.programCounter = address;
      }
      else
      {
        _CPU.executing = false;
      }

      this.interrupt = false;
    }

    private handleSystemCall(call): void
    {
      if(!_CPU.isExecuting())
      {
        _CPU.executing = true;
      }
      
      switch(call)
      {
        case 1:
          break;
        case 2:
          _CPU.programCounter = new Short(0x0300);
          break;
        case 3:
          _CPU.programCounter = new Short(0x0304);
          break;
        case 4:
          _CPU.returnRegister = undefined;
          _CPU.programCounter = new Short(0x0308);
          break;
      }   
    }

    private handleBreak(mode): void
    {
      //If in kernel mode, return to caller
      if(mode === true)
      {
        _CPU.setUserMode();
        _CPU.programCounter = _CPU.returnRegister; 
      }
      else
      {
        _CPU.executing = false;
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
      this.krnShutdown();
    }
  }
}
