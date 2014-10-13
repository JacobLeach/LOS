var TSOS;
(function (TSOS) {
    var DeviceController = (function () {
        function DeviceController() {
            this.memory = new TSOS.Memory();

            this.printMemory();

            this.terminal = new TSOS.Terminal(_Canvas);
            this.programReader = new TSOS.ProgramReader();
        }
        DeviceController.prototype.printMemory = function () {
            var memoryAsString = "";
            for (var i = 0; i < 1024; i++) {
                if (i == 0) {
                    var num = i.toString(16) + "-" + (i + 8).toString(16) + ":";

                    while (num.length < 11) {
                        num += " ";
                    }

                    memoryAsString += num;
                } else if ((i % 8) == 0) {
                    memoryAsString += "\n";

                    var num = i.toString(16) + "-" + (i + 8).toString(16) + ":";
                    while (num.length < 11) {
                        num += " ";
                    }

                    memoryAsString += num;
                }
                var num = this.memory.getByte(new TSOS.Short(i)).asNumber().toString(16);
                if (num.length == 1) {
                    num = "0" + num;
                }

                memoryAsString += num + " ";
            }

            document.getElementById("memoryBox").value = memoryAsString;
        };

        DeviceController.prototype.getByte = function (address) {
            if (address == undefined) {
                return new TSOS.Byte(0);
            } else if (address.asNumber() < this.memory.getSize()) {
                return this.memory.getByte(address);
            } else if (address.asNumber() >= 0xFF00 && address.asNumber() <= 0xFFFF) {
                switch (address.asNumber()) {
                    case 0xFF01:
                        break;

                    case 0xFF02:
                        break;
                    case 0xFF11:
                        return this.programReader.getByte();
                        break;
                    case 0xFF12:
                        return this.programReader.atEnd();
                        break;

                    case 0xFFF0:
                        return new TSOS.Byte(TSOS.Stdio.getChar());
                        break;
                }
            }
            return undefined;
        };

        DeviceController.prototype.setByte = function (address, data) {
            if (address == undefined) {
            } else if (address.asNumber() < this.memory.getSize()) {
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
            this.printMemory();
        };
        return DeviceController;
    })();
    TSOS.DeviceController = DeviceController;
})(TSOS || (TSOS = {}));
