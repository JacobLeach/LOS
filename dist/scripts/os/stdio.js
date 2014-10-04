/* ------------
Stdio.ts
Standard IO for the Terminal.
------------ */
var TSOS;
(function (TSOS) {
    var Stdio = (function () {
        function Stdio() {
        }
        Stdio.getChar = function () {
            var character = Stdio.buffer[0];
            Stdio.buffer = Stdio.buffer.substring(1, Stdio.buffer.length);
            return character.charCodeAt(0);
        };

        //Wrapper to write text to output
        Stdio.putString = function (text, terminal) {
            for (var i = 0; i < text.length; i++) {
                Stdio.buffer += (text.charAt(i));
                console.log("THIS SHIT: " + Stdio.buffer);
                _KernelInterruptQueue.enqueue(new TSOS.Interrupt(TSOS.Kernel.SYSTEM_CALL_IQR, 4));
            }
        };
        Stdio.buffer = "";
        return Stdio;
    })();
    TSOS.Stdio = Stdio;
})(TSOS || (TSOS = {}));
