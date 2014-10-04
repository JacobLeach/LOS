module TSOS
{
  export class liblos
  {
    public static shutdown(): void
    {
      _Kernel.shutdown();
    }

    public static clockTick(): void
    {
      _Kernel.clockTick();
    }
  }
}
