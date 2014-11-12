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
            var toReturn = Stdio.buffer[0];
            Stdio.buffer = Stdio.buffer.substring(1, Stdio.buffer.length);

            return toReturn.charCodeAt(0);
        };

        //Wrapper to write text to output
        Stdio.putString = function (text) {
            console.log("PUT: " + text);
            for (var i = 0; i < text.length; i++) {
                Stdio.buffer += (text.charAt(i));
            }
            Stdio.buffer += String.fromCharCode(0);
            TSOS.liblos.putString();
        };

        Stdio.putStringLn = function (text) {
            console.log("PUTLN: " + text);
            for (var i = 0; i < text.length; i++) {
                Stdio.buffer += (text.charAt(i));
            }
            Stdio.buffer += String.fromCharCode(13);
            Stdio.buffer += String.fromCharCode(0);
            TSOS.liblos.putString();
        };
        Stdio.buffer = "";
        return Stdio;
    })();
    TSOS.Stdio = Stdio;
})(TSOS || (TSOS = {}));
