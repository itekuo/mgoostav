/*global $*/
/**
 * Created by user on 10/20/14.
 */
/** Call-back for updating result pane */

// Immediate self-invocation function, to setup the Utility class
var Utils = (function ($) {
    var Utils = function () {

    };
    Utils.prototype.updateResult = function (data) {
        if (data.indexOf("id=\"api-result") > -1) {
            $('#result').html(data);
        } else {
            $('#admin-body').html(data);
        }
    };

    /** */
    Utils.prototype.makeRequest = function (url, type, data, callback) {
        return $.ajax({
            url : url,
            type: type,
            data: data,
            success: callback
        }).promise();
    };

    /**
     * This binds the given new prototype to the given function pointer. This is at present found useful when adding
     * an instance event listener/handler to an element, and prevent it from being binded to the element.
     *
     * @param newPrototype
     * @param functionPointer
     */
    Utils.prototype.bindPrototype = function (newPrototype, functionPointer) {
        return functionPointer.bind(newPrototype);
    };

    return Utils;
}($));

var TimeUtils = (function ($) {
    var TimeUtils = function () {};
    /**
     * this assumes a javascript Date object, and count number of 15 minutes that has passed based on the hours & minutes
     * of the given date time. At present, this ignores the date.
     *
     * @param date object
     */
    TimeUtils.prototype.getQuarters = function (date) {
        var quarters = date.getHours() * 4;
        return quarters + (date.getMinutes() / 15);
    };

    TimeUtils.prototype.getTopValue = function (date) {
        var startQuarters = this.getQuarters(date);
        return (startQuarters - (7 * 4)) * 12 - 1;
    };

    TimeUtils.prototype.getHeightValue = function (startDate, endDate) {
        var startQuarters = this.getQuarters(startDate);
        var endQuarters = this.getQuarters(endDate);
        var heightValue = (endQuarters - startQuarters) * 12;
        return heightValue;
    };

    /**
     * Based on the given top value of a schedule event, it figures out what the time it is, and return the corresponding
     * date time.
     *
     * @param top
     * @return dateTime
     */
    TimeUtils.prototype.toStartDateTime = function (top) {
        // Assumed SGT
        var newDateTime = new Date();
        var startQuarters = ((top + 1) / 12) + 7 * 4;
        var startMinutes = startQuarters % 4 * 15;
        var startHours = (startQuarters - (startQuarters % 4)) / 4;
        newDateTime.setHours(startHours);
        newDateTime.setMinutes(startMinutes);
        newDateTime.setSeconds(0, 0);
        return newDateTime;
    };

    TimeUtils.prototype.toEndDateTime = function (top) {
        // Assumed SGT
        var endDateTime = this.toStartDateTime(top);
        endDateTime.setHours(endDateTime.getHours() + 1); // Assume right now
        return endDateTime;

    };

    return TimeUtils;

}($));
