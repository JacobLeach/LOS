module TSOS
{
  export class liblos
  {
    public static loadProgram(): number
    {
      _KernelInterruptQueue.enqueue(new Interrupt(InterruptType.SYSTEM_CALL, [5, true]));
      return _Kernel.forkExec();
    }
    
    public static runProgram(pid: number): void
    {
      _Kernel.runProgram(pid);
    }
    
    public static putString(): void
    {
      //_Kernel.contextSwitch(_Kernel.getShellPid());
      _KernelInterruptQueue.enqueue(new Interrupt(InterruptType.SYSTEM_CALL, [4, true]));
    }

    public static clockTick(): void
    {
      _Kernel.clockTick();
    }
    
    public static shutdown(): void
    {
      _Kernel.shutdown();
    }

    public static deallocate(segment: number): void
    {
      _KernelInterruptQueue.enqueue(new Interrupt(InterruptType.SYSTEM_CALL, [7, true, segment]));
    }
  }
}
