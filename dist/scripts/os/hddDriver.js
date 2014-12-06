var TSOS;
(function (TSOS) {
    var HDDDriver = (function () {
        function HDDDriver(hdd) {
            this.hdd = hdd;
        }
        HDDDriver.prototype.format = function () {
            for (var i = 0; i < HDDDriver.TRACKS; i++) {
                for (var j = 0; j < HDDDriver.SECTORS; j++) {
                    for (var k = 0; k < HDDDriver.BLOCKS; k++) {
                        this.hdd.setBlock(i, j, k, this.formattedBlock());
                    }
                }
            }

            this.displayHDD();
        };

        HDDDriver.prototype.createFile = function (name) {
            var toReturn = false;

            if (!this.fileExists(name)) {
                for (var i = 0; i < HDDDriver.SECTORS; i++) {
                    for (var j = 1; j < HDDDriver.BLOCKS; j++) {
                        if (!this.inUse(0, i, j)) {
                            var bytes = [];
                            bytes[0] = new TSOS.Byte(1);
                            bytes[1] = new TSOS.Byte(0);
                            bytes[2] = new TSOS.Byte(0);
                            bytes[3] = new TSOS.Byte(0);

                            for (var l = 0; l < name.length; l++) {
                                bytes[l + 4] = new TSOS.Byte(name.charCodeAt(l));
                            }

                            this.hdd.setBlock(0, i, j, bytes);
                            this.displayHDD();
                            return true;
                        }
                    }
                }
            }

            return toReturn;
        };

        HDDDriver.prototype.deleteFile = function (name) {
            return false;
        };

        HDDDriver.prototype.readFile = function (name) {
            return [];
        };

        HDDDriver.prototype.writeFile = function (name, data) {
            if (this.fileExists(name)) {
                var address = this.findFile(name);
                var cur = this.hdd.getBlock(address.track, address.sector, address.block);

                var block = this.findEmptyBlock();

                cur[1] = new TSOS.Byte(block.track);
                cur[2] = new TSOS.Byte(block.sector);
                cur[3] = new TSOS.Byte(block.block);
                this.hdd.setBlock(address.track, address.sector, address.block, cur);
                var done = 0;

                while (done < data.length) {
                    if (data.length - done > 60) {
                        var toPut = data.slice(done, done + 60);
                        this.hdd.setBlock(block.track, block.sector, block.block, [new TSOS.Byte(1)]);

                        var temp = this.findEmptyBlock();
                        toPut.unshift(new TSOS.Byte(temp.block));
                        toPut.unshift(new TSOS.Byte(temp.sector));
                        toPut.unshift(new TSOS.Byte(temp.track));
                        toPut.unshift(new TSOS.Byte(1));

                        this.hdd.setBlock(block.track, block.sector, block.block, toPut);

                        block = temp;
                    } else {
                        var toPut = data.slice(done);
                        toPut.unshift(new TSOS.Byte(0));
                        toPut.unshift(new TSOS.Byte(0));
                        toPut.unshift(new TSOS.Byte(0));
                        toPut.unshift(new TSOS.Byte(1));

                        this.hdd.setBlock(block.track, block.sector, block.block, toPut);
                    }

                    done += 60;
                }
            } else {
                return false;
            }

            this.displayHDD();
        };

        //******************************** Helper Funnctions ********************************
        HDDDriver.prototype.formattedBlock = function () {
            var block = [];

            for (var i = 0; i < HDDDriver.BLOCK_SIZE; i++) {
                block[i] = new TSOS.Byte(0);
            }

            return block;
        };

        HDDDriver.prototype.displayHDD = function () {
            document.getElementById("hdd").value = this.hdd.toString();
        };

        HDDDriver.prototype.inUse = function (track, sector, block) {
            return (this.hdd.getBlock(track, sector, block)[0].asNumber() == 1);
        };

        HDDDriver.prototype.fileExists = function (name) {
            return (this.findFile(name) == undefined) ? false : true;
        };

        HDDDriver.prototype.findFile = function (name) {
            var toReturn = undefined;

            for (var i = 0; i < HDDDriver.SECTORS; i++) {
                for (var j = 1; j < HDDDriver.BLOCKS; j++) {
                    var bytes = this.hdd.getBlock(0, i, j);
                    var k = 4;
                    var storedName = "";

                    while (bytes[k].asNumber() != 0) {
                        storedName += String.fromCharCode(bytes[k].asNumber());
                        k++;
                    }

                    if (name == storedName) {
                        toReturn = new Address(0, i, j);
                    }
                }
            }

            return toReturn;
        };

        HDDDriver.prototype.nextBlock = function (address) {
            var bytes = this.hdd.getBlock(address.track, address.sector, address.block);
            var next = new Address(bytes[1].asNumber(), bytes[2].asNumber(), bytes[3].asNumber());

            if (next.track == 0 && next.sector == 0, next.block == 0) {
                return undefined;
            } else {
                return next;
            }
        };

        HDDDriver.prototype.findEmptyBlock = function () {
            for (var i = 1; i < HDDDriver.TRACKS; i++) {
                for (var j = 0; j < HDDDriver.SECTORS; j++) {
                    for (var k = 0; k < HDDDriver.BLOCKS; k++) {
                        var bytes = this.hdd.getBlock(i, j, k);
                        if (bytes[0].asNumber() == 0) {
                            return new Address(i, j, k);
                        }
                    }
                }
            }

            return undefined;
        };
        HDDDriver.TRACKS = 4;
        HDDDriver.SECTORS = 8;
        HDDDriver.BLOCKS = 8;
        HDDDriver.BLOCK_SIZE = 64;
        return HDDDriver;
    })();
    TSOS.HDDDriver = HDDDriver;

    var Address = (function () {
        function Address(track, sector, block) {
            this.track = track;
            this.sector = sector;
            this.block = block;
        }
        return Address;
    })();
})(TSOS || (TSOS = {}));
