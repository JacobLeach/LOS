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

            this.deviceController = new TSOS.DeviceController();
        }
        Cpu.prototype.cycle = function () {
            _Kernel.krnTrace('CPU cycle');
            this.loadInstruction();
            this.programCounter.increment();
            this.executeInstruction();
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
            this.instructionRegister = this.getByte(this.programCounter);
        };

        Cpu.prototype.executeInstruction = function () {
            switch (this.instructionRegister.asNumber()) {
                case 0x00:
                    this.programEnd();
                    break;
                case 0x40:
                    this.returnFromInterupt();
                    break;
                case 0x4C:
                    this.jump();
                    break;
                case 0x6D:
                    this.addWithCarry();
                    break;
                case 0x8A:
                    this.transferXRegisterToAccumulator();
                    break;
                case 0x8C:
                    this.storeYRegisterInMemory();
                    break;
                case 0x8D:
                    this.storeAccumulatorInMemory();
                    break;
                case 0x8E:
                    this.storeXRegisterInMemory();
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
                case 0xCC:
                    this.compareY();
                    break;
                case 0xD0:
                    this.branch();
                    break;
                case 0xEA:
                    this.noOperation();
                    break;
                case 0xEC:
                    this.compareX();
                    break;
                case 0xEE:
                    this.increment();
                    break;
                case 0xFF:
                    this.systemCall();
                    break;
            }
        };

        Cpu.prototype.compareX = function () {
            this.zFlag = this.xRegister.asNumber() === this.loadValueFromAddress().asNumber();
        };

        Cpu.prototype.compareY = function () {
            this.zFlag = this.yRegister.asNumber() === this.loadValueFromAddress().asNumber();
        };

        Cpu.prototype.programEnd = function () {
            _KernelInterruptQueue.enqueue(new TSOS.Interrupt(3 /* BREAK */, this.kernelMode));
        };

        Cpu.prototype.returnFromInterupt = function () {
            _Kernel.interrupt = false;
            _KernelInterruptQueue.front(new TSOS.Interrupt(4 /* RETURN */, this.returnRegister));
        };

        Cpu.prototype.jump = function () {
            this.programCounter = this.loadAddressFromMemory();
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
            var value = this.getByte(this.loadAddressFromMemory());

            //We are not implementing carry.
            //Instead we are just wrapping the value around
            this.accumulator = new TSOS.Byte((this.accumulator.asNumber() + value.asNumber()) % 256);
        };

        Cpu.prototype.storeYRegisterInMemory = function () {
            this.deviceController.setByte(this.loadAddressFromMemory(), this.yRegister);
        };

        Cpu.prototype.storeAccumulatorInMemory = function () {
            this.deviceController.setByte(this.loadAddressFromMemory(), this.accumulator);
        };

        Cpu.prototype.storeXRegisterInMemory = function () {
            this.deviceController.setByte(this.loadAddressFromMemory(), this.xRegister);
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
            var branchAmount = this.loadInstructionConstant().asNumber();

            //If zFlag is true, we want to branch
            if (this.zFlag) {
                //In kernel mode you address all of memory
                if (this.kernelMode) {
                    this.programCounter = new TSOS.Short(this.programCounter.asNumber() + branchAmount);
                } else {
                    //We have to wrap when branch goes above our memory range
                    this.programCounter = new TSOS.Short((this.programCounter.asNumber() + branchAmount) % 256);
                }
            }
        };

        Cpu.prototype.noOperation = function () {
            //Do nothing
        };

        Cpu.prototype.increment = function () {
            var address = this.loadAddressFromMemory();
            var value = this.getByte(address);

            value.increment();

            this.deviceController.setByte(address, value);
        };

        Cpu.prototype.loadInstructionConstant = function () {
            var toReturn = this.getByte(this.programCounter);

            //The next instruction needs to be in the PC, so increment again
            this.programCounter.increment();

            return toReturn;
        };

        Cpu.prototype.loadAddressFromMemory = function () {
            var lowByte = this.getByte(this.programCounter);

            //The high address byte is two bytes ahread of the instruction so increment the PC
            this.programCounter.increment();
            var highByte = this.getByte(this.programCounter);

            //The next instruction needs to be in the PC, so increment again
            this.programCounter.increment();

            return TSOS.bytesToShort(lowByte, highByte);
        };

        Cpu.prototype.loadValueFromAddress = function () {
            return this.getByte(this.loadAddressFromMemory());
        };

        Cpu.prototype.systemCall = function () {
            this.setKernelMode();
            this.returnRegister = this.programCounter;
            _KernelInterruptQueue.enqueue(new TSOS.Interrupt(2 /* SYSTEM_CALL */, this.xRegister.asNumber()));
        };

        Cpu.prototype.getByte = function (address) {
            return this.deviceController.getByte(this.adjustAddress(address));
        };

        Cpu.prototype.setByte = function (address, data) {
            this.deviceController.setByte(this.adjustAddress(address), data);
        };

        Cpu.prototype.adjustAddress = function (address) {
            //We can access anything, use absolute addressing
            if (this.kernelMode) {
                return address;
            } else {
                var adjustedAddress = new TSOS.Short(address.asNumber() + this.lowAddress.asNumber());

                if (adjustedAddress.asNumber() > this.highAddress.asNumber()) {
                    //Segfault
                    console.log("SEGFAULT: " + adjustedAddress);
                    return undefined;
                } else {
                    return adjustedAddress;
                }
            }
        };
        return Cpu;
    })();
    TSOS.Cpu = Cpu;
})(TSOS || (TSOS = {}));
