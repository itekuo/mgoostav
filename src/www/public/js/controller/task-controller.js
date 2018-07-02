/*global  $*/
/**
 * This specifies the controller for looking over on how tasks are managed.
 *
 * @author Ted Kuo <itekuo@gmail.com>
 */
var TaskController = (function ($) {
    var TaskController = function (utils, taskView, taskDAO) {
        this.utils = utils;
        this.taskDAO = taskDAO;
        this.taskView = taskView;

        // Initialise the type list this controller supports.
        this.typeList = [];
        this.typeList[TaskModel.prototype.STATUS_PLANNED] = 'PLANNED';
        this.typeList[TaskModel.prototype.STATUS_TO_PLAN] = 'TO PLAN';
        this.typeList[TaskModel.prototype.STATUS_TO_REPLAN] = 'TO REPLAN';
        this.typeList[TaskModel.prototype.STATUS_PLAN_ONE_WEEK] = 'TO PLAN IN ONE WEEK';
        this.typeList[TaskModel.prototype.STATUS_PLAN_ONE_MONTH] = 'TO PLAN IN ONE MONTH';
    };

    TaskController.prototype.addTask = function (e) {
        var newPriorityName, data, fadeOut2, url, taskUpdate;
        if (e.keyCode === 13 || e.originalEvent.type === 'blur') {
            url = '/api/task/add/';
            taskUpdate = function (data, textStatus, jqXHR) {
                var fadeOut = function () {
                    $(this.target).siblings('.form-control-feedback').animate({opacity: 0}, 500);
                    $(this.target).val('');
                };
                if (data === '1') {
                    fadeOut2 = fadeOut.bind(e);
                    $(e.target).siblings('.form-control-feedback').animate({opacity: 1}, 200, fadeOut2);

                }
            };
            newPriorityName = $('#new-task-title').val();
            data = {priorityName: newPriorityName};
            this.utils.makeRequest(url, "POST", data, taskUpdate);
            e.preventDefault();
        }
    };

    /**
     * Moves the given task (as specified by taskId), to the given the plan status. This coordinates
     * and updates the view as well.
     *
     * @param taskId
     * @param planStatus of TaskModel to be moved to.
     * @param previous string specifying the position of it's previous task
     */
    TaskController.prototype.moveTask = function (taskId, planStatus, previous) {
        var taskModel;

        // Retrieve the necessary objects from DOM
        taskModel = this.taskDAO.getTaskFromDOM(taskId);

        // Updates the model
        taskModel.setAsPlanned();

        this.taskView.toggleTaskDisplay(taskModel, true);
        this.taskView.addTaskToList(taskModel, this.typeList[planStatus]);
        this.taskDAO.updateTaskToAPI(taskModel);
    };

    /**
     * Updates the task to API
     *
     * @param event
     */
    TaskController.prototype.updateTask = function (event) {
        var taskId, taskModel, promiseHandle, taskUpdate;

        if (event.keyCode === 13 || event.originalEvent.type === 'blur') {
            // Retrieve the task model that was triggered based on taskId.
            taskId = event.target.parentElement.id;
            taskModel = this.taskDAO.getTaskFromDOM(taskId);

            // Ask DAO to update it.
            promiseHandle = this.taskDAO.updateTaskToAPI(taskModel);

            // Ask View to Animate an update.
            taskUpdate = (function (data, textStatus, jqXHR) {
                var taskView, taskIdToUpdate, returnFunction;
                taskView = this.taskView;
                taskIdToUpdate = taskId;
                returnFunction = function (result, text) {
                    if (result === '1') {
                        taskView.animateUpdate(taskIdToUpdate);
                    }
                };
                return returnFunction;
            }());

            promiseHandle.then(taskUpdate);
            event.preventDefault();
        }
    };

    /**
     * This call completes a task. Task to complete is identified by the event.
     * @param e
     */
    TaskController.prototype.completeTask = function (e) {
        var url, taskListId, encodedTaskListId, taskId, encodedTaskId, taskUpdate, data;
        taskListId = e.target.parentElement.attributes['tasklistid'].value;
        encodedTaskListId = window.btoa(taskListId);
        taskId = e.target.parentElement.id;
        encodedTaskId = window.btoa(taskId);
        url = '/api/task/'.concat(encodedTaskListId, '/', encodedTaskId, '/');
        taskUpdate = function (data, textStatus, jqXHR) {
            if (data === '1') {
                $('#'.concat(taskId, ' > .task-item')).addClass('completed');
            }
        };
        data = {completed: 'completed'};
        this.utils.makeRequest(url, "POST", data, taskUpdate);
    };

    /**
     * Given task list ID, and task ID, it unplans the task.
     *
     * @param taskListId
     * @param taskId
     * @return boolean if unplan was successful.
     */
    TaskController.prototype.unplanTask = function (taskListId, taskId) {
        var taskModel;
        // Get TaskModel for task ID
        taskModel = this.taskDAO.getTaskFromDOM(taskId);

        // Unplan taskModel
        taskModel.setAsUnplanned();

        // Persist it
        this.taskDAO.updateTaskToAPI(taskModel);

        // Update view
        this.taskView.toggleTaskDisplay(taskModel);
        this.taskView.addTaskToList(taskModel, this.typeList[taskModel.getPlanStatus()]);

        return true;
    };

    /**
     * This setups a table with 5 cards, each representing different plan status.
     * Initially, there's no tasks set, but card only.
     */
    TaskController.prototype.setupTaskTable = function () {
        this.taskView.setupTaskTable(this.typeList);
    };

    /**
     * This fills the tasks retrieved from Google. Since this involves DAO, this call is made asynchronously.
     * If synchronous behaviour is expected. Please use the Promise handle returned from this method.
     *
     * @returns Promise
     */
    TaskController.prototype.fillTaskLists = function () {
        var fillTasks = (function (taskController) {
            var returnFunction, taskControllerInstance;
            taskControllerInstance = taskController;
            returnFunction = function (tasks) {
                tasks.forEach(function (taskModel) {
                    var planStatus, taskListType;
                    planStatus = taskModel.getPlanStatus();
                    taskListType = taskControllerInstance.typeList[planStatus];
                    taskControllerInstance.taskDAO.saveToDOM(taskModel);
                    taskControllerInstance.taskView.addTaskToList(taskModel, taskListType);
                });
            };
            return returnFunction;
        }(this));

        return this.taskDAO.getTasksFromAPI().then(fillTasks);

    };

    /**
     * This controller, when told a drag has started, initiates all the actions required in Model/View/DOM. Drag is
     * started when user intends to move the task to either another task list or onto the schedule.
     *
     * @param event
     * @return TaskModel which is being dragged.
     */
    TaskController.prototype.onDragStart = function (event) {
        var priorityName, priorityId, priorityListId, taskModelDragged, newTemporaryTaskModel;
        priorityId = event.target.parentNode.id;
        taskModelDragged = this.taskDAO.getTaskFromDOM(priorityId);

        // Keeps original information of this task.
        event.dataTransfer.setData('priorityName', taskModelDragged.priorityName);
        event.dataTransfer.setData('priorityId', taskModelDragged.taskId);
        event.dataTransfer.setData('priorityListId', taskModelDragged.taskListId);

        // Create a new temporary task based on the task dragged and set it's id to temporary
        newTemporaryTaskModel = new TaskModel('', taskModelDragged.taskListId, 'temporaryId',
            taskModelDragged.planStatus, taskModelDragged.position);
        newTemporaryTaskModel.setIsTemporary(true);

        // save the new temporary task to DOM and view.
        this.taskDAO.saveToDOM(newTemporaryTaskModel);
        this.taskView.addTaskToList(newTemporaryTaskModel, this.typeList[taskModelDragged.getPlanStatus()]);

        return taskModelDragged;
    };

    /**
     * While drag is on, remove it from it's existing position.
     *
     * @param event
     */
    TaskController.prototype.onDrag = function (event) {
        var taskId, taskDragged;
        taskId = event.target.parentNode.id;
        taskDragged = this.taskDAO.getTaskFromDOM(taskId);

        // This cannot be done from drag start, it abruptly stops the drag event
        this.taskView.toggleTaskDisplay(taskDragged, false);
    };

    /**
     * If drag is cancelled, then place the task back to the list in view
     *
     * @param event
     */
    TaskController.prototype.onDragCancel = function (event) {
        var taskDragged, taskId;

        taskId = event.target.parentNode.id;
        taskDragged = this.taskDAO.getTaskFromDOM(taskId);
        this.taskView.addTaskToList(taskDragged, this.typeList[taskDragged.getPlanStatus()]);
        this.taskView.removeTemporaryTask();
//        this.taskDAO.removeTemporaryTask();
    };

    /**
     * This when invoked handles event when a task is dragged around for intention to move a task to another list or
     * another position within the same list.
     *
     * @param event
     */
    TaskController.prototype.onDragOver = function (event) {
        var temporaryTaskModel, taskIdToShift, taskModelToShift;

        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';

        // Find out which task is the mouse pointer at, figure out which list is it, which task is before it
        taskIdToShift = this.taskView.getTaskIdAtPoint(event.clientX, event.clientY);
        if (taskIdToShift === null) {
            return;
        }

        taskModelToShift = this.taskDAO.getTaskFromDOM(taskIdToShift);

        // Do nothing if user is dragging and holding at a new position, and event is continuing to be fired.
        if (taskModelToShift.taskId === 'temporaryId') {
            return;
        }

        temporaryTaskModel = this.taskDAO.getTaskFromDOM('temporaryId');
        temporaryTaskModel.position = taskModelToShift.getPosition().concat('.1');
        temporaryTaskModel.planStatus = taskModelToShift.getPlanStatus();
        this.taskDAO.saveToDOM(temporaryTaskModel);

        // Creates/move a task view element based on it, and insert it at the right position
        this.taskView.addTaskToList(temporaryTaskModel, this.typeList[temporaryTaskModel.getPlanStatus()]);
    };

    /**
     * This when invoked, confirm a re-shuffle done by user. This talks to API & DOM to confirm on user action
     *
     * @param event
     */
    TaskController.prototype.onDrop = function (event) {
        var temporaryTaskModel, priorityId, taskToUpdate, previousTaskPosition, previousTask;
        // Find the temporary task
        temporaryTaskModel = this.taskDAO.getTaskFromDOM('temporaryId');

        // Save to DOM & View
        priorityId = event.dataTransfer.getData('priorityId');

        taskToUpdate = this.taskDAO.getTaskFromDOM(priorityId);
        taskToUpdate.setPlanStatus(temporaryTaskModel.getPlanStatus());
        taskToUpdate.position = temporaryTaskModel.getPosition();

        previousTaskPosition = temporaryTaskModel.getPosition().substr(0, temporaryTaskModel.getPosition().length - 2);
        previousTask = this.taskDAO.getTaskByPosition(previousTaskPosition);
        taskToUpdate.setPrevious(previousTask.getTaskId());
        this.taskView.addTaskToList(taskToUpdate, this.typeList[taskToUpdate.getPlanStatus()]);
        this.taskView.toggleTaskDisplay(taskToUpdate, true);

        // Remove temporary and re-construct in view
        this.taskDAO.deleteTaskFromDOM(temporaryTaskModel.taskId);
        this.taskView.removeTemporaryTask();

        // Talk to API
        this.taskDAO.updateTaskToAPI(taskToUpdate);
    };

    /**
     * This when invoked, assumes that drag of a task has ended, it removes all the temporary tasks from both DOM and view
     *
     * @param event
     */
    TaskController.prototype.onDragEnd = function (event) {
        this.taskView.removeTemporaryTask();
        this.taskDAO.removeTaskFromDOM('temporaryId');

    };

    /**
     * Setups all the even this controller cares about or needs
     */
    TaskController.prototype.setupEvents = function () {
        $('.task-item-action').click(function (e) {
            if (e.target.classList.contains('task-item-complete-action')) {
                this.completeTask(e);
            }
        }.bind(this));
        $('#new-task-title').blur(function (e) {
            if (e.target.text != 'New task...' && e.target.text != '') {
                this.addTask(e);
            }
        }.bind(this));
        $('#new-task-title').keypress(function (e) {
            if (e.target.text != 'New task...' && e.target.text != '') {
                this.addTask(e);
            }
        }.bind(this));
        $('.task-item').keypress(function (e) {
            this.updateTask(e);
            $('.task-item').parent().focus();
        }.bind(this));
        $('.task-item').blur(function (e) {
            $('.task-item').parent().focus();
        }.bind(this));
    };

    return TaskController;
}($));

