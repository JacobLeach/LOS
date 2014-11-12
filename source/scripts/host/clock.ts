module TSOS
{
  export class Clock
  {
    private clockId: number;

    constructor(cpu: Cpu, speed: number)
    {
      this.clockId = setInterval(cpu.tick, speed);
    }

    public stop(): void
    {
      clearInterval(this.clockId);
    }
  }
}
