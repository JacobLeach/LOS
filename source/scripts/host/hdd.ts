module TSOS
{
  export class HDD
  {
    public setBlock(track: number, sector: number, block: number, value: Byte[]): void
    {
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
  }
}
