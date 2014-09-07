/* ------------
Stdio.ts
Standard IO for the Terminal.
------------ */
var TSOS;
(function (TSOS) {
    var Stdio = (function () {
        function Stdio() {
        }
        Stdio.putString = function (text, terminal) {
            for (var i = 0; i < text.length; i++) {
                terminal.putChar(text.charAt(i));
            }
        };
        return Stdio;
    })();
    TSOS.Stdio = Stdio;
})(TSOS || (TSOS = {}));
