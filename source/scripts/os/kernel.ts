/* ------------
  Kernel.ts

  ------------ */

module TSOS 
{
  
  export class Kernel 
  {
    private ready: PCB[];
    private waiting: Queue;
    private running: PCB;
    public memoryManager: MemoryManager;
    private cyclesLeft: number;
    
    public interrupt: boolean;

    public forkExec(): number
    {
      var segment = this.memoryManager.allocate();

      if(segment === undefined)
      {
        return undefined;
      }
      else
      {
        var pcb: PCB = new PCB(segment);
        _KernelInterruptQueue.enqueue(new Interrupt(InterruptType.SYSTEM_CALL, [5, true, segment.lower()]));
        this.ready.push(pcb); 
        
        return pcb.getPid();
      }
    }

    public ps(): boolean[]
    {
      var pids = [];
      for(var i: number = 0; i < this.ready.length; i++)
      {
        pids[this.ready[i].getPid()] = true; 
      }

      for(var i: number = 0; i < this.waiting.q.length; i++)
      {
        pids[this.waiting.q[i].getPid()] = true; 
      }

      if(this.running != undefined)
      {
        pids[this.running.getPid()] = true;
      }

      return pids;
    }
    
    private contextSwitch(): void
    {
      this.saveProcessorState();
      this.setProcessorState(this.waiting.dequeue());
    }

    private runShell(): void
    {
      if(_CPU.isExecuting())
      {
        this.waiting.front(this.running);
      }

      this.saveProcessorState();
    }

    public kill(pid: number): void
    {
      if(this.running != undefined && this.running.getPid() === pid)
      {
        _CPU.executing = false;
        this.running = undefined;
        this.memoryManager.deallocate(this.running.getSegment());;
        liblos.deallocate(this.running.getSegment());
      }
      else
      {
        for(var i = 0; i < this.ready.length; i++)
        {
          console.log(this.ready[i].getPid());
          console.log(pid);
          if(this.ready[i].getPid() == pid)  
          {
            this.memoryManager.deallocate(this.ready[i].getSegment());;
            liblos.deallocate(this.ready[i].getSegment());
            this.ready.splice(i, 1);
          }
        }

        for(var i = 0; i < this.waiting.q.length; i++)
        {
          if(this.waiting.q[i].getPid() == pid)  
          {
            this.memoryManager.deallocate(this.waiting.q[i].getSegment());;
            liblos.deallocate(this.waiting.q[i].getSegment());
            this.waiting.q.splice(i, 1);
          }
        }
      }
    }

    public killAll(): void
    {
      this.running = undefined;
      this.waiting = new Queue();
      this.ready = [];
    }

    public runAll(): void
    {
      for(var i: number = 0; i < this.ready.length;)
      {
          this.waiting.enqueue(this.ready[i]);
          this.ready.splice(i, 1);
      }
    }

    public runProgram(pid: number): void
    {
      for(var i: number = 0; i < this.ready.length; i++)
      {
        if(this.ready[i].getPid() == pid)
        {
          this.waiting.enqueue(this.ready[i]);
          this.ready.splice(i, 1);
        }
      }
    }

    private saveProcessorState()
    {
      if(this.running != undefined)
      {
        this.running.setProgramCounter(_CPU.programCounter);  
        this.running.setAccumulator(_CPU.accumulator);
        this.running.setXRegister(_CPU.xRegister);
        this.running.setYRegister(_CPU.yRegister);
        this.running.setZFlag(_CPU.zFlag);
        this.running.setKernelMode(_CPU.kernelMode);
        
        this.waiting.enqueue(this.running);
        this.print(this.running);
        
        this.running = undefined;
      }
      
      _CPU.executing = false;
    }

