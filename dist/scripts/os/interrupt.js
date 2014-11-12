/* ------------
Interrupt.ts
------------ */
var TSOS;
(function (TSOS) {
    var Interrupt = (function () {
        function Interrupt(type, parameters) {
            this.interruptType = type;
            this.interruptParameters = parameters;
            this.id = Interrupt.nextId++;
        }
        Interrupt.prototype.type = function () {
            return this.interruptType;
        };

        Interrupt.prototype.parameters = function () {
            return this.interruptParameters;
        };
        Interrupt.nextId = 0;
        return Interrupt;
    })();
    TSOS.Interrupt = Interrupt;

    (function (InterruptType) {
    })(TSOS.InterruptType || (TSOS.InterruptType = {}));
    var InterruptType = TSOS.InterruptType;
})(TSOS || (TSOS = {}));
