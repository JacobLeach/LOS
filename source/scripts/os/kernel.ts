/* ------------
  Kernel.ts

  ------------ */

module TSOS 
{
  export enum IO
  {
    PUT_STRING,
    LOAD_PROGRAM,
    CLEAR_SEGMENT,
    CONTEXT_SWITCH
  }

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
      return 0;
    }

    //Switches context to the next PCB in the ready queue
    private contextSwitchToNext(): void
    {
      //If size is 1, do not do a context switch since it is pointless
      if(this.ready.size() > 1)
      {
        if(this.running != undefined)
        {
          this.running.updatePCB();
          this.ready.add(this.running);
        }
        
        this.running = this.ready.dequeue();
        this.running.setCPU();
      }
    }

    private contextSwitchToKernel(): void
    {
      //If kernel is already running, just reset the CPU to the kernel PCB
      if(this.running != this.kernelPCB)
      {
        this.running.updatePCB();
        //Put what was running at the front so it runs after we are done
        this.ready.front(this.running);
      
        this.running = this.kernelPCB;
      }
      
      this.running.setCPU();
    }

    public putString()
    { 
      this.kernelPCB.setProgramCounter(new Short(0x0308));
      _CPU.returnRegister = _CPU.programCounter;
      this.contextSwitchToKernel();
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
    
    private runShell(): void
    {
    
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
      //Set kernel PCB to kernel mode
      this.kernelPCB.setKernelMode(true);
      //Set the kernel PCB to the idle process
      this.setIdle();
      //Set the kernelPCB to running
      this.running = this.kernelPCB;
      //Set the CPU to execute the kernel
      this.contextSwitchToKernel();
      
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
      Devices.hostEnableKeyboardInterrupt();
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

    public handleKernelInterrupt(interrupt: IO): void
    {
      //If the kernel is not already running, save the current PCB
      //and put it at the front of the ready queue
      if(this.running != this.kernelPCB)
      {
        this.running.updatePCB();
        this.ready.front(this.running);
        this.running = this.kernelPCB;
        //Add a context switch call to go back to the running process
        //after the kernel is finished 
        _KernelInterruptQueue.add(IO.CONTEXT_SWITCH);
      }

      switch(interrupt)
      {
        case IO.PUT_STRING:
          _CPU.ignoreInterrupts = true;
          _CPU.returnRegister = _CPU.programCounter;
          this.kernelPCB.setProgramCounter(new Short(0x0308));
          this.contextSwitchToKernel();
          break;
        case IO.LOAD_PROGRAM:
          break;
        case IO.CLEAR_SEGMENT:
          break;
        case IO.CONTEXT_SWITCH:
          break;
      }
    }

    public programBreak(): void
    {
    
    }

    public segmentationFault(): void
    {
    
    }

    public timerInterrupt(): void
    {
      //Never switch from Kernel Prcoess until it is done
      if(this.running != this.kernelPCB)
      {
        this.contextSwitchToNext();
      }
    }

    public keyboardInterrupt(parameters: any[]): void
    {
      _krnKeyboardDriver.isr(parameters);
      while(_KernelInputQueue.size() > 0)
      {
        _OsShell.isr(_KernelInputQueue.dequeue());
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
