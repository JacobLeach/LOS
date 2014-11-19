module TSOS
{
  export class HDDDriver
  {
    public static TRACKS      = 4;
    public static SECTORS     = 8;
    public static BLOCKS      = 8;
    public static BLOCK_SIZE  = 64;

    private hdd: HDD;

    constructor(hdd: HDD)
    {
      this.hdd = hdd;
    }

    public format(): void
    {
      for(var i = 0; i < HDDDriver.TRACKS; i++)
      {
        for(var j = 0; j < HDDDriver.SECTORS; j++)
        {
          for(var k = 0; k < HDDDriver.BLOCKS; k++)
          {
            this.hdd.setBlock(i, j, k, this.formattedBlock());
          }
        }
      }

      this.displayHDD();
    }

    public createFile(name: string): boolean
    {
      var toReturn: boolean = false;

      for(var i = 0; i < HDDDriver.SECTORS; i++)
      {
        for(var j = 1; j < HDDDriver.BLOCKS; j++)
        {
          if(!this.inUse(0, i, j))
          {
            var bytes: Byte[] = [];
            bytes[0] = new Byte(1);

            for(var l = 0; l < name.length; l++)
            {
              bytes[l + 1] = new Byte(name.charCodeAt(l));
            }

            this.hdd.setBlock(0, i, j, bytes);
            this.displayHDD();
            return true;
          }
        }
      }

      return toReturn;
    }

    public deleteFile(name: string): boolean
    {
      return false;
    }

    public readFile(name: string): boolean
    {
      return false;
    }

    public writeFile(name: string, data: Byte[]): boolean
    {
      return false;
    }

    //******************************** Helper Funnctions ******************************** 

    private formattedBlock(): Byte[]
    {
      var block: Byte[] = [];

      for(var i = 0; i < HDDDriver.BLOCK_SIZE; i++)
      {
        block[i] = new Byte(0);
      }

      return block;
    }

    private displayHDD(): void
    {
      (<HTMLInputElement>document.getElementById("hdd")).value = this.hdd.toString(); 
    }

    private inUse(track: number, sector: number, block: number): boolean
    {
      return (this.hdd.getBlock(track, sector, block)[0].asNumber() == 1);
    }
  }
}
