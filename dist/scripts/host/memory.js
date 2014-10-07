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

            //Print single char
            this.memory[0x0300] = new Byte(0x8C);
            this.memory[0x0301] = new Byte(0x00);
            this.memory[0x0302] = new Byte(0xFF);
            this.memory[0x0303] = new Byte(0x40);

            //Load char from buffer
            this.memory[0x0304] = new Byte(0xAD); //Load accumulator from memory
            this.memory[0x0305] = new Byte(0xF0); //Device address for buffer
            this.memory[0x0306] = new Byte(0xFF);
            this.memory[0x0307] = new Byte(0x40);

            //STDIO putString
            //Load char from liblos buffer
            this.memory[0x0308] = new Byte(0xAD);
            this.memory[0x0309] = new Byte(0xF0);
            this.memory[0x030A] = new Byte(0xFF);
            this.memory[0x030B] = new Byte(0xA8);

            //Compare Y to null
            this.memory[0x030C] = new Byte(0xCC);
            this.memory[0x030D] = new Byte(0x18);
            this.memory[0x030E] = new Byte(0x03);
            this.memory[0x030F] = new Byte(0xD0);
            this.memory[0x0310] = new Byte(6);

            //Print char
            this.memory[0x0311] = new Byte(0x8C);
            this.memory[0x0312] = new Byte(0x00);
            this.memory[0x0313] = new Byte(0xFF);
            this.memory[0x0314] = new Byte(0x4C);
            this.memory[0x0315] = new Byte(0x08);
            this.memory[0x0316] = new Byte(0x03);
            this.memory[0x0317] = new Byte(0x40);
            this.memory[0x0318] = new Byte(0x00);

            //Load program
            this.memory[0x0319] = new Byte(0xA9);
            this.memory[0x031A] = new Byte(0x00); //Load accc with 0 (increment this)
            this.memory[0x031B] = new Byte(0x8D);
            this.memory[0x031C] = new Byte(0x10);
            this.memory[0x031D] = new Byte(0xFF); //Set address for program reader
            this.memory[0x031E] = new Byte(0xAE);
            this.memory[0x031F] = new Byte(0x11);
            this.memory[0x0320] = new Byte(0xFF); //Load from program reader into x
            this.memory[0x0321] = new Byte(0x8E);
            this.memory[0x0322] = new Byte(0x00);
            this.memory[0x0323] = new Byte(0x00); //Store x reg in zero (increment this)
            this.memory[0x0324] = new Byte(0xEE);
            this.memory[0x0325] = new Byte(0x1A);
            this.memory[0x0326] = new Byte(0x03);
            this.memory[0x0327] = new Byte(0xEE);
            this.memory[0x0328] = new Byte(0x22);
            this.memory[0x0329] = new Byte(0x03);
            this.memory[0x032A] = new Byte(0xAE);
            this.memory[0x032B] = new Byte(0x12);
            this.memory[0x032C] = new Byte(0xFF); //Check whether or not we are done
            this.memory[0x032D] = new Byte(0xEC);
            this.memory[0x032E] = new Byte(0x36);
            this.memory[0x032F] = new Byte(0x03); //Compare to zero
            this.memory[0x0330] = new Byte(0xD0); //Branch past jump if done (equal to zero)
            this.memory[0x0331] = new Byte(0x02);
            this.memory[0x0332] = new Byte(0x4C);
            this.memory[0x0333] = new Byte(0x19);
            this.memory[0x0334] = new Byte(0x03); //Jump back to beginning
            this.memory[0x0335] = new Byte(0x40);
            this.memory[0x0336] = new Byte(0x00);
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
