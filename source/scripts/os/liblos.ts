module TSOS
{
  export class liblos
  {
    public static loadProgram(): void
    {
      _KernelInterruptQueue.enqueue(new Interrupt(IRQ.SYSTEM_CALL, 5));
    }
    
    public static forkExec(program: string): void
    {
      _Kernel.forkExec(program); 
    }
    
    public static putString(): void
    {
      //_Kernel.contextSwitch(_Kernel.getShellPid());
      _KernelInterruptQueue.enqueue(new Interrupt(IRQ.SYSTEM_CALL, 4));
    }

    public static clockTick(): void
    {
      _Kernel.clockTick();
    }
    
    public static shutdown(): void
    {
      _Kernel.shutdown();
    }
  }
}
