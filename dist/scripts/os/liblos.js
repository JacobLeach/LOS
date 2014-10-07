var TSOS;
(function (TSOS) {
    var liblos = (function () {
        function liblos() {
        }
        liblos.loadProgram = function () {
            _KernelInterruptQueue.enqueue(new TSOS.Interrupt(2 /* SYSTEM_CALL */, 5));
        };

        liblos.forkExec = function (program) {
            _Kernel.forkExec(program);
        };

        liblos.putString = function () {
            //_Kernel.contextSwitch(_Kernel.getShellPid());
            _KernelInterruptQueue.enqueue(new TSOS.Interrupt(2 /* SYSTEM_CALL */, 4));
        };

        liblos.clockTick = function () {
            _Kernel.clockTick();
        };

        liblos.shutdown = function () {
            _Kernel.shutdown();
        };
        return liblos;
    })();
    TSOS.liblos = liblos;
})(TSOS || (TSOS = {}));
