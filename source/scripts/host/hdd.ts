module TSOS
{
  export class HDD
  {
    public setBlock(track: number, sector: number, block: number, value: Byte[]): void
    {
      while(value.length < 64)
      {
        value.push(new Byte(0));
      }

      if(value.length > 64)
      {
        console.log("Block length > 64! Should not happen.");
      }

      localStorage.setItem(track.toString() + sector.toString() + block.toString(), JSON.stringify(value));
    }

    public getBlock(track: number, sector: number, block: number): Byte[]
    {
      var bytes = JSON.parse(localStorage.getItem(track.toString() + sector.toString() + block.toString()));
      var toReturn = [];

      for(var i = 0; i < bytes.length; i++)
      {
        toReturn.push(new Byte(bytes[i].value));
      }

      return toReturn;
    }

    public toString(): string
    {
      var toReturn: string = "";

      for(var i = 0; i < HDDDriver.TRACKS; i++)
      {
        for(var j = 0; j < HDDDriver.SECTORS; j++)
        {
          for(var k = 0; k < HDDDriver.BLOCKS; k++)
          {
            var bytes = this.getBlock(i, j, k);
            toReturn += j.toString() + i.toString() + k.toString() + ": ";

            for(var l = 0; l < HDDDriver.BLOCK_SIZE; l++)
            {
              var num = bytes[l].asNumber().toString(16);
              if(num.length == 1)
              {
                toReturn += "0" + num + " ";
              }
              else
              {
                toReturn += num + " ";
              }
            }

            toReturn += "\n";
          }
        }
      }

      return toReturn;
    }
  }
}
