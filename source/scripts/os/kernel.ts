/* ------------
  Kernel.ts

  ------------ */

module TSOS 
{
  
  export class Kernel 
  {
    private ready: Queue;
    private loaded: PCB[];
    private running: PCB;
    private kernelPCB: PCB;

    public memoryManager: MemoryManager;
    private cyclesLeft: number;
    
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
        this.loaded.push(pcb); 
        
        return pcb.getPid();
      }
    }

    public ps(): boolean[]
    {
      var pids = [];
      for(var i: number = 0; i < this.loaded.length; i++)
      {
        pids[this.loaded[i].getPid()] = true; 
      }

      for(var i: number = 0; i < this.ready.q.length; i++)
      {
        pids[this.ready.q[i].getPid()] = true; 
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
      this.setProcessorState(this.ready.dequeue());
    }

    private runShell(): void
    {
      if(_CPU.isExecuting())
      {
        this.ready.front(this.running);
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
        for(var i = 0; i < this.loaded.length; i++)
        {
          console.log(this.loaded[i].getPid());
          console.log(pid);
          if(this.loaded[i].getPid() == pid)  
          {
            this.memoryManager.deallocate(this.loaded[i].getSegment());;
            liblos.deallocate(this.loaded[i].getSegment());
            this.loaded.splice(i, 1);
          }
        }

        for(var i = 0; i < this.ready.q.length; i++)
        {
          if(this.ready.q[i].getPid() == pid)  
          {
            this.memoryManager.deallocate(this.ready.q[i].getSegment());;
            liblos.deallocate(this.ready.q[i].getSegment());
            this.ready.q.splice(i, 1);
          }
        }
      }
    }

    public killAll(): void
    {
      this.running = undefined;
      this.ready = new Queue();
      this.loaded = [];
    }

    public runAll(): void
    {
      for(var i: number = 0; i < this.loaded.length;)
      {
          this.ready.add(this.loaded[i]);
          this.loaded.splice(i, 1);
      }
    }

    public runProgram(pid: number): void
    {
      for(var i: number = 0; i < this.loaded.length; i++)
      {
        if(this.loaded[i].getPid() == pid)
        {
          this.ready.add(this.loaded[i]);
          this.loaded.splice(i, 1);
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
        
        this.ready.add(this.running);
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

    private setIdle()
    {
      this.kernelPCB.setProgramCounter(new Short(0x0371));
    }

    constructor()
    { 
      this.memoryManager = new MemoryManager();

      this.loaded = [];
      this.ready = new Queue();
      this.running = undefined;
      this.cyclesLeft = _Quant;

      //Create a kernel PCB to reserve memory where system call functions are located
      this.kernelPCB = new PCB(this.memoryManager.reserve(3));
      //Set the kernel PCB to the idle process
      this.setIdle();
      
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

    public programBreak(): void
    {
      var save = this.running;
      this.saveProcessorState1();
      liblos.deallocate(save.getSegment());
      this.memoryManager.deallocate(save.getSegment());;
      
      this.print(save);
      Stdio.putStringLn("Program finished");
    }

    public segmentationFault(): void
    {
      var save = this.running;
      this.saveProcessorState1();
      liblos.deallocate(save.getSegment());
      this.memoryManager.deallocate(save.getSegment());;
      
      this.print(save);
      Stdio.putStringLn("Segfault. Program killed");
    }

    public timerInterrupt(): void
    {
      //Never switch from Kernel Prcoess until it is done
      if(this.running != this.kernelPCB)
      {
        //If size is 1, do not do a context switch since it is pointless
        if(this.ready.size() > 1)
        {
          this.running.updatePCB();
          this.ready.add(this.running);
          
          this.running = this.ready.dequeue();
          this.running.setCPU();
        }
      }
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
      Control.hostLog(msg, "OS");
    }

    public krnTrapError(msg) 
    {
      Control.hostLog("OS ERROR - TRAP: " + msg);
      this.shutdown();
    }
  }
}
