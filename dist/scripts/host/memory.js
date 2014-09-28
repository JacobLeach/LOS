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
                this.memory[i] = new Byte(0);
            }
        }
        Memory.prototype.setByte = function (bytes, value) {
            var address = twoBytesToNumber(bytes[0], bytes[1]);

            if (address < this.size) {
                this.memory[address].setValue(value);
            } else {
                //Should throw an interrupt
            }
        };

        Memory.prototype.getByte = function (bytes) {
            var toReturn;
            var address = twoBytesToNumber(bytes[0], bytes[1]);

            if (address < this.size) {
                toReturn = this.memory[address];
            } else {
                //Should throw an interrupt
                toReturn = undefined;
            }

            return toReturn;
        };
        Memory.DEFAULT_SIZE = 768;
        return Memory;
    })();
    TSOS.Memory = Memory;

    var Byte = (function () {
        function Byte(value) {
            this.setValue(value);
        }
        Byte.prototype.setValue = function (value) {
            this.value = value & 255;
        };

        Byte.prototype.asNumber = function () {
            return this.value;
        };
        return Byte;
    })();
    TSOS.Byte = Byte;

    function twoBytesToNumber(lowByte, highByte) {
        var addressAsString = highByte.asNumber().toString(2) + lowByte.asNumber().toString(2);
        var address = parseInt(addressAsString, 2);

        return address;
    }
    TSOS.twoBytesToNumber = twoBytesToNumber;
})(TSOS || (TSOS = {}));
