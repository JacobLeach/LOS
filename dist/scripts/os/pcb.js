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
        }
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
