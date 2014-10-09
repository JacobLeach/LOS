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
        }
        MemoryManager.prototype.isReserved = function (segment) {
            return this.memorySegments[segment];
        };

        MemoryManager.prototype.allocate = function () {
            for (var i = 0; i < this.memorySegments.length; i++) {
                if (!this.memorySegments[i] || this.memorySegments[i] === undefined) {
                    return this.reserve(i);
                }
            }

            return undefined;
        };

        MemoryManager.prototype.reserve = function (segment) {
            this.memorySegments[segment] = true;

            return this.getBounds(segment);
        };

        MemoryManager.prototype.getBounds = function (segment) {
            var toReturn;

            var lowerBound = segment * MemoryManager.SEGMENT_SIZE;
            var upperBound = lowerBound + MemoryManager.SEGMENT_SIZE - 1;

            toReturn = new MemoryBounds(segment, new TSOS.Short(lowerBound), new TSOS.Short(upperBound));

            return toReturn;
        };

        MemoryManager.prototype.deallocate = function (segment) {
            if (segment < 0 || segment > this.memorySegments.length || !this.memorySegments[segment]) {
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
        function MemoryBounds(segment, lowerBound, upperBound) {
            this.segment = segment;
            this.lowerBound = lowerBound;
            this.upperBound = upperBound;
        }
        MemoryBounds.prototype.getSegment = function () {
            return this.segment;
        };

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
