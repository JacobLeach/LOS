/* ------------
Memory.ts
Memory simulation for our CPU.
------------ */
var TSOS;
(function (TSOS) {
    var Memory = (function () {
        function Memory(size) {
            if (typeof size === "undefined") { size = Memory.DEFAULT_SIZE; }
            this.size = size;

            for (var i = 0; i < size; i++) {
                this.ram[i] = new Byte();
            }
        }
        Memory.prototype.setByte = function (address, value) {
            if (address > this.size) {
                this.ram[this.size - 1].setValue(value);
            } else if (address < this.size) {
                this.ram[0].setValue(value);
            } else {
                this.ram[address].setValue(value);
            }
        };

        Memory.prototype.getByte = function (address) {
            var toReturn;

            if (address > this.size) {
                toReturn = this.ram[this.size - 1].getValue();
            } else if (address < this.size) {
                toReturn = this.ram[0].getValue();
            } else {
                toReturn = this.ram[address].getValue();
            }

            return toReturn;
        };
        Memory.DEFAULT_SIZE = 256;
        return Memory;
    })();
    TSOS.Memory = Memory;

    var Byte = (function () {
        function Byte() {
            this.value = 0;
        }
        Byte.prototype.setValue = function (value) {
            if (value > 256) {
                new Error("Tried setting byte value higher than 256");
            } else if (value < -128) {
                new Error("Tried setting byte value less than -128");
            } else {
                this.value = value;
            }
        };

        Byte.prototype.getValue = function () {
            return this.value;
        };
        return Byte;
    })();
})(TSOS || (TSOS = {}));
