var TSOS;
(function (TSOS) {
    var Clock = (function () {
        function Clock(cpu, speed) {
            this.clockId = setInterval(cpu.tick, speed);
        }
        return Clock;
    })();
    TSOS.Clock = Clock;
})(TSOS || (TSOS = {}));
