module TSOS
{
  export class ProgramReader
  {
    private low: Byte;
    private high: Byte;
    
    constructor()
    {
      this.low = new Byte(0);
      this.high = new Byte(0);
    }

    public setLowByte(low: Byte)
    {
      this.low = low;
    }
    
    public setHighByte(high: Byte)
    {
      this.high = high;
    }

    public getByte(): Byte
    {
      var code  = (<HTMLInputElement>document.getElementById("taProgramInput")).value;

      return new Byte(code[bytesToShort(this.low, this.high).asNumber()].charCodeAt(0));
    }
  } 
}
