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
        return ProgramReader;
    })();
    TSOS.ProgramReader = ProgramReader;
})(TSOS || (TSOS = {}));
