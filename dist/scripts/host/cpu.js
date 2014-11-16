/* ------------
CPU.ts
A basic modifed 6502 CPU simulation.
------------ */
var TSOS;
(function (TSOS) {
    var Interrupt;
    (function (Interrupt) {
        Interrupt[Interrupt["SegmentationFault"] = 0] = "SegmentationFault";
        Interrupt[Interrupt["Break"] = 1] = "Break";
        Interrupt[Interrupt["Software"] = 2] = "Software";
        Interrupt[Interrupt["Clock"] = 3] = "Clock";
        Interrupt[Interrupt["Return"] = 4] = "Return";
    })(Interrupt || (Interrupt = {}));

    var Cpu = (function () {
        function Cpu() {
            this.programCounter = new TSOS.Short(0);
            this.accumulator = new TSOS.Byte(0);
            this.xRegister = new TSOS.Byte(0);
            this.yRegister = new TSOS.Byte(0);
            this.zFlag = false;
            this.cFlag = false;
            this.kernelMode = false;
            this.lowAddress = new TSOS.Short(0);
            this.highAddress = new TSOS.Short(0);
            this.executing = false;
            this.interruptFlag = undefined;
            this.ignoreInterrupts = false;
            this.tickCount = _Quant;

            this.deviceController = new TSOS.DeviceController();
        }
        Cpu.prototype.start = function () {
            this.clock = new TSOS.Clock(this, CPU_CLOCK_INTERVAL);
        };

        /*
        * WARNING! WARNING! WARNING!
        * DO NOT USE "THIS." IN THE FUNCTION!
        * WARNING! WARNING! WARNING!
        *
        * Javascript is shit and this is a callback so we do not
        * have the correct this. Use _CPU instead. Fuckers.
        */
        Cpu.prototype.tick = function () {
            if (!singleStep || (singleStep && step)) {
                if (_CPU.interruptFlag != undefined) {
                    if (_CPU.interruptFlag === 0 /* SegmentationFault */) {
                        _Kernel.segmentationFault();
                    } else if (_CPU.interruptFlag === 1 /* Break */) {
                        _Kernel.programBreak();
                    } else if (_CPU.interruptFlag === 2 /* Software */) {
                        _Kernel.softwareInterrupt();
                    } else if (_CPU.interruptFlag === 3 /* Clock */) {
                        _Kernel.timerInterrupt();
                    } else if (_CPU.interruptFlag === 4 /* Return */) {
                        _Kernel.returnInterrupt();
                    }

                    _CPU.interruptFlag = undefined;
                }

                //If the previous clock cycle set the interrupt flag
                //AND a timer interrupt should have happened as well,
                //then the timer interrupt is not set and is checked here
                if (_CPU.tickCount === 0 && _CPU.interruptFlag === undefined) {
                    _Kernel.timerInterrupt();
                    _CPU.tickCount = _Quant;
                }

                /*
                * This is a hack because the kernel is not all running on this hardware.
                * When the Kernel needs to run some code on the CPU or do some task that
                * does not use the CPY at all it adds it to this queue.
                */
                if (!_CPU.ignoreInterrupts && _KernelInterruptQueue.size() > 0) {
                    _CPU.ignoreInterrupts = true;

                    /*
                    * Call the kernel function to handle the interrupts.
                    * It will make sure that the CPU is correctly setup to
                    * either run the kernel code that is needed or to do the work
                    * that the kernel needs to do (aka stuff written in typescript
                    * does not need CPU time to run)
                    */
                    _Kernel.handleKernelInterrupt(_KernelInterruptQueue.dequeue());
                }

                _CPU.cycle();

                if (!_CPU.ignoreInterrupts) {
                    _CPU.tickCount--;
                    if (_CPU.tickCount === 0 && _CPU.interruptFlag === undefined) {
                        _CPU.interruptFlag = 3 /* Clock */;
                        _CPU.tickCount = _Quant;
                    }
                }

                //Please do not hurt me for this
                document.getElementById("cpuBox").value = _CPU.toString();

                step = false;
            }
        };

        Cpu.prototype.stop = function () {
            this.clock.stop();
        };

        Cpu.prototype.interrupt = function (interrupt) {
            this.interruptFlag = interrupt;
        };

        Cpu.prototype.toString = function () {
            var cpuAsString = "";

            cpuAsString += "PC: " + this.programCounter.asNumber().toString(16);
            cpuAsString += "\nIR: " + this.instructionRegister.asNumber().toString(16);
            cpuAsString += "\nAC: " + this.accumulator.asNumber().toString(16);
            cpuAsString += "\nX: " + this.xRegister.asNumber().toString(16);
            cpuAsString += "\nY: " + this.yRegister.asNumber().toString(16);
            cpuAsString += "\nZ: " + this.zFlag;
            cpuAsString += "\nkernelMode: " + this.kernelMode;
            cpuAsString += "\ninterrupt: " + this.interruptToString();
            cpuAsString += "\nlowAddress: " + this.lowAddress.asNumber().toString(16);
            cpuAsString += "\nhighAddress: " + this.highAddress.asNumber().toString(16);

            return cpuAsString;
        };

        Cpu.prototype.interruptToString = function () {
            switch (this.interruptFlag) {
                case 0 /* SegmentationFault */:
                    return "Segmentation Fault";
                case 1 /* Break */:
                    return "Break";
                case 2 /* Software */:
                    return "Software";
                case 3 /* Clock */:
                    return "Clock";
                case 4 /* Return */:
                    return "Return";
                default:
                    return "None";
            }
        };

        Cpu.prototype.cycle = function () {
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
            this.interrupt(1 /* Break */);
        };

        Cpu.prototype.returnFromInterupt = function () {
            this.ignoreInterrupts = false;
            this.interruptFlag = 4 /* Return */;
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
            var addition = this.accumulator.asNumber() + value.asNumber();

            if (addition > 255) {
                this.cFlag = true;
            }

            this.accumulator = new TSOS.Byte(addition % 256);
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
                this.programCounter = new TSOS.Short((this.programCounter.asNumber() + branchAmount) % 256);
                console.log("FUCK YUOU: " + this.programCounter.asNumber());
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
            this.interrupt(2 /* Software */);
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
                    this.interrupt(0 /* SegmentationFault */);
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
