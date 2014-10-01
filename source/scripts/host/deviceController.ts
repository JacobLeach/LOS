module TSOS {
  
  export class DeviceController {
    private memory: Memory;
    private terminal: Terminal;

    constructor() {
      this.memory = new Memory();
      this.terminal = new Terminal(_Canvas);
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
        }
      }
      return undefined;
    }

    public setByte(address: Short, data: Byte): void {
      if(address.asNumber() < this.memory.getSize()) {
        this.memory.setByte(address, data);
      }
      else if(address.asNumber() >= 0xFF00 && address.asNumber() <= 0xFFFF) {
          console.log("fuck");
        switch(address.asNumber()) {
          //Write char to terminal
          case 0xFF00:
            this.terminal.write(data); 
            break;
        }
      }
          console.log("balls");
    }
  }
}
