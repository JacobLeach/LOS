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
            this.memory = [];

            for (var i = 0; i < size; i++) {
                this.memory[i] = new Byte(0);
            }

            //System calls
            this.memory[0] = new Byte(0xA9);
            this.memory[1] = new Byte(65);
            this.memory[2] = new Byte(0x8D);
            this.memory[3] = new Byte(0x00);
            this.memory[4] = new Byte(0xFF);
            this.memory[5] = new Byte(0x00);
        }
        Memory.prototype.getSize = function () {
            return this.size;
        };

        Memory.prototype.setByte = function (address, value) {
            if (address.asNumber() < this.size) {
                this.memory[address.asNumber()] = value;
            } else {
                //Should throw an interrupt
            }
        };

        Memory.prototype.getByte = function (address) {
            var toReturn;

            if (address.asNumber() < this.size) {
                toReturn = this.memory[address.asNumber()];
            } else {
                //Should throw an interrupt
                toReturn = undefined;
            }

            return toReturn;
        };
        Memory.DEFAULT_SIZE = 1024;
        return Memory;
    })();
    TSOS.Memory = Memory;

    var Byte = (function () {
        function Byte(value) {
            this.setValue(value);
        }
        Byte.prototype.setValue = function (value) {
            this.value = value & 0xFF;
        };

        Byte.prototype.increment = function () {
            this.setValue(++this.value);
        };

        Byte.prototype.asNumber = function () {
            return this.value;
        };
        return Byte;
    })();
    TSOS.Byte = Byte;

    var Short = (function () {
        function Short(value) {
            this.lowByte = new Byte(value & 0xFF);
            this.highByte = new Byte((value & 0xFF00) >> 8);
        }
        Short.prototype.increment = function () {
            if (this.lowByte.asNumber() == 255) {
                this.highByte.increment();
            }

            this.lowByte.increment();
        };

        Short.prototype.asNumber = function () {
            var lowAsString = this.lowByte.asNumber().toString(2);

            while (lowAsString.length < 8) {
                lowAsString = "0" + lowAsString;
            }

            var highAsString = this.highByte.asNumber().toString(2);

            while (highAsString.length < 8) {
                highAsString = "0" + highAsString;
            }

            var shortAsString = highAsString + lowAsString;
            var shortAsNumber = parseInt(shortAsString, 2);

            return shortAsNumber;
        };
        return Short;
    })();
    TSOS.Short = Short;

    function bytesToShort(lowByte, highByte) {
        return new Short(lowByte.asNumber() + (highByte.asNumber() << 8));
    }
    TSOS.bytesToShort = bytesToShort;
})(TSOS || (TSOS = {}));
