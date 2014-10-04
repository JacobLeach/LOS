module TSOS
{
  export class liblos
  {
    public static putChar(): void
    {
      _Kernel.contextSwitch(_Kernel.getShellPid());
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
