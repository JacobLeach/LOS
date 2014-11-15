module TSOS
{
  export class liblos
  {
    public static loadProgram(): number
    {
      return _Kernel.loadProgram();
    }

    public static ps(): void
    {
      var a = _Kernel.ps();  
      
      for(var i = 0; i < a.length; i++)
      {
        if(a[i] === true)
        {
          Stdio.putStringLn("Pid: " + i);
        }
      }
    }

    public static clearmem(): void
    {
      _Kernel.memoryManager.deallocate(0);
      _Kernel.memoryManager.deallocate(1);
      _Kernel.memoryManager.deallocate(2);
      this.deallocate(0);
      this.deallocate(1);
      this.deallocate(2);
    }

    public static runall(): void
    {
      _Kernel.runAll();
    }
    
    public static runProgram(pid: number): void
    {
      _KernelInterruptQueue.add(new Tuple(IO.RUN, pid));
    }
    
    public static putString(): void
    {
      _KernelInterruptQueue.add(new Tuple(IO.PUT_STRING, undefined));
    }

    public static shutdown(): void
    {
      //_Kernel.shutdown();
    }

    public static deallocate(segment: number): void
    {
      _KernelInterruptQueue.add(new Tuple(IO.CLEAR_SEGMENT, segment));
    }

    public static kill(pid: number): void
    {
      _Kernel.kill(pid);
    }
  }
}
