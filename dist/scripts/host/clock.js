var TSOS;
(function (TSOS) {
    var Clock = (function () {
        function Clock(cpu, speed) {
            this.clockId = setInterval(cpu.tick, speed);
        }
        Clock.prototype.stop = function () {
            clearInterval(this.clockId);
        };
        return Clock;
    })();
    TSOS.Clock = Clock;
})(TSOS || (TSOS = {}));
