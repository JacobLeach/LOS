var TSOS;
(function (TSOS) {
    var liblos = (function () {
        function liblos() {
        }
        liblos.loadProgram = function () {
            _KernelInterruptQueue.enqueue(new TSOS.Interrupt(2 /* SYSTEM_CALL */, [5, true]));
            return _Kernel.forkExec();
        };

        liblos.runProgram = function (pid) {
            _Kernel.runProgram(pid);
        };

        liblos.putString = function () {
            //_Kernel.contextSwitch(_Kernel.getShellPid());
            _KernelInterruptQueue.enqueue(new TSOS.Interrupt(2 /* SYSTEM_CALL */, [4, true]));
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
