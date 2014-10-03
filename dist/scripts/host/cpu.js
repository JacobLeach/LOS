/* ------------
CPU.ts
A basic modifed 6502 CPU simulation.
------------ */
var TSOS;
(function (TSOS) {
    var Cpu = (function () {
        function Cpu() {
            this.programCounter = new TSOS.Short(0);
            this.accumulator = new TSOS.Byte(0);
            this.xRegister = new TSOS.Byte(0);
            this.yRegister = new TSOS.Byte(0);
            this.zFlag = false;
            this.kernelMode = false;

            this.executing = false;

            this.memory = new TSOS.Memory();
        }
        Cpu.prototype.cycle = function () {
            _Kernel.krnTrace('CPU cycle');

            this.loadInstruction();
            this.executeInstruction();
            this.programCounter.increment();
        };

        Cpu.prototype.isExecuting = function () {
            return this.executing;
        };

        Cpu.prototype.isKernelMode = function () {
            return this.kernelMode;
        };

        Cpu.prototype.setKernelMode = function () {
            this.kernelMode = true;
        };

        Cpu.prototype.isUserMode = function () {
            return !this.kernelMode;
        };

        Cpu.prototype.setUserMode = function () {
            this.kernelMode = false;
        };

        Cpu.prototype.loadInstruction = function () {
            this.instructionRegister = this.memory.getByte(this.programCounter);
        };

        Cpu.prototype.executeInstruction = function () {
            switch (this.instructionRegister.asNumber()) {
                case 0x00:
                    this.programEnd();
                    break;
                case 0x6D:
                    this.addWithCarry();
                    break;
                case 0x8A:
                    this.transferXRegisterToAccumulator();
                    break;
                case 0x8D:
                    this.storeAccumulatorInMemory();
                    break;
                case 0x98:
                    this.transferYRegisterToAccumulator();
                    break;
                case 0xA0:
                    this.loadYRegisterWithConstant();
                    break;
                case 0xA2:
                    this.loadXRegisterWithConstant();
                    break;
                case 0xA8:
                    this.transferAccumulatorToYRegister();
                    break;
                case 0xA9:
                    this.loadAccumulatorWithConstant();
                    break;
                case 0xAA:
                    this.transferAccumulatorToXRegister();
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

        Cpu.prototype.programEnd = function () {
            this.executing = false;
        };

        Cpu.prototype.transferXRegisterToAccumulator = function () {
            this.accumulator = this.xRegister;
        };

        Cpu.prototype.transferYRegisterToAccumulator = function () {
            this.accumulator = this.yRegister;
        };

        Cpu.prototype.transferAccumulatorToXRegister = function () {
            this.xRegister = this.accumulator;
        };

        Cpu.prototype.transferAccumulatorToYRegister = function () {
            this.yRegister = this.accumulator;
        };

        Cpu.prototype.addWithCarry = function () {
            var value = this.memory.getByte(this.loadAddressFromMemory());

            //We are not implementing carry.
            //Instead we are just wrapping the value around
            this.accumulator = new TSOS.Byte((this.accumulator.asNumber() + value.asNumber()) % 256);
        };

        Cpu.prototype.storeAccumulatorInMemory = function () {
            this.memory.setByte(this.loadAddressFromMemory(), this.accumulator);
        };

        Cpu.prototype.loadYRegisterWithConstant = function () {
            this.yRegister = this.loadInstructionConstant();
        };

        Cpu.prototype.loadXRegisterWithConstant = function () {
            this.xRegister = this.loadInstructionConstant();
        };

        Cpu.prototype.loadAccumulatorWithConstant = function () {
            this.accumulator = this.loadInstructionConstant();
        };

        Cpu.prototype.loadYRegisterFromMemory = function () {
            this.yRegister = this.loadValueFromAddress();
        };

        Cpu.prototype.loadAccumulatorFromMemory = function () {
            this.accumulator = this.loadValueFromAddress();
        };

        Cpu.prototype.loadXRegisterFromMemory = function () {
            this.xRegister = this.loadValueFromAddress();
        };

        Cpu.prototype.branch = function () {
            //If zFlag is true, we want to branch
            if (this.zFlag) {
                //The constant is one byte ahead of the instruction in memory so incremenet the PC
                this.programCounter.increment();

                var branchAmount = this.memory.getByte(this.programCounter).asNumber();

                //We have to wrap when branch goes above our memory range
                this.programCounter = new TSOS.Short((this.programCounter.asNumber() + branchAmount) % 256);
            }
        };

        Cpu.prototype.noOperation = function () {
            //Do nothing
        };

        Cpu.prototype.increment = function () {
            var address = this.loadAddressFromMemory();
            var value = this.memory.getByte(address);

            value.increment();

            this.memory.setByte(address, value);
        };

        Cpu.prototype.loadInstructionConstant = function () {
            //The constant is one byte ahead of the instruction in memory so incremenet the PC
            this.programCounter.increment();

            return this.memory.getByte(this.programCounter);
        };

        Cpu.prototype.loadAddressFromMemory = function () {
            //The lower address byte is one byte ahread of the instruction so increment the PC
            this.programCounter.increment();
            var lowByte = this.memory.getByte(this.programCounter);

            //The high address byte is two bytes ahread of the instruction so increment the PC
            this.programCounter.increment();
            var highByte = this.memory.getByte(this.programCounter);

            return TSOS.bytesToShort(lowByte, highByte);
        };

        Cpu.prototype.loadValueFromAddress = function () {
            return this.memory.getByte(this.loadAddressFromMemory());
        };
        return Cpu;
    })();
    TSOS.Cpu = Cpu;
})(TSOS || (TSOS = {}));
