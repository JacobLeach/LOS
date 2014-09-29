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
    function numberToBytes(value) {
        var toReturn = [];

        var lowByte = new TSOS.Byte(value & 0xFF);
        var highByte = new TSOS.Byte((value & 0xFF00) >> 8);

        toReturn[0] = lowByte;
        toReturn[1] = highByte;

        return toReturn;
    }
    TSOS.numberToBytes = numberToBytes;

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
            this.instructionRegister = this.memory.getByte(numberToBytes(this.programCounter)).asNumber();
        };

        Cpu.prototype.executeInstruction = function () {
            switch (this.instructionRegister) {
                case 0x00:
                    break;

                case 0x6D:
                    this.addWithCarry();
                    break;

                case 0x8D:
                    this.storeAccumulatorInMemory();
                    break;

                case 0xA0:
                    this.loadYRegisterWithConstant();
                    break;

                case 0xA2:
                    this.loadXRegisterWithConstant();
                    break;

                case 0xA9:
                    this.loadAccumulatorWithConstant();
                    break;

                case 0xAC:
                    this.loadYRegisterFromMemory();
                    break;

                case 0xAD:
                    this.loadAccumulatorFromMemory();
                    break;

                case 0xAE:
                    this.loadXRegisterFromMemory();
                    break;

                case 0xD0:
                    break;

                case 0xEA:
                    this.noOperation();
                    break;

                case 0xEC:
                    break;

                case 0xEE:
                    this.increment();
                    break;

                case 0xFF:
                    break;
            }
        };

        Cpu.prototype.loadAddressFromMemory = function () {
            //The lower address byte is one byte ahread of the instruction so increment the PC
            this.programCounter++;
            var lowByte = this.memory.getByte(numberToBytes(this.programCounter));

            //The high address byte is two bytes ahread of the instruction so increment the PC
            this.programCounter++;
            var highByte = this.memory.getByte(numberToBytes(this.programCounter));

            var address = [];
            address[0] = lowByte;
            address[1] = highByte;

            return address;
        };

        Cpu.prototype.addWithCarry = function () {
            var value = this.memory.getByte(this.loadAddressFromMemory());

            //We are not implementing carry.
            //Instead we are just wrapping the value around
            this.accumulator = (this.accumulator + value.asNumber()) % 256;

            //There is an extra byte (for high order addresses we ignore)
            //So we have to increment the PC again
            this.programCounter++;
        };

        Cpu.prototype.storeAccumulatorInMemory = function () {
            this.memory.setByte(this.loadAddressFromMemory(), this.accumulator);

            //There is an extra byte (for high order addresses we ignore)
            //So we have to increment the PC again
            this.programCounter++;
        };

        Cpu.prototype.loadYRegisterWithConstant = function () {
            //The constant is one byte ahead of the instruction in memory so incremenet the PC
            this.programCounter++;

            this.yRegister = this.memory.getByte(numberToBytes(this.programCounter)).asNumber();
        };

        Cpu.prototype.loadXRegisterWithConstant = function () {
            //The constant is one byte ahead of the instruction in memory so incremenet the PC
            this.programCounter++;

            this.xRegister = this.memory.getByte(numberToBytes(this.programCounter)).asNumber();
        };

        Cpu.prototype.loadAccumulatorWithConstant = function () {
            //The constant is one byte ahead of the instruction in memory so incremenet the PC
            this.programCounter++;

            this.accumulator = this.memory.getByte(numberToBytes(this.programCounter)).asNumber();
        };

        Cpu.prototype.loadYRegisterFromMemory = function () {
            this.yRegister = this.memory.getByte(this.loadAddressFromMemory()).asNumber();

            //There is an extra byte (for high order addresses we ignore)
            //So we have to increment the PC again
            this.programCounter++;
        };

        Cpu.prototype.loadAccumulatorFromMemory = function () {
            this.accumulator = this.memory.getByte(this.loadAddressFromMemory()).asNumber();

            //There is an extra byte (for high order addresses we ignore)
            //So we have to increment the PC again
            this.programCounter++;
        };

        Cpu.prototype.loadXRegisterFromMemory = function () {
            this.xRegister = this.memory.getByte(this.loadAddressFromMemory()).asNumber();

            //There is an extra byte (for high order addresses we ignore)
            //So we have to increment the PC again
            this.programCounter++;
        };

        Cpu.prototype.branch = function () {
            //If zFlag is true, we want to branch
            if (this.zFlag) {
                //The constant is one byte ahead of the instruction in memory so incremenet the PC
                this.programCounter++;

                var branchAmount = this.memory.getByte(numberToBytes(this.programCounter)).asNumber();

                //We have to wrap when branch goes above our memory range
                this.programCounter = (this.programCounter + branchAmount) % 256;
            }
        };

        Cpu.prototype.noOperation = function () {
            //Do nothing
        };

        Cpu.prototype.increment = function () {
            var address = this.loadAddressFromMemory();
            var value = this.memory.getByte(address).asNumber();

            value++;
            this.memory.setByte(address, value);

            //There is an extra byte (for high order addresses we ignore)
            //So we have to increment the PC again
            this.programCounter++;
        };
        return Cpu;
    })();
    TSOS.Cpu = Cpu;
})(TSOS || (TSOS = {}));
