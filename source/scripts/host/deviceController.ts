module TSOS {
  
  export class DeviceController {
    private memory: Memory;
    private terminal: Terminal;
    private programReader: ProgramReader;

    constructor() {
      this.memory = new Memory();
      this.terminal = new Terminal(_Canvas);
      this.programReader = new ProgramReader();
    }
    
    public getByte(address: Short): Byte {
      if(address.asNumber() < this.memory.getSize()) {
        return this.memory.getByte(address);
      }
      else if(address.asNumber() >= 0xFF00 && address.asNumber() <= 0xFFFF) {
        switch(address.asNumber()) {
          //Get terminal width
          case 0xFF01:
            break;
          //Get terminal height
          case 0xFF02:
            break;
          case 0xFF12:
            return this.programReader.getByte();
            break;
          case 0xFF13:
            return this.programReader.isValid();
            break;
          //Input from OS
          case 0xFFF0:
            return new Byte(Stdio.getChar());
            break;
        }
      }
      return undefined;
    }

    public setByte(address: Short, data: Byte): void {
      if(address.asNumber() < this.memory.getSize()) 
      {
        this.memory.setByte(address, data);
      }
      else if(address.asNumber() >= 0xFF00 && address.asNumber() <= 0xFFFF) 
      {
        switch(address.asNumber()) 
        {
          case 0xFF00:
            this.terminal.write(data); 
            break;
          case 0xFF10:
            this.programReader.setLowByte(data);
            break;
          case 0xFF11:
            this.programReader.setHighByte(data);
            break;
          case 0xFFF1:
            _Kernel.systemCallReturn(data);
            break;
        }
      }
      else
      {
        //Segfault
      }
    }
  }
}
