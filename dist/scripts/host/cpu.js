///<reference path="../globals.ts" />
/* ------------
CPU.ts
Requires global.ts.
Routines for the host CPU simulation, NOT for the OS itself.
In this manner, it's A LITTLE BIT like a hypervisor,
in that the Document environment inside a browser is the "bare metal" (so to speak) for which we write code
that hosts our client OS. But that analogy only goes so far, and the lines are blurred, because we are using
TypeScript/JavaScript in both the host and client environments.
This code references page numbers in the text book:
Operating System Concepts 8th edition by Silberschatz, Galvin, and Gagne.  ISBN 978-0-470-12872-5
------------ */
var TSOS;
(function (TSOS) {
    var Cpu = (function () {
        function Cpu() {
            this.init();
        }
        Cpu.prototype.init = function () {
            this.programCounter = 0;
            this.accumulator = 0;
            this.xRegister = 0;
            this.yRegister = 0;
            this.zFlag = false;
            this.isExecuting = false;

            this.memory = new TSOS.Memory();
        };

        Cpu.prototype.cycle = function () {
            _Kernel.krnTrace('CPU cycle');
            this.loadInstruction();
            this.executeInstruction();

            this.programCounter++;
        };

        Cpu.prototype.loadInstruction = function () {
            this.instructionRegister = this.memory.getByte(this.programCounter);
        };

        Cpu.prototype.executeInstruction = function () {
            switch (this.instructionRegister) {
                case 0x00:
                    break;

                case 0x6D:
                    break;

                case 0x8D:
                    break;

                case 0xA0:
                    break;

                case 0xA2:
                    break;

                case 0xA9:
                    break;

                case 0xAC:
                    break;

                case 0xAD:
                    break;

                case 0xAE:
                    break;

                case 0xD0:
                    break;

                case 0xEA:
                    break;

                case 0xEC:
                    break;

                case 0xEE:
                    break;

                case 0xFF:
                    break;
            }
        };

        Cpu.prototype.loadAccumulatorWithConstant = function () {
            //The constant is one byte ahead of the instruction so incremenet the PC
            this.programCounter++;

            //Read the constant from memory and put it in the accumulator
            this.accumulator = this.memory.getByte(this.programCounter);
        };

        Cpu.prototype.loadAccumulatorFromMemory = function () {
            //The low-order memory address byte is one byte ahead of the instruction so incremenet the PC
            this.programCounter++;

            //Read the low-order memory address byte from memory
            var lowOrderAddress = this.memory.getByte(this.programCounter);

            //The high-order memory address byte is two bytes ahead of the instruction so incremenet the PC again
            this.programCounter++;

            //Read the high-order memory address byte from memory
            var highOrderAddress = this.memory.getByte(this.programCounter);

            //Convert both to strings that represent their binary values and concat them in the correct order
            var addressAsString = highOrderAddress.toString(2) + lowOrderAddress.toString(2);

            //Parse the binary string into an integer
            var address = parseInt(addressAsString, 2);

            //Read the constant from memory at the address loaded and put it in the accumulator
            this.accumulator = this.memory.getByte(address);
        };

        Cpu.prototype.storeAccumulatorInMemory = function () {
        };
        return Cpu;
    })();
    TSOS.Cpu = Cpu;
})(TSOS || (TSOS = {}));
