/*global $*/
/**
 * Represents a Calendar object in Javascript object.
 */
var ScheduleModel = (function ($) {

    /**
     * Constructor
     *
     * @param taskListId - task list id of the task which this schedule was prioritized for. null if none
     * @param taskId
     * @param title
     * @param startTime javascript Date type
     * @param endTime javascript Date type
     * @param isTemporary true to indicate this schedule has not yet been confirmed to be persisted
     * @constructor
     */
    var ScheduleModel = function (taskListId, taskId, title, startTime, endTime, isTemporary) {
        this.taskListId = taskListId;
        this.taskId = taskId;
        this.title = title;
        this.startDateTime = startTime;
        this.endDateTime = endTime;
        this.temporary = isTemporary;
        this.googleCalendarId = null;
        // Initialise to all change confirmed. false if there is a change to be confirmed.
        this.isChangeConfirmed = true;
    };

    /**
     * Specifies the constant for an attribute in schedule model to indicate the original start date time of a schedule
     * moving in progress.
     *
     * @type {string}
     */
    ScheduleModel.prototype.DRAG_ORIGINAL_START_DATETIME = 'drag.originalStartDateTime';

    /**
     * Specifies the constant for an attribute in schedule model to indicate the original start date time of a schedule
     * moving in progress.
     *
     * @type {string}
     */
    ScheduleModel.prototype.DRAG_ORIGINAL_END_DATETIME = 'drag.originalEndDateTime';

    ScheduleModel.prototype.setChangeConfirmed = function (isChangeConfirmed) {
        this.isChangeConfirmed = isChangeConfirmed;
    };

    ScheduleModel.prototype.isChangeConfirmed = function () {
        return this.isChangeConfirmed;
    };

    ScheduleModel.prototype.getStartDateTime = function () {
        return this.startDateTime;
    };

    /**
     * Sets the given new Date to this schedule
     *
     * @param newDateTime Date javascript date type
     */
    ScheduleModel.prototype.setStartDateTime = function (newDateTime) {
        this.startDateTime = newDateTime;
    };

    ScheduleModel.prototype.getEndDateTime = function () {
        return this.endDateTime;
    };

    /**
     * Sets the given new Date to this schedule
     *
     * @param newDateTime Date javascript date type
     */
    ScheduleModel.prototype.setEndDateTime = function (newDateTime) {
        this.endDateTime = newDateTime;
    };

    ScheduleModel.prototype.getScheduleId = function () {
        if (this.temporary) {
            return this.taskListId.concat('-', this.taskId);
        }
        return this.googleCalendarId;
    };

    /**
     * To String
     *
     * @returns {string}
     */
    ScheduleModel.prototype.toString = function () {
        return this.title.concat(', ', this.taskListId, ', ', this.taskId, ', ', this.startDateTime, ', ',
            this.endDateTime, ', #', ', ', this.googleCalendarId, ', ', this.temporary);
    };

    return ScheduleModel;
}($));

/**
 * ScheduleDAO defines object which translate calendar object between DOM and javascript.
 * It's also responsible for communication who other DAO.
 *
 * @type {Function}
 */
