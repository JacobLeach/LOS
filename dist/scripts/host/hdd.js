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

        HDD.prototype.toString = function () {
            var toReturn = "";

            for (var i = 0; i < TSOS.HDDDriver.TRACKS; i++) {
                for (var j = 0; j < TSOS.HDDDriver.SECTORS; j++) {
                    for (var k = 0; k < TSOS.HDDDriver.BLOCKS; k++) {
                        var bytes = this.getBlock(i, j, k);

                        for (var l = 0; l < TSOS.HDDDriver.BLOCK_SIZE; l++) {
                            var num = bytes[i].asNumber().toString(16);
                            if (num.length == 1) {
                                toReturn += "0" + num + " ";
                            } else {
                                toReturn += num + " ";
                            }
                        }

                        toReturn += "\n";
                    }
                }
            }

            return toReturn;
        };
        return HDD;
    })();
    TSOS.HDD = HDD;
})(TSOS || (TSOS = {}));
