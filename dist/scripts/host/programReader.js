var TSOS;
(function (TSOS) {
    var ProgramReader = (function () {
        function ProgramReader() {
            this.low = new TSOS.Byte(0);
            this.high = new TSOS.Byte(0);
        }
        ProgramReader.prototype.setLowByte = function (low) {
            this.low = low;
        };

        ProgramReader.prototype.setHighByte = function (high) {
            this.high = high;
        };

        ProgramReader.prototype.getByte = function () {
            var code = document.getElementById("taProgramInput").value;

            return new TSOS.Byte(code[TSOS.bytesToShort(this.low, this.high).asNumber()].charCodeAt(0));
        };

        ProgramReader.prototype.isValid = function () {
            var code = document.getElementById("taProgramInput").value;
            code = code.replace(/ /g, '');
            code = code.replace(/\n/g, '');
            var valid = true;

            for (var i = 0; i < code.length; i++) {
                if (!((code[i] >= '0' && code[i] <= '9') || (code[i] >= 'A' && code[i] <= 'F'))) {
                    valid = false;
                }
            }

            if (valid && (code != "") && ((code.length % 2) == 0)) {
                return new TSOS.Byte(1);
            } else {
                return new TSOS.Byte(0);
            }
        };
        return ProgramReader;
    })();
    TSOS.ProgramReader = ProgramReader;
})(TSOS || (TSOS = {}));
