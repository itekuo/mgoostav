$(function ($) {

    var utils = new Utils();

    var Calendar = function() {
        this.initialised = false;
    }
    Calendar.prototype.getCalendarId = function() {
        var calendarId = $('#calendar-id').val();
        if (calendarId) {
            return window.btoa(calendarId);
        }
        else {
            return false;
        }
    }
    Calendar.prototype.initialise = function() {
        $('#calendarGetForm').submit(function (e) {
            var calendarId =  calendarApi.getCalendarId();
            if (!calendarId) {
                e.preventDefault();
                return;
            }
            // Parse a date in the format
            var date = $('#getFormDate').val();
            var parts = date.split('-');
            var year = parts[0];
            var month = parts[1];
            var date = parts[2];

            var url = '/api/calendar/'.concat(calendarId, '/', year, '/', month, '/', date);
            utils.makeRequest(url, 'GET', null, utils.updateResult);
            e.preventDefault();
        });

        $('#calendarAddForm').submit(function (e) {
            var calendarId = calendarApi.getCalendarId();
            if (!calendarId) {
                e.preventDefault();
                return;
            }
            var summaryValue = $('#addFormSummary').val();
            var dateValue = $('#addFormDate').val();
            var timeValue = $('#addFormTime').val();
            var data = {summary : summaryValue, date: dateValue, time: timeValue};
            var url = "/api/calendar/".concat(calendarId, '/');
            utils.makeRequest(url, 'POST', data, utils.updateResult);
            e.preventDefault();

        });

        $('#calendarDeleteForm').submit(function (e) {
            var calendarId = calendarApi.getCalendarId();
            if (!calendarId) {
                e.preventDefault();
                return;
            }
            var idToDelete = $('#deleteFormId').val();
            var url = "/api/calendar/".concat(calendarId, '/', idToDelete);
            utils.makeRequest(url, 'DELETE', null, utils.updateResult);
            e.preventDefault();
        });

        $('#calendarChangeForm').submit(function (e) {
            var calendarId = calendarApi.getCalendarId();
            if (!calendarId) {
                e.preventDefault();
                return;
            }

            var idToChange = $('#changeFormId').val();
            var url = "/api/calendar/".concat(calendarId, '/', idToChange);

            var summaryValue = $('#changeFormSummary').val();
            var dateValue = $('#changeFormDate').val();
            var timeValue = $('#changeFormTime').val();
            var data = {summary : summaryValue, date: dateValue, time: timeValue};

            utils.makeRequest(url, 'PUT', data, utils.updateResult);
            e.preventDefault();
        });
        this.initialised = true;
    }

    var calendarApi = new Calendar();

    /** TASK API */
    var Task = function() {
        this.initialised = false;
    }

    Task.prototype.getTaskListId = function() {
        var taskListId = $('#task-list-id').val();
        if (taskListId) {
            return window.btoa(taskListId);
        }
        else {
            return false;
        }
    }

    Task.prototype.initialise = function() {
        /* Tasks API Ajax */
        $('#taskGetForm').submit(function(e) {
            var url = '/api/task/'.concat(taskListId);

            utils.makeRequest(url, 'GET', null, utils.updateResult);
            e.preventDefault();
        });
    }


    var taskApi = new Task();

    /** API Switch */
    $('#calendar-api').click(function(e) {
        var url = '/admin/calendar';

        var functionChain = function(data) {
            $('#api-section').html(data);
            calendarApi.initialise();
        };

        utils.makeRequest(url, 'GET', null, functionChain);
        $('#calendar-api').addClass('active');
        $('#task-api').removeClass('active');
        e.preventDefault();
    });
    $('#task-api').click(function(e) {
        var url = '/admin/task';

        var functionChain = function(data) {
            $('#api-section').html(data);
            taskApi.initialise();
        };

        utils.makeRequest(url, 'GET', null, functionChain);
        $('#task-api').addClass('active');
        $('#calendar-api').removeClass('active');
        e.preventDefault();
    });
});


