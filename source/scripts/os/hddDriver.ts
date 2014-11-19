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
      
      (<HTMLInputElement>document.getElementById("hdd")).value = this.hdd.toString(); 
    }

    public createFile(name: string): boolean
    {
      return false;
    }

    public deleteFile(name: string): boolean
    {
      return false;
    }

    public readFile(name: string): boolean
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
  }
}
