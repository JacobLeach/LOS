var TSOS;
(function (TSOS) {
    var liblos = (function () {
        function liblos() {
        }
        liblos.loadProgram = function () {
            return _Kernel.forkExec();
        };

        liblos.ps = function () {
            var a = _Kernel.ps();

            for (var i = 0; i < a.length; i++) {
                if (a[i] === true) {
                    TSOS.Stdio.putStringLn("Pid: " + i);
                }
            }
        };

        liblos.clearmem = function () {
            _Kernel.memoryManager.deallocate(0);
            _Kernel.memoryManager.deallocate(1);
            _Kernel.memoryManager.deallocate(2);
            this.deallocate(0);
            this.deallocate(1);
            this.deallocate(2);
        };

        liblos.runall = function () {
            _Kernel.runAll();
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

        liblos.deallocate = function (segment) {
            _KernelInterruptQueue.enqueue(new TSOS.Interrupt(2 /* SYSTEM_CALL */, [7, true, segment]));
        };

        liblos.kill = function (pid) {
            _Kernel.kill(pid);
        };
        return liblos;
    })();
    TSOS.liblos = liblos;
})(TSOS || (TSOS = {}));
