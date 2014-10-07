var TSOS;
(function (TSOS) {
    var DeviceController = (function () {
        function DeviceController() {
            this.memory = new TSOS.Memory();
            this.terminal = new TSOS.Terminal(_Canvas);
            this.programReader = new TSOS.ProgramReader();
        }
        DeviceController.prototype.getByte = function (address) {
            if (address.asNumber() < this.memory.getSize()) {
                return this.memory.getByte(address);
            } else if (address.asNumber() >= 0xFF00 && address.asNumber() <= 0xFFFF) {
                switch (address.asNumber()) {
                    case 0xFF01:
                        break;

                    case 0xFF02:
                        break;
                    case 0xFF12:
                        return this.programReader.getByte();
                        break;

                    case 0xFFF0:
                        return new TSOS.Byte(TSOS.Stdio.getChar());
                        break;
                }
            }
            return undefined;
        };

        DeviceController.prototype.setByte = function (address, data) {
            if (address.asNumber() < this.memory.getSize()) {
                this.memory.setByte(address, data);
            } else if (address.asNumber() >= 0xFF00 && address.asNumber() <= 0xFFFF) {
                switch (address.asNumber()) {
                    case 0xFF00:
                        this.terminal.write(data);
                        break;
                    case 0xFF10:
                        this.programReader.setAddress(data);
                        break;
                    case 0xFFF1:
                        break;
                }
            } else {
                //Segfault
            }
        };
        return DeviceController;
    })();
    TSOS.DeviceController = DeviceController;
})(TSOS || (TSOS = {}));
