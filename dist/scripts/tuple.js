var TSOS;
(function (TSOS) {
    var Tuple = (function () {
        function Tuple(first, second) {
            this.first = first;
            this.second = second;
        }
        return Tuple;
    })();
    TSOS.Tuple = Tuple;
})(TSOS || (TSOS = {}));
