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

            this.lowAddress = new TSOS.Short(0);
            this.highAddress = new TSOS.Short(0);
            this.executing = false;

            this.deviceController = new TSOS.DeviceController();
            this.printCPU();
        }
        Cpu.prototype.printCPU = function () {
            var cpuAsString = "";

            cpuAsString += "PC: " + this.programCounter.asNumber().toString(16);
            cpuAsString += "\nAC: " + this.accumulator.asNumber().toString(16);
            cpuAsString += "\nX: " + this.xRegister.asNumber().toString(16);
            cpuAsString += "\nY: " + this.yRegister.asNumber().toString(16);
            cpuAsString += "\nZ: " + this.zFlag;
            cpuAsString += "\nkernelMode: " + this.kernelMode;
            cpuAsString += "\nlowAddress: " + this.lowAddress.asNumber().toString(16);
            cpuAsString += "\nhighAddress: " + this.highAddress.asNumber().toString(16);

            document.getElementById("cpuBox").value = cpuAsString;
        };

        Cpu.prototype.cycle = function () {
            this.printCPU();
            this.loadInstruction();
            this.programCounter = this.programCounter.increment();
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
                    this.branchNotEqual();
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
                case 0xF0:
                    this.branchEqual();
                    break;
                case 0xFF:
                    this.systemCall();
                    break;
                default:
                    _Kernel.krnTrace("Invalid opcode: " + this.instructionRegister.asNumber());
            }
        };

        Cpu.prototype.compareX = function () {
            this.zFlag = (this.xRegister.asNumber() === this.loadValueFromAddress().asNumber());
        };

        Cpu.prototype.compareY = function () {
            this.zFlag = (this.yRegister.asNumber() === this.loadValueFromAddress().asNumber());
        };

        Cpu.prototype.programEnd = function () {
            this.executing = false;
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
            this.setByte(this.loadAddressFromMemory(), this.yRegister);
        };

        Cpu.prototype.storeAccumulatorInMemory = function () {
            this.setByte(this.loadAddressFromMemory(), this.accumulator);
        };

        Cpu.prototype.storeXRegisterInMemory = function () {
            this.setByte(this.loadAddressFromMemory(), this.xRegister);
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

        Cpu.prototype.branchNotEqual = function () {
            var branchAmount = this.loadInstructionConstant().asNumber();

            if (!this.zFlag) {
                //In kernel mode you address all of memory
                /*if(this.kernelMode)
                {
                this.programCounter = new Short(this.programCounter.asNumber() + branchAmount);
                }
                else
                {*/
                //We have to wrap when branch goes above our memory range
                this.programCounter = new TSOS.Short((this.programCounter.asNumber() + branchAmount) % 256);
                //}
            }
        };

        Cpu.prototype.branchEqual = function () {
            var branchAmount = this.loadInstructionConstant().asNumber();

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
            var newValue = value.increment();

            this.setByte(address, newValue);
        };

        Cpu.prototype.loadInstructionConstant = function () {
            var toReturn = new TSOS.Byte(this.getByte(this.programCounter).asNumber());

            //The next instruction needs to be in the PC, so increment again
            this.programCounter = this.programCounter.increment();

            return toReturn;
        };

        Cpu.prototype.loadAddressFromMemory = function () {
            var lowByte = new TSOS.Byte(this.getByte(this.programCounter).asNumber());

            //The high address byte is two bytes ahread of the instruction so increment the PC
            this.programCounter = this.programCounter.increment();
            var highByte = new TSOS.Byte(this.getByte(this.programCounter).asNumber());

            //The next instruction needs to be in the PC, so increment again
            this.programCounter = this.programCounter.increment();

            return TSOS.bytesToShort(lowByte, highByte);
        };

        Cpu.prototype.loadValueFromAddress = function () {
            return new TSOS.Byte(this.getByte(this.loadAddressFromMemory()).asNumber());
        };

        Cpu.prototype.systemCall = function () {
            this.setKernelMode();
            this.returnRegister = this.programCounter;
            _KernelInterruptQueue.enqueue(new TSOS.Interrupt(2 /* SYSTEM_CALL */, [this.xRegister.asNumber(), false, this.yRegister.asNumber()]));
        };

        Cpu.prototype.getByte = function (address) {
            return new TSOS.Byte(this.deviceController.getByte(this.adjustAddress(address)).asNumber());
        };

        Cpu.prototype.setByte = function (address, data) {
            this.deviceController.setByte(this.adjustAddress(address), new TSOS.Byte(data.asNumber()));
        };

        Cpu.prototype.adjustAddress = function (address) {
            //We can access anything, use absolute addressing
            if (this.kernelMode) {
                return new TSOS.Short(address.asNumber());
            } else {
                var adjustedAddress = new TSOS.Short(address.asNumber() + this.lowAddress.asNumber());

                if (adjustedAddress.asNumber() > this.highAddress.asNumber()) {
                    //Segfault
                    _KernelInterruptQueue.front(new TSOS.Interrupt(5 /* SEG_FAULT */, this.kernelMode));
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