var ScheduleDAO = (function ($) {

    var ScheduleDAO = function (utils, timeUtils) {
        this.utils = utils;
        this.timeUtils = timeUtils;
    };


    ScheduleDAO.prototype.getCalendarId = function () {
        var calendarId = $('#calendar-id').text();
        if (calendarId) {
            return calendarId;
        }
        return false;
    };

    /**
     * Given the DOM object which represents this scheduleModel.
     *
     * This DAO sync'es the schedule to update it's corresponding DOM object.
     *
     * This re-create a new DOM object and replace the existing one every time saveToDOM is invoked. This can be
     * dangerous because DOM is shared between model and view.
     *
     * @param scheduleModel
     * @return boolean true if successful
     */
    ScheduleDAO.prototype.saveToDOM = function (scheduleModel) {
        var scheduleChip, scheduleChipWrapper;
        scheduleChipWrapper = document.getElementById('schedule-chip-wrapper');

        scheduleChip = document.getElementById(scheduleModel.googleCalendarId);
        if (scheduleChip === null) {
            scheduleChip = document.createElement('div');
            scheduleChipWrapper.appendChild(scheduleChip);
        }

        // Set Model data on attribute
        scheduleChip.setAttribute('id', scheduleModel.getScheduleId());
        scheduleChip.setAttribute('taskListId', scheduleModel.taskListId);
        scheduleChip.setAttribute('taskId', scheduleModel.taskId);
        scheduleChip.setAttribute('title', scheduleModel.title);
        scheduleChip.setAttribute('startDate', scheduleModel.getStartDateTime().toISOString());
        scheduleChip.setAttribute('endDate', scheduleModel.getEndDateTime().toISOString());
        scheduleChip.setAttribute('isChangeConfirmed', scheduleModel.isChangeConfirmed);
        scheduleChip.setAttribute('temporary', scheduleModel.temporary);

        return true;
    };

    /**
     * Given the schedule Id of a schedule, it returns the schedule model based on all information in schedule DOM.
     *
     * Returns null if there is no schedule with such id.
     *
     * @param scheduleId of schedule to be fetched from DOM
     */
    ScheduleDAO.prototype.getScheduleFromDOM = function (scheduleId) {
        var existingScheduleNode, existingScheduleModel, taskListId, taskId, title, isTemporary, startDateTime,
            startDateISOString, endDateTime, endDateISOString, isTemporaryAttribute, isChangeConfirmedAttribute, isChangeConfirmed;
        existingScheduleNode = document.getElementById(scheduleId);

        if (existingScheduleNode === null) {
            return null;
        }

        isTemporaryAttribute = existingScheduleNode.getAttribute('isTemporary');
        isTemporary = false;
        if (isTemporaryAttribute === 'true') {
            isTemporary = true;
        }

        isChangeConfirmedAttribute = existingScheduleNode.getAttribute('isChangeConfirmed');
        isChangeConfirmed = false;
        if (isChangeConfirmedAttribute === 'true') {
            isChangeConfirmed = true;
        }

        taskListId = existingScheduleNode.getAttribute('taskListId');
        taskId = existingScheduleNode.getAttribute('taskId');
        title = existingScheduleNode.innerText;
        startDateISOString = existingScheduleNode.getAttribute('startDate');
        endDateISOString = existingScheduleNode.getAttribute('endDate');
        startDateTime = new Date(startDateISOString);
        endDateTime = new Date(endDateISOString);
        existingScheduleModel = new ScheduleModel(taskListId, taskId, title, startDateTime, endDateTime, isTemporary);
        existingScheduleModel.googleCalendarId = existingScheduleNode.getAttribute('id');
        return existingScheduleModel;
    };

    /**
     * Deletes the given schedule model based on it's id. Throws an error if it's not found.
     *
     * @param scheduleModelId
     * @return boolean true if successful
     */
    ScheduleDAO.prototype.deleteFromDOM = function (scheduleModelId) {
        var scheduleModelDOMObject, parentElement;

        scheduleModelDOMObject = document.getElementById(scheduleModelId);

        if (scheduleModelDOMObject === null) {
            throw 'The given schedule model cannot be found from DOM.';
        }

        parentElement = scheduleModelDOMObject.parentElement;
        parentElement.removeChild(scheduleModelDOMObject);

        return true;
    };

    /**
     * This when invoked fetches the schedule for today, and returns a list of ScheduleModel
     *
     * @return ScheduleModel[]
     */
    ScheduleDAO.prototype.getSchedulesForTodayFromAPI = function () {
        var calendarId, url, functionCreateScheduleFromJSON, functionTransformSchedules;

        calendarId = this.getCalendarId();
        if (!calendarId) {
            throw "Calendar ID cannot be found!";
        }

        url = '/api/calendar/'.concat(calendarId);

        functionCreateScheduleFromJSON = function (scheduleInJSON) {
            var scheduleModel, googleCalendarId, title, startDateTime, endDateTime, taskIdLinkString, taskIdArray,
                taskListId, taskId;

            // Get the attributes
            googleCalendarId = scheduleInJSON.scheduleId;
            title = scheduleInJSON.priorityName;
            startDateTime = new Date(scheduleInJSON.startTime);
            endDateTime = new Date(scheduleInJSON.endTime);

            taskIdLinkString = scheduleInJSON.taskIdLink;

            if (taskIdLinkString !== null) {
                taskIdArray = taskIdLinkString.split('-');
                taskListId = taskIdArray[0];
                taskId = taskIdArray[1];
            } else {
                taskListId = null;
                taskId = null;
            }

            scheduleModel = new ScheduleModel(taskListId, taskId, title, startDateTime, endDateTime, false);
            scheduleModel.googleCalendarId = googleCalendarId;

            return scheduleModel;
        };

        functionTransformSchedules = function (data) {
            var schedulesInJSON, i, scheduleModels;
            schedulesInJSON = JSON.parse(data);
            scheduleModels = [];
            for (i = 0; i < schedulesInJSON.length; i++) {
                scheduleModels[i] = functionCreateScheduleFromJSON(schedulesInJSON[i]);
            }
            return scheduleModels;
        };

        return this.utils.makeRequest(url, 'GET', null).promise().then(functionTransformSchedules);
    };

    /**
     * This talks to the Calendar API to have the given schedule persisted in Google Calendar
     *
     * Since this is a new ScheduleModel. It does not have a google Calendar Id. If update was successful, then this
     * property will be update.
     *
     * @param newSchedule
     * @return promiseHandle, which passes you either null | ScheduleModel
     */
    ScheduleDAO.prototype.save = function (newSchedule) {
        var summaryValue, dateValue, timeValue, taskIdLinkValue, data, url, calendarId, updateSchedule;
        // Always assume true for now.

        calendarId = this.getCalendarId();
        if (!calendarId) {
            throw "Calendar ID cannot be found!";
        }
        summaryValue = newSchedule.title;
        dateValue = newSchedule.getStartDateTime().toISOString().split('T')[0];
        timeValue = newSchedule.getStartDateTime().toISOString().split('T')[1].split(':00.000Z')[0];
        if (newSchedule.taskListId !== null && newSchedule.taskId !== null) {
            taskIdLinkValue = newSchedule.taskListId.concat('-').concat(newSchedule.taskId);
        } else {
            taskIdLinkValue = '';
        }
        data = {summary : summaryValue, date: dateValue, time: timeValue, taskIdLink: taskIdLinkValue};
        url = "/api/calendar/".concat(calendarId, '/');

        updateSchedule = (function () {
            var newScheduleForClosure = newSchedule;

            return function (data) {
                var newScheduleJsonFromAPI;
                if (data === '-1') {
                    return null;
                }

                newScheduleJsonFromAPI = JSON.parse(data);
                newScheduleForClosure.googleCalendarId = newScheduleJsonFromAPI.scheduleId;
                newScheduleForClosure.isTemporary = false;
                return newScheduleForClosure;

            };
        }());
        return this.utils.makeRequest(url, 'POST', data, null).promise().then(updateSchedule);
    };

    /**
     * Given an existing schedule, it triggers an update to the the backend API.
     *
     * @param updatedSchedule
     * @returns PromiseHandle
     */
    ScheduleDAO.prototype.updateScheduleToAPI = function (updatedSchedule) {
        var summaryValue, dateValue, timeValue, taskIdLinkValue, data, url, calendarId;
        // Always assume true for now.

        calendarId = this.getCalendarId();
        if (!calendarId) {
            throw "Calendar ID cannot be found!";
        }
        summaryValue = updatedSchedule.title;
        dateValue = updatedSchedule.getStartDateTime().toISOString().split('T')[0];
        timeValue = updatedSchedule.getStartDateTime().toISOString().split('T')[1].split(':00.000Z')[0];
        if (updatedSchedule.taskListId !== null && updatedSchedule.taskId !== null) {
            taskIdLinkValue = updatedSchedule.taskListId.concat('-').concat(updatedSchedule.taskId);
        } else {
            taskIdLinkValue = '';
        }

        data = {summary : summaryValue, date: dateValue, time: timeValue, taskIdLink: taskIdLinkValue};
        url = "/api/calendar/".concat(calendarId, '/').concat(updatedSchedule.googleCalendarId);
        return this.utils.makeRequest(url, 'PUT', data, null).promise();
    };

    /**
     * This when invoked deletes the given schedule from API.
     *
     * @param scheduleToDelete ScheduleModel
     * @return PromiseHandle/boolean true if delete was successful, false otherwise
     */
    ScheduleDAO.prototype.unplanFromAPI = function (scheduleToDelete) {
        var url, calendarId, functionProcessReturnValue;

        calendarId = this.getCalendarId();
        if (!calendarId) {
            throw "Calendar ID cannot be found!";
        }

        url = "/api/calendar/".concat(calendarId, '/').concat(scheduleToDelete.googleCalendarId);

        functionProcessReturnValue = function (data) {
            if (data === '1') {
                return true;
            }
            return false;
        };

        return this.utils.makeRequest(url, 'DELETE', null, null).promise().then(functionProcessReturnValue,
            functionProcessReturnValue);
    };

    return ScheduleDAO;

}($));