///<reference path="deviceDriver.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/* ----------------------------------
DeviceDriverKeyboard.ts
Requires deviceDriver.ts
The Kernel Keyboard Device Driver.
---------------------------------- */
var TSOS;
(function (TSOS) {
    // Extends DeviceDriver
    var DeviceDriverKeyboard = (function (_super) {
        __extends(DeviceDriverKeyboard, _super);
        function DeviceDriverKeyboard() {
            _super.call(this, this.init, this.handleKeyPress);
        }
        DeviceDriverKeyboard.prototype.init = function () {
            this.status = "loaded";
        };

        // Turn scancode into ascii.
        // Ugly way of doing it but it works.
        DeviceDriverKeyboard.prototype.handleKeyPress = function (params) {
            //TODO: Check that they are valid and osTrapError if not.
            var scanCode = params[0];
            var isShifted = params[1];

            _Kernel.krnTrace("Scancode:" + scanCode + " shifted:" + isShifted);

            var character = "";

            //Is a character
            if ((scanCode >= 65) && (scanCode <= 90)) {
                //If it is lower case, add 32 to get the ASCII lowercase character
                if (!isShifted) {
                    character = String.fromCharCode(scanCode + 32);
                } else {
                    character = String.fromCharCode(scanCode);
                }
            } else if ((scanCode >= 48) && (scanCode <= 57)) {
                //If it is not shifted, the ASCII code is already correct
                if (!isShifted) {
                    character = String.fromCharCode(scanCode);
                } else {
                    switch (scanCode) {
                        case 48:
                            character = ')';
                            break;
                        case 49:
                            character = '!';
                            break;
                        case 50:
                            character = '@';
                            break;
                        case 51:
                            character = '#';
                            break;
                        case 52:
                            character = '$';
                            break;
                        case 53:
                            character = '%';
                            break;
                        case 54:
                            character = '^';
                            break;
                        case 55:
                            character = '&';
                            break;
                        case 56:
                            character = '*';
                            break;
                        case 57:
                            character = '(';
                            break;
                    }
                }
            } else if ((scanCode >= 186) && (scanCode <= 192) || ((scanCode >= 219) && scanCode <= 222)) {
                if (!isShifted) {
                    switch (scanCode) {
                        case 186:
                            character = ';';
                            break;
                        case 187:
                            character = '=';
                            break;
                        case 188:
                            character = ',';
                            break;
                        case 189:
                            character = '-';
                            break;
                        case 190:
                            character = '.';
                            break;
                        case 191:
                            character = '/';
                            break;
                        case 219:
                            character = '[';
                            break;
                        case 220:
                            character = '\\';
                            break;
                        case 221:
                            character = ']';
                            break;
                        case 222:
                            character = '\'';
                            break;
                    }
                } else {
                    switch (scanCode) {
                        case 186:
                            character = ':';
                            break;
                        case 187:
                            character = '+';
                            break;
                        case 188:
                            character = '<';
                            break;
                        case 189:
                            character = '_';
                            break;
                        case 190:
                            character = '>';
                            break;
                        case 191:
                            character = '?';
                            break;
                        case 219:
                            character = '{';
                            break;
                        case 220:
                            character = '|';
                            break;
                        case 221:
                            character = '}';
                            break;
                        case 222:
                            character = '"';
                            break;
                    }
                }
            } else if ((scanCode == 32) || (scanCode == 13) || (scanCode == 27) || (scanCode == 8)) {
                character = String.fromCharCode(scanCode);
            }
            _KernelInputQueue.enqueue(character);
        };
        return DeviceDriverKeyboard;
    })(TSOS.DeviceDriver);
    TSOS.DeviceDriverKeyboard = DeviceDriverKeyboard;
})(TSOS || (TSOS = {}));
