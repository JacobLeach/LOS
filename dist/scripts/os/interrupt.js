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
        InterruptType[InterruptType["TIMER"] = 0] = "TIMER";
        InterruptType[InterruptType["KEYBOARD"] = 1] = "KEYBOARD";
        InterruptType[InterruptType["SYSTEM_CALL"] = 2] = "SYSTEM_CALL";
        InterruptType[InterruptType["BREAK"] = 3] = "BREAK";
        InterruptType[InterruptType["RETURN"] = 4] = "RETURN";
        InterruptType[InterruptType["SEG_FAULT"] = 5] = "SEG_FAULT";
        InterruptType[InterruptType["INVALID_OP"] = 6] = "INVALID_OP";
    })(TSOS.InterruptType || (TSOS.InterruptType = {}));
    var InterruptType = TSOS.InterruptType;
})(TSOS || (TSOS = {}));
