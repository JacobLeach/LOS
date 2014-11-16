var TSOS;
(function (TSOS) {
    var HDD = (function () {
        function HDD() {
        }
        HDD.prototype.setBlock = function (track, sector, block, value) {
            localStorage.setItem(track.toString() + sector.toString() + block.toString(), JSON.stringify(value));
        };

        HDD.prototype.getBlock = function (track, sector, block) {
            var bytes = JSON.parse(localStorage.getItem(track.toString() + sector.toString() + block.toString()));
            var toReturn = [];

            for (var i = 0; i < bytes.length; i++) {
                toReturn.push(new TSOS.Byte(bytes[i].value));
            }

            return toReturn;
        };
        return HDD;
    })();
    TSOS.HDD = HDD;
})(TSOS || (TSOS = {}));
