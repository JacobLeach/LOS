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
      
      if(!this.fileExists(name))
      {
        for(var i = 0; i < HDDDriver.SECTORS; i++)
        {
          for(var j = 1; j < HDDDriver.BLOCKS; j++)
          {
            if(!this.inUse(0, i, j))
            {
              var bytes: Byte[] = [];
              bytes[0] = new Byte(1);
              bytes[1] = new Byte(0);
              bytes[2] = new Byte(0);
              bytes[3] = new Byte(0);

              for(var l = 0; l < name.length; l++)
              {
                bytes[l + 4] = new Byte(name.charCodeAt(l));
              }

              this.hdd.setBlock(0, i, j, bytes);
              this.displayHDD();
              return true;
            }
          }
        }
      }

      return toReturn;
    }

    public deleteFile(name: string): boolean
    {
      return false;
    }

    public readFile(name: string): Byte[]
    {
      var toReturn: Byte[] = [];
      
      if(this.fileExists(name))
      {
        var address: Address = this.findFile(name);
        var currentBlock: Byte[] = this.hdd.getBlock(address.track, address.sector, address.block);
        console.log(currentBlock);
        address = new Address(currentBlock[1].asNumber(), currentBlock[2].asNumber(), currentBlock[3].asNumber());
        
        while(!(currentBlock[1].asNumber() == 0 && currentBlock[2].asNumber() == 0 && currentBlock[3].asNumber() == 0))
        {
          currentBlock = this.hdd.getBlock(address.track, address.sector, address.block);
          address = new Address(currentBlock[1].asNumber(), currentBlock[2].asNumber(), currentBlock[3].asNumber());

          toReturn = toReturn.concat(currentBlock.slice(4));
        }
      }

      return toReturn;
    }

    public writeFile(name: string, data: Byte[]): boolean
    {
      if(this.fileExists(name))
      {
        var address: Address = this.findFile(name);
        var cur = this.hdd.getBlock(address.track, address.sector, address.block);

        var block: Address = this.findEmptyBlock();
        
        cur[1] = new Byte(block.track);
        cur[2] = new Byte(block.sector);
        cur[3] = new Byte(block.block);
        this.hdd.setBlock(address.track, address.sector, address.block, cur);
        var done = 0;

        while(done < data.length)
        {
          if(data.length - done > 60)
          {
            var toPut = data.slice(done, done + 60);
            this.hdd.setBlock(block.track, block.sector, block.block, [new Byte(1)]);

            var temp = this.findEmptyBlock();
            toPut.unshift(new Byte(temp.block));
            toPut.unshift(new Byte(temp.sector));
            toPut.unshift(new Byte(temp.track));
            toPut.unshift(new Byte(1));

            this.hdd.setBlock(block.track, block.sector, block.block, toPut);

            block = temp;
          }
          else
          {
            var toPut = data.slice(done);
            toPut.unshift(new Byte(0));
            toPut.unshift(new Byte(0));
            toPut.unshift(new Byte(0));
            toPut.unshift(new Byte(1));
            
            this.hdd.setBlock(block.track, block.sector, block.block, toPut);
          }

          done += 60;
        }


      }
      else
      {
        return false;
      }

      this.displayHDD();
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

    public displayHDD(): void
    {
      (<HTMLInputElement>document.getElementById("hdd")).value = this.hdd.toString(); 
    }

    private inUse(track: number, sector: number, block: number): boolean
    {
      return (this.hdd.getBlock(track, sector, block)[0].asNumber() == 1);
    }

    private fileExists(name: string): boolean
    {
      return (this.findFile(name) == undefined) ? false : true;
    }

    private findFile(name: string): Address
    {
      var toReturn: Address = undefined;

      for(var i = 0; i < HDDDriver.SECTORS; i++)
      {
        for(var j = 1; j < HDDDriver.BLOCKS; j++)
        {
          var bytes = this.hdd.getBlock(0,i,j);
          var k = 4;
          var storedName = "";

          while(bytes[k].asNumber() != 0)
          {
            storedName += String.fromCharCode(bytes[k].asNumber());
            k++;
          }

          if(name == storedName)
          {
            toReturn = new Address(0, i, j);
          }
        }
      }
      
      return toReturn;
    }

    private nextBlock(address: Address): Address
    {
      var bytes: Byte[] = this.hdd.getBlock(address.track, address.sector, address.block); 
      var next: Address = new Address(bytes[1].asNumber(), bytes[2].asNumber(), bytes[3].asNumber());

      if(next.track == 0 && next.sector == 0, next.block == 0)
      {
        return undefined;
      }
      else
      {
        return next;
      }
    }

    private findEmptyBlock(): Address
    {
      for(var i = 1; i < HDDDriver.TRACKS; i++)
      {
        for(var j = 0; j < HDDDriver.SECTORS; j++)
        {
          for(var k = 0; k < HDDDriver.BLOCKS; k++)
          {
            var bytes = this.hdd.getBlock(i, j, k);
            if(bytes[0].asNumber() == 0)
            {
              return new Address(i, j, k);
            }
          }
        }
      }

      return undefined;
    }
  }

  class Address
  {
    public track: number;
    public sector: number;
    public block: number;

    constructor(track: number, sector: number, block: number)
    {
      this.track = track;
      this.sector = sector;
      this.block = block;
    }
  }
}
