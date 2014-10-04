module TSOS
{
  export class liblos
  {
    public static putChar(letter: string): void
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
