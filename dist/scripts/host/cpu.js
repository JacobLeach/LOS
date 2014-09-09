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
        };

        Cpu.prototype.cycle = function () {
            _Kernel.krnTrace('CPU cycle');
        };
        return Cpu;
    })();
    TSOS.Cpu = Cpu;
})(TSOS || (TSOS = {}));
