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

            this.lowAddress = memoryBounds.lower();
            this.highAddress = memoryBounds.upper();
        }
        PCB.prototype.setState = function (pc, acc, x, y, z, mode, low, high) {
            this.programCounter = pc;
            this.accumulator = acc;
            this.xRegister = x;
            this.yRegister = y;
            this.zFlag = z;
            this.kernelMode = mode;
            this.lowAddress = low;
            this.highAddress = high;
        };
        return PCB;
    })();
    TSOS.PCB = PCB;
})(TSOS || (TSOS = {}));
