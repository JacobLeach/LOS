/* ------------
  Kernel.ts

  ------------ */

module TSOS 
{
  
  export enum IRQ
  {
    TIMER,
    KEYBOARD,
    SYSTEM_CALL,
    BREAK,
    RETURN
  }
  
  export class Kernel 
  {
    private ready: PCB[];
    private running: PCB;
    private shellPCB: PCB;
    private memoryManager: MemoryManager;
    public interrupt: boolean;

    private contextSwitch(pid: number): void
    {
      this.running.setProgramCounter(_CPU.programCounter);  
      this.running.setAccumulator(_CPU.accumulator);
      this.running.setXRegister(_CPU.xRegister);
      this.running.setYRegister(_CPU.yRegister);
      this.running.setZFlag(_CPU.zFlag);
      this.running.setKernelMode(_CPU.kernelMode);

      this.ready.push(this.running);
      
      if(pid === this.shellPCB.getPid())
      {
        this.running = this.shellPCB;
      }
      else
      {
        for(var i: number = 0; i < this.ready.length; i++)
        {
          if(this.ready[i].getPid() === pid)
          {
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
    }

    public getRunning(): number
    {
      return this.running.getPid();
    }

    public getShellPid(): number
    {
      return this.shellPCB.getPid();
    }

    constructor()
    { 
      this.memoryManager = new MemoryManager();

      this.ready = [];
      this.running = undefined;

      /*
       * Reserve the segment system calls are stored in.
       * Save this in the PCB used for system calls from the Shell.
       * This has to happen because devices require CPU time to use
       * and since the shell needs to talk to the devices, it needs
       * to be able to execute system calls on the CPU.
       */
      this.shellPCB = new PCB(this.memoryManager.reserve(3));

      this.interrupt = false;
      
      Control.hostLog("bootstrap", "host");
      
      // Initialize our global queues.
      _KernelInterruptQueue = new Queue();  
      _KernelBuffers = new Array();         
      _KernelInputQueue = new Queue();      
      _Console = new Terminal(_Canvas);     
      _StdIn  = _Console;
      _StdOut = _Console;

      // Load the Keyboard Device Driver
      this.krnTrace("Loading the keyboard device driver.");
      _krnKeyboardDriver = new DeviceDriverKeyboard();     // Construct it.
      _krnKeyboardDriver.driverEntry();                    // Call the driverEntry() initialization routine.
      this.krnTrace(_krnKeyboardDriver.status);

      this.krnTrace("Enabling the interrupts.");
      this.enableInterrupts();

      this.krnTrace("Creating and Launching the shell.");
      _OsShell = new Shell();
      _OsShell.init();

      // Finally, initiate testing.
      //_GLaDOS.afterStartup();
    }

    public shutdown() 
    {
      this.krnTrace("begin shutdown OS");
      this.krnTrace("Disabling the interrupts.");
      this.disableInterrupts();
      this.krnTrace("end shutdown OS");
    }


    public clockTick() 
    {
      if (_KernelInterruptQueue.getSize() > 0 && !this.interrupt) 
      {
        var interrupt = _KernelInterruptQueue.dequeue();
        this.interruptHandler(interrupt.irq, interrupt.params);
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

    public enableInterrupts() 
    {
      Devices.hostEnableKeyboardInterrupt();
    }

    public disableInterrupts() 
    {
      Devices.hostDisableKeyboardInterrupt();
    }

    public interruptHandler(irq, params) 
    {
      this.interrupt = true;
      this.krnTrace("Handling IRQ~" + irq);
      switch (irq) 
      {
        case IRQ.TIMER:
          this.interrupt = true;
          this.krnTimerISR();
          break;
        case IRQ.KEYBOARD:
          _krnKeyboardDriver.isr(params);
          //Handle all the characters in the queue
          //Multiple can come in at once because of the ANSI control codes
          while(_KernelInputQueue.getSize() > 0) {
            _OsShell.isr(_KernelInputQueue.dequeue());
          }
          this.interrupt = false;
          break;
        case IRQ.SYSTEM_CALL:
          this.handleSystemCall(params);  
          break;
        case IRQ.BREAK:
          this.handleBreak(params);  
          break;
        case IRQ.RETURN:
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

    public krnTimerISR() 
    {
      // The built-in TIMER (not clock) Interrupt Service Routine (as opposed to an ISR coming from a device driver). {
      // Check multiprogramming parameters and enforce quanta here. Call the scheduler / context switch here if necessary.
    }

    public krnTrace(msg: string) 
    {
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

    public krnTrapError(msg) 
    {
      Control.hostLog("OS ERROR - TRAP: " + msg);
      this.shutdown();
    }
  }
}