    private saveProcessorState1()
    {
      if(this.running != undefined)
      {
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
    }
    private setProcessorState(pcb: PCB): void
    {
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
    }
    
    public print(pcb: PCB): void
    {
      if(pcb.getPid() != 0)
      {
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
        
        (<HTMLInputElement>document.getElementById("pcbBox")).value = print;
      }
    }

    public getRunning(): number
    {
      return this.running.getPid();
    }

    constructor()
    { 
      this.memoryManager = new MemoryManager();

      this.ready = [];
      this.waiting = new Queue();
      this.running = undefined;
      this.cyclesLeft = _Quant;

      //Reserve memory where system call functions are located
      this.waiting.enqueue(new PCB(this.memoryManager.reserve(3)));

      this.interrupt = false;
      
      Control.hostLog("bootstrap", "host");
      
      // Initialize our global queues.
      _KernelInterruptQueue = new Queue();  
      _KernelBuffers = new Array();         
      _KernelInputQueue = new Queue();      
      _StdIn  = _Console;
      _StdOut = _Console;

      this.krnTrace("Loading the keyboard device driver.");
      _krnKeyboardDriver = new DeviceDriverKeyboard();
      _krnKeyboardDriver.driverEntry();
      this.krnTrace(_krnKeyboardDriver.status);

      this.krnTrace("Creating and Launching the shell.");
      _OsShell = new Shell();
      _OsShell.init();
    }

    public shutdown() 
    {
      this.krnTrace("begin shutdown OS");
      this.krnTrace("end shutdown OS");
    }

    public interruptHandler(irq, params) 
    {
      this.interrupt = true;
      this.krnTrace("Handling InterruptType~" + irq);
      switch (irq) 
      {
        case InterruptType.TIMER:
          this.interrupt = true;
          this.krnTimerISR();
          break;
        case InterruptType.KEYBOARD:
          _krnKeyboardDriver.isr(params);
          //Handle all the characters in the queue
          //Multiple can come in at once because of the ANSI control codes
          while(_KernelInputQueue.getSize() > 0) {
            _OsShell.isr(_KernelInputQueue.dequeue());
          }
          this.interrupt = false;
          break;
        case InterruptType.SYSTEM_CALL:
          this.handleSystemCall(params);  
          break;
        case InterruptType.BREAK:
          this.handleBreak(params);  
          break;
        case InterruptType.SEG_FAULT:
          var save = this.running;
          this.saveProcessorState1();
          liblos.deallocate(save.getSegment());
          this.memoryManager.deallocate(save.getSegment());;
          this.interrupt = false;
          this.print(save);
          Stdio.putStringLn("Segfault. Program killed");
          break;
        case InterruptType.INVALID_OP:
          var save = this.running;
          this.saveProcessorState1();
          liblos.deallocate(save.getSegment());
          this.memoryManager.deallocate(save.getSegment());;
          this.interrupt = false;
          this.print(save);
          Stdio.putStringLn("Invalid op. Program killed");
          break;
        case InterruptType.SWITCH:
          this.contextSwitch();
          this.krnTrace("Context switch: " + this.running.getPid());
          this.cyclesLeft = _Quant;
          this.interrupt = false;
          break;
        default:
          this.krnTrapError("Invalid Interrupt Request. irq=" + irq + " params=[" + params + "]");
      }
    }

    private handleSystemCall(params): void
    {
      if(this.running === undefined || params[1] == true)
      {
        this.runShell();
      }

      _CPU.setKernelMode();

      switch(params[0])
      {
        case 1:
          Stdio.putString(params[2].toString());
          this.interrupt = false;
          _CPU.setUserMode();
          break;
        case 2:
          //I can't figure out the segment so I need the whole address.
          //Therefor, I overwrite the accumulator with the base register
          _CPU.accumulator = new Byte(_CPU.lowAddress.getHighByte().asNumber());
          _CPU.programCounter = new Short(0x0342);
          break;
        case 3:
          _CPU.programCounter = new Short(0x0304);
          break;
        case 4:
          _CPU.programCounter = new Short(0x0308);
          break;
        case 5:
          console.log(params[2].getHighByte());
          _Memory.setByte(new Short(0x0323), params[2].getHighByte());
          _CPU.programCounter = new Short(0x0319);
          break;
        case 6:
          _CPU.programCounter = new Short(0x0300);
          break;
        case 7:
          _CPU.accumulator = new Byte(this.memoryManager.getBounds(params[2]).lower().getHighByte().asNumber());
          _CPU.programCounter = new Short(0x035D);
          break;
      }   
    }

    public programBreak(): void
    {
      var save = this.running;
      this.saveProcessorState1();
      liblos.deallocate(save.getSegment());
      this.memoryManager.deallocate(save.getSegment());;
      this.interrupt = false;
      this.print(save);
      Stdio.putStringLn("Program finished");
    }

    public segmentationFault(): void
    {
      var save = this.running;
      this.saveProcessorState1();
      liblos.deallocate(save.getSegment());
      this.memoryManager.deallocate(save.getSegment());;
      this.interrupt = false;
      this.print(save);
      Stdio.putStringLn("Segfault. Program killed");
    }

    public softwareInterrupt(): void
    {
      switch(_CPU.xRegister.asNumber())
      {
        case 1:
          Stdio.putString(_CPU.yRegister.asNumber().toString());
          break;
        case 2:
          //I can't figure out the segment so I need the whole address.
          //Overwrite the accumulator with the base register
          _CPU.accumulator = new Byte(_CPU.lowAddress.getHighByte().asNumber());
          _CPU.programCounter = new Short(0x0342);
          break;
      }   
    }

    private handleBreak(mode): void
    {
      var save = this.running;
      this.saveProcessorState1();
      liblos.deallocate(save.getSegment());
      this.memoryManager.deallocate(save.getSegment());;
      this.interrupt = false;
      this.print(save);
      Stdio.putStringLn("Program finished");
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
