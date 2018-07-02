/*global  $*/
/**
 * This Planner Controller coordinates the event communication between (outer) UI element events and the (inner)
 * controllers.
 *
 * @author Ted Kuo <itekuo@gmail.com>
 */
var PlannerController = (function ($) {
    var PlannerController = function (utils, timeUtils, viewUtilities, scheduleDAO, taskController, scheduleController) {
        this.utils = utils;
        this.timeUtils = timeUtils;
        this.viewUtilities = viewUtilities;
        this.scheduleDAO = scheduleDAO;
        this.taskController = taskController;
        this.scheduleController = scheduleController;
    };

    /**
     * This is the USE-CASE to plan an existing task to
     *
     * @param newSchedule
     */
    PlannerController.prototype.planPriority = function (newSchedule) {
        var promiseHandle, closure;

        promiseHandle = this.scheduleController.saveNewSchedule(newSchedule);

        // Create closure for moving tasks
        closure = (function () {
            var taskController, newScheduleObj;
            taskController = this.taskController;
            newScheduleObj = newSchedule;
            return function (isScheduleUpdated) {
                if (isScheduleUpdated === true) {
                    taskController.moveTask(newScheduleObj.taskId, TaskModel.prototype.STATUS_PLANNED);
                }
            };
        }());
        promiseHandle.then(closure);
    };

    /**
     * When a new priority is dragged over to the calendar view, this updates to render the calendar to 'temporarily'
     * show user where the task will land.
     *
     * @param event
     */
    PlannerController.prototype.onDragOver = function (event) {
        var boundingRectForWrapper, topValue, startDateTime, endDateTime, scheduleChipWrapper, temporaryScheduleChip,
            temporaryScheduleModel, isDragPlanner;

        scheduleChipWrapper = document.getElementById('schedule-chip-wrapper');
        isDragPlanner = scheduleChipWrapper.getAttribute('drag.planner') === 'true';
        if (!isDragPlanner) {
            return;
        }

        // This is a must because drag and drop by default is not allowed.
        event.preventDefault();

        // Event could be triggered on both the new chip or the calendar itself
        if ('schedule-chip-wrapper' === event.target.id || event.target.classList.contains('schedule-chip')) {
            event.dataTransfer.dropEffect = 'move';

            // Figure out the time user is intending to schedule the new priority on.

            boundingRectForWrapper = scheduleChipWrapper.getBoundingClientRect();
            topValue = (event.clientY - boundingRectForWrapper.top) - (event.clientY - boundingRectForWrapper.top) % 24 - 1;
            startDateTime = this.timeUtils.toStartDateTime(topValue);

            // Fetch the schedule that should be updated
            temporaryScheduleChip = document.querySelector('.new-schedule-chip');
            temporaryScheduleModel = this.scheduleDAO.getScheduleFromDOM(temporaryScheduleChip.getAttribute('id'));
            temporaryScheduleModel.startDateTime = startDateTime;

            endDateTime = new Date(startDateTime.getTime());
            endDateTime.setHours(endDateTime.getHours() + 1);
            temporaryScheduleModel.endDateTime = endDateTime;

            this.scheduleController.updateModelToViewAndDOM(temporaryScheduleModel);
            return;
        }
    };

    /**
     * On Drop event for Calendar. This is where an task officially gets scheduled. It fetches the target currently
     * being dragged and put it as a schedule. It converts the 'temporary' nature of the 'target' schedule to 'permanent'
     *
     * @param event
     */
    PlannerController.prototype.onDrop = function (event) {
        var temporaryScheduleChip, temporaryScheduleModel, scheduleChipWrapper, isDragPlanner;

        scheduleChipWrapper = document.getElementById('schedule-chip-wrapper');
        isDragPlanner = scheduleChipWrapper.getAttribute('drag.planner') === 'true';
        if (!isDragPlanner) {
            return;
        }
        console.debug('on drop of planner');

        // Prevent the default open as a link behaviour
        event.preventDefault();

        temporaryScheduleChip = document.querySelector('.new-schedule-chip');
        temporaryScheduleModel = this.scheduleDAO.getScheduleFromDOM(temporaryScheduleChip.getAttribute('id'));

        temporaryScheduleModel.startDateTime = this.timeUtils.toStartDateTime(parseInt($(temporaryScheduleChip).css('top'), 10));
        temporaryScheduleModel.endDateTime = this.timeUtils.toEndDateTime(parseInt($(temporaryScheduleChip).css('top'), 10),
            parseInt($(temporaryScheduleChip).css('height'), 10));

        // Remove the temporary attribute before persisting the changes.
        this.removeTemporaryAttributes(temporaryScheduleChip);
        // This manual trigger is important because dragend does not triggered if item has been moved/removed.
        this.taskController.onDragEnd(event);

        this.planPriority(temporaryScheduleModel);
    };

    /**
     * This shall only handle the 'cancel' event, if user decides to cancel his drag.
     * If a priority get successfully scheduled, then this should do nothing, because the temporary schedule will get
     * converted and planned correctly in $this->planPriority().
     *
     * @param event
     */
    PlannerController.prototype.onDragEnd = function (event) {
        var node, scheduleChip;
        if (event.target.getAttribute('drag.withinSchedule') === 'false') {

            this.taskController.onDragCancel(event);

            // Remove the 'new' schedule chip
            node = document.querySelector('.new-schedule-chip');
            node.parentElement.removeChild(node);
            scheduleChip = event.target;

            // Remove all temporary attribute setup.
            this.removeTemporaryAttributes(scheduleChip);
            this.taskController.onDragEnd(event);
        }

    };

    /**
     * This removes all the temporary attributes that were set/setup to support the 'priority planning' action of
     * the user.
     *
     * @param scheduleChip which was dragged by the user.
     */
    PlannerController.prototype.removeTemporaryAttributes = function (scheduleChip) {
        var scheduleChipWrapper;
        // Clean up the variables that is no longer required at the end of a drag.
        scheduleChip.removeAttribute('drag.withinSchedule');
        scheduleChipWrapper = document.getElementById('schedule-chip-wrapper');
        scheduleChipWrapper.removeAttribute('drag.planner');
        console.debug('removed drag.planner');
    };

    /**
     * Triggered when a task is begin dragged. This calculates to work out whether user is dragging the task into the
     * calendar for scheduling. It records it's output to an attribute of the task being dragged - drag.withinSchedule.
     * This is necessary because dataTransfer does not work well across all browser.
     *
     * @param event MouseEvent which is triggered when drag in in-progress.
     */
    PlannerController.prototype.onDrag = function (event) {
        var scheduleChipWrapper, boundingRectangle, isWithinSchedule;

        this.taskController.onDrag(event);

        scheduleChipWrapper = document.getElementById('schedule-chip-wrapper');
        boundingRectangle = scheduleChipWrapper.getBoundingClientRect();

        // Check if users' mouse is within the rectangle of the schedule chip wrapper.
        event.target.setAttribute('drag.withinSchedule', 'false');

        isWithinSchedule = this.viewUtilities.isWithinBoundRectangle(event.clientX, event.clientY, boundingRectangle);
        console.debug('planner.ondrag - X: '.concat(event.clientX).concat(', Y: ').concat(event.clientY));

        if (isWithinSchedule) {
            event.target.setAttribute('drag.withinSchedule', 'true');
        }
        return;
    };

    /**
     * Triggered when a priority/task is dragged by user. It prepares a new ScheduleModel, which can be used later for
     * rendering when user is 'scheduling' as detected by dragOver and onDrag.
     *
     * @param event target element that triggered this event, and must be a priority task
     */
    PlannerController.prototype.onDragStart = function (event) {
        var startDateTime, scheduleChipWrapper, taskDragged;

        // Inform TaskController that a drag has started.
        taskDragged = this.taskController.onDragStart(event);

        // Set up id of this user action
        scheduleChipWrapper = document.getElementById('schedule-chip-wrapper');
        scheduleChipWrapper.setAttribute('drag.planner', 'true');

        // Initialise the new temporary schedule to startDateTime to 00:00 of today
        startDateTime = new Date();
        startDateTime.setHours(0, 0, 0, 0);
        this.scheduleController.createNewSchedule(true, taskDragged.taskListId, taskDragged.taskId, taskDragged.name, startDateTime);
    };

    /**
     * This sets up the events on day calendar that involves both task and calendar.
     */
    PlannerController.prototype.setupEventsOnDayCalendar = function () {
        var scheduleChipWrapper, taskListsElement;

        taskListsElement = document.getElementById('task-list-section');
        taskListsElement.addEventListener('dragstart', this.utils.bindPrototype(this, this.onDragStart));
        taskListsElement.addEventListener('drag', this.utils.bindPrototype(this, this.onDrag));
        taskListsElement.addEventListener('dragend', this.utils.bindPrototype(this, this.onDragEnd));

        taskListsElement.addEventListener('dragover', this.utils.bindPrototype(this.taskController, this.taskController.onDragOver));
        taskListsElement.addEventListener('drop', this.utils.bindPrototype(this.taskController, this.taskController.onDrop));

        scheduleChipWrapper = document.getElementById('schedule-chip-wrapper');
        scheduleChipWrapper.addEventListener('dragover', this.utils.bindPrototype(this, this.onDragOver));
        scheduleChipWrapper.addEventListener('drop', this.utils.bindPrototype(this, this.onDrop));

        // Add event listeners to schedule calendar
        this.scheduleController.attachScheduleUnplanActionHandler(
            this.utils.bindPrototype(this, this.unplanSchedule)
        );
    };

    /**
     * Event to be triggered when a schedule was to be un-planned.
     *
     * @param event
     */
    PlannerController.prototype.unplanSchedule = function (scheduleModel) {
        var promiseHandle, functionUnplanTask;

        promiseHandle = this.scheduleController.unplanSchedule(scheduleModel);

        functionUnplanTask = (function () {
            var taskController;
            taskController = this.taskController;
            return function (isScheduleUnplanSuccessful) {
                if (isScheduleUnplanSuccessful) {
                    // Only update if there is a link between task and schedule
                    if (scheduleModel.taskListId !== null && scheduleModel.taskId !== null &&
                        scheduleModel.taskListId !== 'null' && scheduleModel.taskId !== 'null') {
                        taskController.unplanTask(scheduleModel.taskListId, scheduleModel.taskId);
                    }
                }
            };
        }());

        promiseHandle.then(functionUnplanTask, functionUnplanTask);
    };

    return PlannerController;
}($));