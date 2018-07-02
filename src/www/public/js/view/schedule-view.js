/*global $*/
/**
 * Created by user on 12/6/14.
 */
var ScheduleView = (function ($) {

    var ScheduleView = function (viewUtilities, timeUtils) {
        this.viewUtilities = viewUtilities;
        this.timeUtils = timeUtils;
    };

    /**
     * Given a schedule Model, it update the view to reflect the latest state of this schedule model.
     *
     * If the given schedule model cannot be found on the view, it throws an error. It doesn't respect whether
     * ScheduleDAO / ScheduleController has done a good job.
     *
     * @param scheduleModel
     * @throws Exception when the given scheduleModel does not exist in View
     */
    ScheduleView.prototype.updateScheduleView = function (scheduleModel) {
        var scheduleChip, startTopValue, endTopValue;
        scheduleChip = document.getElementById(scheduleModel.getScheduleId());

        if (scheduleChip === null) {
            throw "schedule chip does not exist";
        }

        scheduleChip.classList.add('schedule-chip');
        if (scheduleModel.temporary) {
            scheduleChip.classList.add('new-schedule-chip');
        }

        scheduleChip.setAttribute('draggable', 'true');
        scheduleChip.innerText = scheduleModel.title;

        startTopValue = this.timeUtils.getTopValue(scheduleModel.getStartDateTime());
        endTopValue = this.timeUtils.getTopValue(scheduleModel.getEndDateTime());
        scheduleChip.style.top = ''.concat(startTopValue, 'px');
        scheduleChip.style.height = ''.concat(endTopValue - startTopValue, 'px');
    };

    /**
     * Deletes from the given schedule model from model.
     *
     * @param scheduleModel
     */
    ScheduleView.prototype.deleteFromScheduleView = function (scheduleModel) {
        // At present, does nothing because ScheduleDAO has already deleted the element.
    };

    /**
     * Given a schedule model, it marks it as selected and show it's action view. It's guaranteed that the event passed to the
     * action event is a MouseEvent triggered on the Schedule.
     *
     * @param scheduleModel
     * @param actionEvent to be attached to the actionView
     */
    ScheduleView.prototype.addUnplanActionViewToSchedule = function (scheduleModel, actionEvent) {
        var i, removeActionElements, scheduleClicked, deleteActionElement;
        // Once it's confirmed that it's a schedule, render the selection and show the delete button.
        removeActionElements = document.querySelectorAll('.schedule-chip > span.schedule-remove-action');

        // Remove all existing remove actions
        for (i = 0; i < removeActionElements.length; i++) {
            removeActionElements[i].parentElement.removeChild(removeActionElements[i]);
        }

        scheduleClicked = document.getElementById(scheduleModel.getScheduleId());
        scheduleClicked.setAttribute('selected', 'true');
        deleteActionElement = document.createElement('span');
        this.viewUtilities.addClasses(deleteActionElement, 'glyphicon glyphicon-remove schedule-remove-action');

        // attach the event handler to delete action.
        deleteActionElement.addEventListener('click', actionEvent);

        scheduleClicked.appendChild(deleteActionElement);
    };

    return ScheduleView;

}($));