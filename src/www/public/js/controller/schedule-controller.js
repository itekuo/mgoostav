/*global  $*/
/**
 * Created by tkuo on 11/29/14.
 */
var ScheduleController = (function ($) {
    var ScheduleController = function (utils, timeUtils, scheduleView, scheduleDAO) {
        this.utils = utils;
        this.timeUtils = timeUtils;
        this.scheduleDAO = scheduleDAO;
        this.scheduleView = scheduleView;
        this.hours = [
            { hour: '', id: '7am-hour-mark'},
            { hour: '8 am', id: '8am-hour-mark'},
            { hour: '9 am', id: '9am-hour-mark'},
            { hour: '10 am', id: '10am-hour-mark'},
            { hour: '11 am', id: '11am-hour-mark'},
            { hour: '12 pm', id: '12pm-hour-mark'},
            { hour: '1 pm', id: '1pm-hour-mark'},
            { hour: '2 pm', id: '2pm-hour-mark'},
            { hour: '3 pm', id: '3pm-hour-mark'},
            { hour: '4 pm', id: '4pm-hour-mark'},
            { hour: '5 pm', id: '5pm-hour-mark'},
            { hour: '6 pm', id: '6pm-hour-mark'},
            { hour: '7 pm', id: '7pm-hour-mark'},
            { hour: '8 pm', id: '8pm-hour-mark'},
            { hour: '9 pm', id: '9pm-hour-mark'},
            { hour: '10 pm', id: '10pm-hour-mark'},
            { hour: '11 pm', id: '11pm-hour-mark'}
        ];
        this.attachedScheduleUnplanActionHandler = [];
    };

    ScheduleController.prototype.setupCalendarTable = function () {
        var i, rowRoot, hourId, newRow, newHourMark, newScheduleMark;
        rowRoot = $('#first-row').detach();
        for (i = 0; i < this.hours.length; i++) {
            hourId = this.hours[i].id;

            newRow = rowRoot.clone();
            $(newRow).attr('id', this.hours[i].id.concat('-row'));

            // Setup the hour mark
            newHourMark = newRow.children('.hour-mark');
            newScheduleMark = newRow.children('.schedule-grid');
            if (i === 0) {
                $(newHourMark).addClass('first-hour-mark');
                $(newScheduleMark).addClass('first-schedule-grid');
            }
            $(newHourMark).attr('id', this.hours[i].id);
            $(newHourMark).text(this.hours[i].hour);

            $(newScheduleMark).attr('id', 'schedule-'.concat(hourId));

            $('#marker-root').append(newRow);

        }
    };

    /**
     * This sets up the events on schedules that are going to be filled in the schedule
     */
    ScheduleController.prototype.setupScheduleEvents = function () {
        var scheduleChipWrapper;

        scheduleChipWrapper = document.getElementById('schedule-chip-wrapper');

        // Add events for drag and drop events
        scheduleChipWrapper.addEventListener('dragover', this.utils.bindPrototype(scheduleController, scheduleController.onDragOver));
        scheduleChipWrapper.addEventListener('drag', this.utils.bindPrototype(scheduleController, scheduleController.onDrag));
        scheduleChipWrapper.addEventListener('dragstart', this.utils.bindPrototype(scheduleController, scheduleController.onDragStart));
        scheduleChipWrapper.addEventListener('dragend', this.utils.bindPrototype(scheduleController, scheduleController.onDragEnd));
        scheduleChipWrapper.addEventListener('drop', this.utils.bindPrototype(scheduleController, scheduleController.onDrop));

        // Add event handler for schedule event
        scheduleChipWrapper.addEventListener('click', this.utils.bindPrototype(scheduleController, scheduleController.click));

    };

    /**
     * This does nothing but allow chrome to not give zeros to clientX & clientY. If drag and drop is not allowed, then
     * zero is given to these two coordinates for some reason.
     *
     * @param event MouseEvent
     */
    ScheduleController.prototype.onDragOver = function (event) {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    };

    /**
     *
     * @param event MouseEvent
     */
    ScheduleController.prototype.onDragStart = function (event) {
        var scheduleDragged, scheduleModelDragged, scheduleChipWrapper, dragImage;
        scheduleDragged = event.target;
        scheduleModelDragged = this.scheduleDAO.getScheduleFromDOM(scheduleDragged.getAttribute('id'));

        // Save the original startDateTime and endDateTime on the schedule being dragged, this should be blocked,
        // no one sets the attribute directly!!!
        scheduleDragged.setAttribute(ScheduleModel.prototype.DRAG_ORIGINAL_START_DATETIME, scheduleModelDragged.getStartDateTime().toISOString());
        scheduleDragged.setAttribute(ScheduleModel.prototype.DRAG_ORIGINAL_END_DATETIME, scheduleModelDragged.getEndDateTime().toISOString());
        // Flag that there is some change to be confirmed.
        scheduleModelDragged.setChangeConfirmed(false);
        this.scheduleDAO.saveToDOM(scheduleModelDragged);

        scheduleChipWrapper = document.getElementById('schedule-chip-wrapper');
        scheduleChipWrapper.setAttribute('drag.schedule', 'true');

        // Setting drag image
        dragImage = document.getElementById('drag-image').cloneNode();
        dragImage.style.display = 'block';
        event.dataTransfer.setDragImage(dragImage, 0, 0);
    };

    ScheduleController.prototype.onDrag = function (event) {
        var scheduleDragged, scheduleModelDragged, newStartDateTime,
            newEndDateTime, isWithinSchedule, scheduleChipWrapper, boundingRectForWrapper, topValue;
        scheduleDragged = document.getElementById(event.target.id);
        scheduleModelDragged = this.scheduleDAO.getScheduleFromDOM(scheduleDragged.getAttribute('id'));

        // Find out what's the new time & update the schedule model.
        scheduleChipWrapper = document.getElementById('schedule-chip-wrapper');
        boundingRectForWrapper = scheduleChipWrapper.getBoundingClientRect();
        topValue = (event.clientY - boundingRectForWrapper.top) - (event.clientY - boundingRectForWrapper.top) % 24 - 1;

        newStartDateTime = this.timeUtils.toStartDateTime(topValue);
        newEndDateTime = this.timeUtils.toEndDateTime(topValue);
        scheduleModelDragged.setStartDateTime(newStartDateTime);
        scheduleModelDragged.setEndDateTime(newEndDateTime);

        // Updates to see whether drag was outside the calendar.
        scheduleChipWrapper = document.getElementById('schedule-chip-wrapper');
        isWithinSchedule = this.utils.isWithinBoundRectangle(event.clientX, event.clientY, scheduleChipWrapper.getBoundingClientRect());
        if (isWithinSchedule) {
            scheduleDragged.setAttribute('drag.withinSchedule', 'true');
            // Request view to update the view with the model.
            this.scheduleDAO.saveToDOM(scheduleModelDragged);
            this.scheduleView.updateScheduleView(scheduleModelDragged);
        } else {
            scheduleDragged.setAttribute('drag.withinSchedule', 'false');
        }


    };

    /**
     * At the end of a drag, if the drag was outside of the schedule calendar, then cancel the drag.
     *
     * It also removes all the temporary attribute that was set on each schedule.
     *
     * @param event MouseEvent
     */
    ScheduleController.prototype.onDragEnd = function (event) {
        var isWithinSchedule, scheduleModelDragged, scheduleDragged, originalStartDateTime, originalEndDateTime;
        scheduleDragged = event.target;
        scheduleModelDragged = this.scheduleDAO.getScheduleFromDOM(scheduleDragged.getAttribute('id'));
        isWithinSchedule = scheduleDragged.getAttribute('drag.withinSchedule');
        originalStartDateTime = scheduleDragged.getAttribute(ScheduleModel.prototype.DRAG_ORIGINAL_START_DATETIME);
        originalEndDateTime = scheduleDragged.getAttribute(ScheduleModel.prototype.DRAG_ORIGINAL_END_DATETIME);

        // Only do something if user decides to cancel this drop.
        if (isWithinSchedule === 'false') {
            scheduleModelDragged.setStartDateTime(new Date(originalStartDateTime));
            scheduleModelDragged.setEndDateTime(new Date(originalEndDateTime));
            this.scheduleDAO.saveToDOM(scheduleModelDragged);
            this.scheduleView.updateScheduleView(scheduleModelDragged);
            this.removeTemporaryAttributeOnScheduleChip(scheduleDragged);
        }

    };

    /**
     * Remove all the attributes that were set by this controller for coordination purposes
     * @param scheduleDragged
     */
    ScheduleController.prototype.removeTemporaryAttributeOnScheduleChip = function (scheduleDragged) {
        var scheduleChipWrapper;
        // Revert all the temporary attribute that had been set.
        scheduleChipWrapper = document.getElementById('schedule-chip-wrapper');
        scheduleChipWrapper.removeAttribute('drag.schedule');
        scheduleDragged.removeAttribute('drag.withinSchedule');
        scheduleDragged.removeAttribute(ScheduleModel.prototype.DRAG_ORIGINAL_START_DATETIME);
        scheduleDragged.removeAttribute(ScheduleModel.prototype.DRAG_ORIGINAL_END_DATETIME);
    };

    /**
     * When a schedule is dropped on the calendar, it figures out the new time, and triggers a move.
     *
     * @param event
     */
    ScheduleController.prototype.onDrop = function (event) {
        var scheduleDragged, scheduleModelDragged, originalStartDateTime, originalEndDateTime, scheduleChipWrapper, isDragSchedule;
        scheduleChipWrapper = document.getElementById('schedule-chip-wrapper');

        // Don't do anything if it's from task.
        isDragSchedule = scheduleChipWrapper.getAttribute('drag.schedule') === 'true';
        if (!isDragSchedule) {
            return;
        }

        scheduleDragged = event.target;
        scheduleModelDragged = this.scheduleDAO.getScheduleFromDOM(scheduleDragged.getAttribute('id'));

        originalStartDateTime = new Date(scheduleDragged.getAttribute(ScheduleModel.prototype.DRAG_ORIGINAL_START_DATETIME));
        originalEndDateTime = new Date(scheduleDragged.getAttribute(ScheduleModel.prototype.DRAG_ORIGINAL_END_DATETIME));

        try {
            this.moveSchedule(scheduleModelDragged, scheduleDragged, originalStartDateTime, originalEndDateTime);
        } catch (err) {
            throw err;
        } finally {
            this.removeTemporaryAttributeOnScheduleChip(scheduleDragged);
        }
    };

    /**
     * Event triggered when a schedule was clicked on.
     *
     * @param event MouseEvent which is triggered on the schedule.
     */
    ScheduleController.prototype.click = function (event) {
        var scheduleModel, unplanEvent;

        if (!event.target.classList.contains('schedule-chip')) {
            return;
        }

        scheduleModel = this.scheduleDAO.getScheduleFromDOM(event.target.id);

        unplanEvent = function (event) {
            var i, scheduleModel;
            scheduleModel = this.scheduleDAO.getScheduleFromDOM(event.target.parentElement.id);
            for (i = 0; i < this.attachedScheduleUnplanActionHandler.length; i++) {
                this.attachedScheduleUnplanActionHandler[i](scheduleModel);
            }
        };

        this.scheduleView.addUnplanActionViewToSchedule(scheduleModel, unplanEvent.bind(this));
    };

    /**
     * Given a scheduleModel that was moved, it communicates to API to have the change persisted.
     *
     * @param scheduleModel which has moved and has been set a new start date and end date.
     * @param correspondingScheduleDOM corresponding DOM object that represents the given scheduleModel.
     * @param originalStartDateTime specifies the original start date of the given scheduleModel before it's moved. Javascript Date type
     * @param originalEndDateTime specifies the original end date of the given scheduleModel before it's moved. Javascript Date type
     */
    ScheduleController.prototype.moveSchedule = function (scheduleModel, correspondingScheduleDOM,
                                                          originalStartDateTime, originalEndDateTime) {
        var updateHandle, doAfterUpdate, errorAfterUpdate;

        updateHandle = this.scheduleDAO.updateScheduleToAPI(scheduleModel);

        doAfterUpdate = (function () {
            var originalStartTimeForClosure, originalEndTimeForClosure, scheduleModelForClosure, scheduleController;
            // Setup objects required by closure.
            scheduleController = this;
            originalStartTimeForClosure = originalStartDateTime;
            originalEndTimeForClosure = originalEndDateTime;
            scheduleModelForClosure = scheduleModel;

            return function (updateResponse) {
                var isDOMSaveSuccess;
                if ('-1' === updateResponse) {
                    // In case any error, restore to original date time.
                    scheduleModelForClosure.setStartDateTime(originalStartTimeForClosure);
                    scheduleModelForClosure.setEndDateTime(originalEndTimeForClosure);
                }

                scheduleModelForClosure.setChangeConfirmed(true);
                isDOMSaveSuccess = scheduleController.scheduleDAO.saveToDOM(scheduleModelForClosure);
                if (!isDOMSaveSuccess) {
                    throw "DOM access error";
                }

                scheduleController.scheduleView.updateScheduleView(scheduleModelForClosure);
            };
        }());

        // Revert back to original time when error.
        errorAfterUpdate = (function () {
            var originalStartTimeForClosure, originalEndTimeForClosure, scheduleModelForClosure, scheduleController;
            // Setup objects required by closure.
            scheduleController = this;
            originalStartTimeForClosure = originalStartDateTime;
            originalEndTimeForClosure = originalEndDateTime;
            scheduleModelForClosure = scheduleModel;

            return function () {
                // In case any error, restore to original date time.
                scheduleModelForClosure.setStartDateTime(originalStartTimeForClosure);
                scheduleModelForClosure.setEndDateTime(originalEndTimeForClosure);

                scheduleController.scheduleDAO.saveToDOM(scheduleModelForClosure);
                scheduleController.scheduleView.updateScheduleView(scheduleModelForClosure);
            };
        }());

        updateHandle.then(doAfterUpdate, errorAfterUpdate);
    };

    /**
     * This fills the existing calendar view with a list of schedules for today.
     */
    ScheduleController.prototype.fillSchedules = function () {
        var promiseHandle, functionUpdateDOMAndView;

        // Closure function to update DOM and view after schedule models are retrieved.
        functionUpdateDOMAndView = (function () {
            var scheduleController = this;

            return function (scheduleModels) {
                var i, currentScheduleModel;
                for (i = 0; i < scheduleModels.length; i++) {
                    currentScheduleModel = scheduleModels[i];
                    scheduleController.scheduleController.updateModelToViewAndDOM(currentScheduleModel);
                }
            };
        }());

        promiseHandle = this.scheduleDAO.getSchedulesForTodayFromAPI();
        promiseHandle.then(functionUpdateDOMAndView,
            function () {
                throw "Failed to get schedules for today";
            });
    };

    /**
     *  Given a schedule, it persists the schedule to API. It also updates the DOM model if the operation was successful.
     *  If the operation was not successful, it would delete it from DOM to indicate such fact.
     *
     * @param scheduleModel
     * @return promise handle, return boolean when it's finished.
     */
    ScheduleController.prototype.saveNewSchedule = function (scheduleModel) {
        var promiseHandle, domUpdate;
        // First delete the temporary schedule before proceeding further.
        this.scheduleDAO.deleteFromDOM(scheduleModel.getScheduleId());

        promiseHandle = this.scheduleDAO.save(scheduleModel);

        domUpdate = (function () {
            var scheduleController = this;
            return function (newScheduleModel) {
                var isSuccessfulSave;
                if (newScheduleModel === null) {
                    scheduleController.scheduleDAO.deleteFromDOM(scheduleModel);
                    return false;
                }

                isSuccessfulSave = scheduleController.scheduleController.updateModelToViewAndDOM(newScheduleModel);
                return isSuccessfulSave;
            };
        }());
        return promiseHandle.then(domUpdate);
    };

    /**
     * Given the information, it creates a new schedule, and subsequently updates the view with the schedule.
     *
     * @param isTemporary true if it's on-hover and is to be confirmed.
     * @param taskListId
     * @param taskId
     * @param title
     * @param startDateTime the start date time of the new schedule
     * @return ScheduleModel latest schedule model representing the newly created schedule.
     */
    ScheduleController.prototype.createNewSchedule = function (isTemporary, taskListId, taskId, title, startDateTime) {
        var newScheduleModel, endDateTime;
        endDateTime = new Date(startDateTime.getTime());
        endDateTime.setHours(endDateTime.getHours() + 1);
        newScheduleModel = new ScheduleModel(taskListId, taskId, title, startDateTime, endDateTime, isTemporary);

        this.scheduleDAO.saveToDOM(newScheduleModel);
        this.scheduleView.updateScheduleView(newScheduleModel);

        return newScheduleModel;
    };

    /**
     * When called, this updates the given scheduleModel on the calendar view.
     *
     * If the given schedule model was never on the calendar view, it will be added to the view. However,
     * if it does exist, it will be updated based on scheduleId of this scheduleModel.
     *
     * @param scheduleModel to be placed on view.
     */
    ScheduleController.prototype.updateScheduleView = function (scheduleModel) {
        this.scheduleView.updateScheduleView(scheduleModel);
    };

    /**
     * Updates both DOM and view whenever a model has been changed/update/created.
     *
     * Deletion is not handled.
     *
     * @param scheduleModel to be updated.
     * @return boolean, true if model and view was updated successfully.
     */
    ScheduleController.prototype.updateModelToViewAndDOM = function (scheduleModel) {
        var isDOMSaveSuccessful;

        isDOMSaveSuccessful = this.scheduleDAO.saveToDOM(scheduleModel);
        if (isDOMSaveSuccessful) {
            // At present, view does not indicate whether it's been updated successfully.
            this.scheduleView.updateScheduleView(scheduleModel);
        } else {
            throw "DOM save unsuccessful";
        }

        return isDOMSaveSuccessful;
    };

    /**
     * This when invoked remove the given schedule from API, DOM and view respectively in sequence.
     *
     * @param scheduleModel
     * @return boolean true if unplan was successfully propagated to API, DOM and view.
     */
    ScheduleController.prototype.unplanSchedule = function (scheduleModel) {
        var promiseHandle, deleteFromDOMAndView;

        deleteFromDOMAndView = (function () {
            var scheduleController, scheduleModelToDelete;

            scheduleController = this;
            scheduleModelToDelete = scheduleModel;

            return function (isDeleteSuccessful) {
                if (isDeleteSuccessful === true) {
                    scheduleController.scheduleDAO.deleteFromDOM(scheduleModelToDelete.getScheduleId());
                    scheduleController.scheduleView.deleteFromScheduleView(scheduleModelToDelete);
                    return true;
                }
                return false;
                // Else do nothing
            };
        }());

        promiseHandle = this.scheduleDAO.unplanFromAPI(scheduleModel);
        return promiseHandle.then(deleteFromDOMAndView, deleteFromDOMAndView);
    };

    /**
     * Attaches the given function to be a listener of the removeSchedule event. It's guaranteed the parameters passed
     * to the attached handler is the schedule that was unplanned.
     *
     * @param functionHandler to be attached.
     */
    ScheduleController.prototype.attachScheduleUnplanActionHandler = function (functionHandler) {
        this.attachedScheduleUnplanActionHandler.push(functionHandler);
    };

    return ScheduleController;

}($));
