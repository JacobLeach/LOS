/*
* MemoryManager.ts
*
* A memory manager object. Handles allocating and deallocating memory.
*/
var TSOS;
(function (TSOS) {
    var MemoryManager = (function () {
        function MemoryManager() {
            this.memorySegments = [];
            this.memorySegments[3] = true;
        }
        MemoryManager.prototype.allocate = function () {
            var toReturn = undefined;

            for (var i = 0; i < this.memorySegments.length; i++) {
                if (!this.memorySegments[i] || this.memorySegments[i] === undefined) {
                    var lowerBound = i * MemoryManager.SEGMENT_SIZE;
                    var upperBound = lowerBound + MemoryManager.SEGMENT_SIZE - 1;

                    toReturn = new MemoryBounds(new TSOS.Short(lowerBound), new TSOS.Short(upperBound));
                    this.memorySegments[i] = true;

                    break;
                }
            }
            return toReturn;
        };

        MemoryManager.prototype.deallocate = function (segment) {
            if (segment < 0 || segment > this.memorySegments.length || !this.memorySegments[segment] || segment == 3) {
                //SEGFAULT
            } else {
                this.memorySegments[segment] = false;
            }
        };
        MemoryManager.SEGMENT_SIZE = 256;
        return MemoryManager;
    })();
    TSOS.MemoryManager = MemoryManager;

    var MemoryBounds = (function () {
        function MemoryBounds(lowerBound, upperBound) {
            this.lowerBound = lowerBound;
            this.upperBound = upperBound;
        }
        MemoryBounds.prototype.lower = function () {
            return this.lowerBound;
        };

        MemoryBounds.prototype.upper = function () {
            return this.upperBound;
        };
        return MemoryBounds;
    })();
    TSOS.MemoryBounds = MemoryBounds;
})(TSOS || (TSOS = {}));
