/* ------------
PCB.ts
A Proccess Control Block
------------ */
var TSOS;
(function (TSOS) {
    var PCB = (function () {
        function PCB(memoryBounds) {
            this.programCounter = new TSOS.Short(0);
            this.accumulator = new TSOS.Byte(0);
            this.xRegister = new TSOS.Byte(0);
            this.yRegister = new TSOS.Byte(0);
            this.zFlag = false;
            this.kernelMode = false;

            this.memoryBounds = memoryBounds;
            this.pid = PCB.next_pid++;
            this.disk = false;
        }
        PCB.prototype.toString = function () {
            var print = "";
            print += "Pid: " + this.getPid();
            print += "\nPC: " + this.getProgramCounter().asNumber().toString(16);
            print += "\nACC: " + this.getAccumulator().asNumber().toString(16);
            print += "\nX: " + this.getXRegister().asNumber().toString(16);
            print += "\nY: " + this.getYRegister().asNumber().toString(16);
            print += "\nZ: " + this.getZFlag();
            print += "\nKernel Mode: " + this.getKernelMode();
            print += "\nbase: " + ((this.memoryBounds != undefined) ? this.getLowAddress().asNumber().toString(16) : "");
            print += "\nlimit: " + ((this.memoryBounds != undefined) ? this.getHighAddress().asNumber().toString(16) : "");

            return print;
        };

        PCB.prototype.onDisk = function () {
            this.disk = true;
        };

        PCB.prototype.inMemory = function () {
            this.disk = false;
        };

        PCB.prototype.isOnDisk = function () {
            return this.disk;
        };

        PCB.prototype.updatePCB = function () {
            this.setProgramCounter(_CPU.programCounter);
            this.setAccumulator(_CPU.accumulator);
            this.setXRegister(_CPU.xRegister);
            this.setYRegister(_CPU.yRegister);
            this.setZFlag(_CPU.zFlag);
            this.setKernelMode(_CPU.kernelMode);
        };

        PCB.prototype.setCPU = function () {
            _CPU.programCounter = this.getProgramCounter();
            _CPU.accumulator = this.getAccumulator();
            _CPU.xRegister = this.getXRegister();
            _CPU.yRegister = this.getYRegister();
            _CPU.zFlag = this.getZFlag();
            _CPU.kernelMode = this.getKernelMode();
            _CPU.lowAddress = this.getLowAddress();
            _CPU.highAddress = this.getHighAddress();
        };

        PCB.prototype.getSegment = function () {
            return this.memoryBounds.getSegment();
        };

        PCB.prototype.getBounds = function () {
            return this.memoryBounds;
        };

        PCB.prototype.getBase = function () {
            return this.memoryBounds.lower();
        };

        PCB.prototype.getPid = function () {
            return this.pid;
        };

        PCB.prototype.getProgramCounter = function () {
            return this.programCounter;
        };

        PCB.prototype.getAccumulator = function () {
            return this.accumulator;
        };

        PCB.prototype.getXRegister = function () {
            return this.xRegister;
        };

        PCB.prototype.getYRegister = function () {
            return this.yRegister;
        };

        PCB.prototype.getZFlag = function () {
            return this.zFlag;
        };

        PCB.prototype.getKernelMode = function () {
            return this.kernelMode;
        };

        PCB.prototype.getLowAddress = function () {
            return this.memoryBounds.lower();
        };

        PCB.prototype.getHighAddress = function () {
            return this.memoryBounds.upper();
        };

        PCB.prototype.setSegment = function (segment) {
            this.memoryBounds = segment;
        };

        PCB.prototype.setProgramCounter = function (data) {
            this.programCounter = data;
        };

        PCB.prototype.setAccumulator = function (data) {
            this.accumulator = data;
        };

        PCB.prototype.setXRegister = function (data) {
            this.xRegister = data;
        };

        PCB.prototype.setYRegister = function (data) {
            this.yRegister = data;
        };

        PCB.prototype.setZFlag = function (data) {
            this.zFlag = data;
        };

        PCB.prototype.setKernelMode = function (data) {
            this.kernelMode = data;
        };
        PCB.next_pid = 0;
        return PCB;
    })();
    TSOS.PCB = PCB;
})(TSOS || (TSOS = {}));
