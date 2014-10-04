var TSOS;
(function (TSOS) {
    var liblos = (function () {
        function liblos() {
        }
        liblos.shutdown = function () {
            _Kernel.shutdown();
        };

        liblos.clockTick = function () {
            _Kernel.clockTick();
        };
        return liblos;
    })();
    TSOS.liblos = liblos;
})(TSOS || (TSOS = {}));
