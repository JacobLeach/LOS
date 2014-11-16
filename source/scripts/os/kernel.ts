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
    CONTEXT_SWITCH,
    PCB_IN_LOADED,
    RUN
  }

  export class Kernel 
  {
    private ready: Queue;
    private loaded: PCB[];
    private running: PCB;
    private kernelPCB: PCB;
    private idlePCB: PCB;

    public memoryManager: MemoryManager;
    private cyclesLeft: number;
    
    public loadProgram(): number
    {
      var segment = this.memoryManager.allocate();

      if(segment === undefined)
      {
        return undefined;
      }
      else
      {
        var pcb = new PCB(segment);
        _KernelInterruptQueue.add(new Tuple(IO.LOAD_PROGRAM, pcb));

        return pcb.getPid();
      }
      return 0;
    }

    //Switches context to the next PCB in the ready queue
    private contextSwitchToNext(): void
    {
      if(this.running != undefined)
      {
        this.running.updatePCB();

        //Idle and kernel PCBs do not go on the ready queue
        if(this.running != this.idlePCB && this.running != this.kernelPCB)
        {
          this.ready.add(this.running);
        }
      }
      
      if(this.ready.size() > 0)
      {
        this.running = this.ready.dequeue();
        this.running.setCPU();
        this.krnTrace("Starting user process " + this.running.getPid());
      }
      else
      {
        this.setIdle(); 
      }
      
      this.printReady();
    }

    private contextSwitchToKernel(): void
    {
      //If kernel is already running, just reset the CPU to the kernel PCB
      if(this.running != this.kernelPCB)
      {
        this.running.updatePCB();
        
        //Don't put the idle PCB on the ready queue
        if(this.running != this.idlePCB)
        {
          //Put what was running at the front so it runs after we are done
          this.ready.front(this.running);
        }
      
        this.running = this.kernelPCB;
        this.krnTrace("Starting kernel process");
      }
      
      this.running.setCPU();
      this.printReady();
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

      if(this.idlePCB != undefined)
      {
        pids[this.idlePCB.getPid()] = true;
      }
      
      if(this.kernelPCB != undefined)
      {
        pids[this.kernelPCB.getPid()] = true;
      }

      return pids;
    }
    
    public kill(pid: number): void
    {
      console.log("What?: " + pid);
      if(this.running != undefined && this.running.getPid() == pid)
      {
        this.memoryManager.deallocate(this.running.getSegment());;
        liblos.deallocate(this.running.getSegment());
        this.running = undefined;
      }
      else if(this.kernelPCB != undefined && this.kernelPCB.getPid() == pid)
      {
        _Console.bluescreen();
        _Console.writeWhiteText("Kernel killed.");
        _Kernel.shutdown();
      }
      else if(this.idlePCB != undefined && this.idlePCB.getPid() == pid)
      {
        this.memoryManager.deallocate(this.idlePCB.getSegment());;
        liblos.deallocate(this.idlePCB.getSegment());
        this.idlePCB = undefined;
      }
      else
      {
        for(var i = 0; i < this.loaded.length; i++)
        {
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
      (<HTMLInputElement>document.getElementById("readyBox")).value = pcb.toString(); 
    }

    public printReady(): void
    {
      var str = "";
      for(var i = 0; i < this.ready.q.length; i++)
      {
        str += this.ready.q[i].toString();
      }

      (<HTMLInputElement>document.getElementById("readyBox")).value = str; 
    }

    public getRunning(): number
    {
      return this.running.getPid();
    }

    private setIdle()
    {
      if(this.idlePCB != undefined)
      {
        this.krnTrace("Starting idle process");
        this.running = this.idlePCB;
        this.running.setCPU();
      }
      else
      {
        this.krnTrace("Idle process not started. Starting.");
        this.idlePCB = new PCB(this.memoryManager.reserve(4));
        this.setIdle();
      }
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
      this.kernelPCB.setKernelMode(true);
      
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
      
      //Start idling
      this.setIdle();
    }

    public shutdown() 
    {
      _CPU.stop();
      this.krnTrace("begin shutdown OS");
      this.krnTrace("end shutdown OS");
    }

    public handleKernelInterrupt(interrupt): void
    {
      switch(interrupt.first)
      {
        case IO.PUT_STRING:
          this.kernelPCB.setProgramCounter(new Short(0x0308));
          this.contextSwitchToKernel();
          break;
        case IO.LOAD_PROGRAM:
          this.kernelPCB.setProgramCounter(new Short(0x0319));
          _Memory.setByte(new Short(0x0323), interrupt.second.getBase().getHighByte());
          this.contextSwitchToKernel();
          _KernelInterruptQueue.front(new Tuple(IO.PCB_IN_LOADED, interrupt.second));
          break;
        case IO.CLEAR_SEGMENT:
          this.kernelPCB.setProgramCounter(new Short(0x035D));
          this.kernelPCB.setAccumulator(new Byte(interrupt.second));
          this.contextSwitchToKernel();
          break;
        case IO.PCB_IN_LOADED:
          this.setIdle();
          this.loaded.push(interrupt.second); 
          _CPU.ignoreInterrupts = false;
          break;
        case IO.RUN:
          this.loadedToReady(interrupt.second);
          this.contextSwitchToNext();
          _CPU.ignoreInterrupts = false;
          break;
      }
    }
    
    private loadedToReady(pid)
    {
      for(var i = 0; i < this.loaded.length; i++)
      {
        if(this.loaded[i].getPid() == pid)
        {
          this.ready.add(this.loaded[i]);
          this.loaded.splice(i, 1);
          break;
        }
      }
    }

    public programBreak(): void
    {
      this.memoryManager.deallocate(this.running.getSegment());
      liblos.deallocate(this.running.getSegment());
      this.running = undefined;

      Stdio.putStringLn("Program Finished");
      this.contextSwitchToNext();

    }
    
    public returnInterrupt(): void
    {
      if(_KernelInterruptQueue.size() === 0)
      {
        this.contextSwitchToNext(); 
      }
    }

    public segmentationFault(): void
    {
    
    }

    public timerInterrupt(): void
    {
      //Only switch to next if we are running more than one program
      if(this.running != this.kernelPCB && this.ready.size() > 1)
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
          this.kernelPCB.setAccumulator(new Byte(_CPU.lowAddress.getHighByte().asNumber()));
          this.kernelPCB.setYRegister(new Byte(_CPU.yRegister.asNumber()));
          this.kernelPCB.setProgramCounter(new Short(0x0342));
          this.contextSwitchToKernel();
          break;
      }   
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
