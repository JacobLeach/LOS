module TSOS
{
  export class liblos
  {
    public static putChar(): void
    {
      //If executing already, save that state
      //Update shell PCB with correct address and swap it in
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
