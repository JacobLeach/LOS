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

    public isValid(): Byte
    {
      var code  = (<HTMLInputElement>document.getElementById("taProgramInput")).value;
      code = code.replace(/ /g,'');
      code = code.replace(/\n/g,'');
      var valid: boolean = true;
      
      for(var i = 0; i < code.length; i++) 
      {
        if(!((code[i] >= '0' && code[i] <= '9') || (code[i] >= 'A' && code[i] <= 'F')))
        {
          valid = false;
        }
      }

      if(valid && (code != "") && ((code.length % 2) == 0)) 
      {
        return new Byte(1);
      }
      else 
      {
        return new Byte(0);
      }
    }
  } 
}
