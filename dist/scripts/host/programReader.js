var TSOS;
(function (TSOS) {
    var ProgramReader = (function () {
        function ProgramReader() {
            this.address = new TSOS.Byte(0);
        }
        ProgramReader.prototype.setAddress = function (address) {
            this.address = address;
        };

        ProgramReader.prototype.getByte = function () {
            var code = document.getElementById("taProgramInput").value;
            code = code.replace(/ /g, '');
            code = code.replace(/\n/g, '');

            var index = this.address.asNumber() * 2;
            var first = code[index];
            var second = code[index + 1];

            var asNumber = parseInt((first + second), 16);

            return new TSOS.Byte(asNumber);
        };
        return ProgramReader;
    })();
    TSOS.ProgramReader = ProgramReader;
})(TSOS || (TSOS = {}));
