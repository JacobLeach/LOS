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

        Cpu.prototype.storeAccumulatorInMemory = function () {
            //The address is one byte ahread of the instruction so increment the PC
            this.programCounter++;

            var address = this.memory.getByte(this.programCounter);
            this.memory.setByte(address, this.accumulator);

            //There is an extra byte (for high order addresses we ignore)
            //So we have to increment the PC again
            this.programCounter++;
        };

        Cpu.prototype.loadYRegisterWithConstant = function () {
            //The constant is one byte ahead of the instruction in memory so incremenet the PC
            this.programCounter++;

            this.yRegister = this.memory.getByte(this.programCounter);
        };

        Cpu.prototype.loadXRegisterWithConstant = function () {
            //The constant is one byte ahead of the instruction in memory so incremenet the PC
            this.programCounter++;

            this.xRegister = this.memory.getByte(this.programCounter);
        };

        Cpu.prototype.loadAccumulatorWithConstant = function () {
            //The constant is one byte ahead of the instruction in memory so incremenet the PC
            this.programCounter++;

            this.accumulator = this.memory.getByte(this.programCounter);
        };

        Cpu.prototype.loadYRegisterFromMemory = function () {
            //The low-order memory address byte is one byte ahead of the instruction so incremenet the PC
            this.programCounter++;

            var address = this.memory.getByte(this.programCounter);
            this.yRegister = this.memory.getByte(address);

            //There is an extra byte (for high order addresses we ignore)
            //So we have to increment the PC again
            this.programCounter++;
        };

        Cpu.prototype.loadAccumulatorFromMemory = function () {
            //The low-order memory address byte is one byte ahead of the instruction so incremenet the PC
            this.programCounter++;

            var address = this.memory.getByte(this.programCounter);
            this.accumulator = this.memory.getByte(address);

            //There is an extra byte (for high order addresses we ignore)
            //So we have to increment the PC again
            this.programCounter++;
        };
        return Cpu;
    })();
    TSOS.Cpu = Cpu;
})(TSOS || (TSOS = {}));
