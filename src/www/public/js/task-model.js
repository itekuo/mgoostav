/*global  $*/
/**
 * Created by user on 11/22/14.
 */
var TaskModel = (function ($) {

    /**
     * Constructor
     *
     * @param title
     * @param taskListId
     * @param taskId
     * @param planStatus
     * @param position
     * @param isTemporary true if the state of this task model is not confirmed by user.
     *
     * @constructor
     */
    var TaskModel = function (title, taskListId, taskId, planStatus, position) {
        if (typeof title === 'undefined') {
            throw 'Given title is empty';
        }

        this.name = title;
        this.taskListId = taskListId;
        this.taskId = taskId;
        this.planStatus = planStatus;
        this.position = position;
        this.temporary = false;
        this.previous = null;

        // Assume to plan if not given
        if (typeof this.planStatus === 'undefined') {
            this.planStatus = TaskModel.prototype.STATUS_TO_PLAN;
        }
    };

    TaskModel.prototype.STATUS_PLANNED = 'planned';
    TaskModel.prototype.STATUS_TO_REPLAN = 'to_replan';
    TaskModel.prototype.STATUS_TO_PLAN = 'to_plan';
    TaskModel.prototype.STATUS_PLAN_ONE_WEEK = 'to_plan_in_one_week';
    TaskModel.prototype.STATUS_PLAN_ONE_MONTH = 'to_plan_in_one_month';

    TaskModel.prototype.STATUSES = [TaskModel.prototype.STATUS_PLAN_ONE_MONTH,
        TaskModel.prototype.STATUS_PLAN_ONE_WEEK, TaskModel.prototype.STATUS_PLANNED,
        TaskModel.prototype.STATUS_TO_REPLAN, TaskModel.prototype.STATUS_TO_PLAN];


    TaskModel.prototype.toString = function () {
        return this.name.concat(', ', this.taskListId, ', ', this.taskId, ', ', this.planStatus, ', ', this.position);
    };

    TaskModel.prototype.getTaskListId = function () {
        return this.taskListId;
    };

    TaskModel.prototype.getTaskId = function () {
        return this.taskId;
    };

    TaskModel.prototype.getPosition = function () {
        return this.position;
    };

    TaskModel.prototype.getPlanStatus = function () {
        return this.planStatus;
    };

    TaskModel.prototype.getName = function () {
        return this.name;
    };

    TaskModel.prototype.isTemporary = function () {
        return this.temporary;
    };

    TaskModel.prototype.setAsPlanned = function () {
        this.planStatus = this.STATUS_PLANNED;
    };

    TaskModel.prototype.setAsUnplanned = function () {
        this.planStatus = this.STATUS_TO_PLAN;
    };

    TaskModel.prototype.setPlanStatus = function (planStatus) {
        this.planStatus = planStatus;
    };

    TaskModel.prototype.setPrevious = function (previousTaskId) {
        this.previous = previousTaskId;
    };

    TaskModel.prototype.setIsTemporary = function (isTemporary) {
        this.temporary = isTemporary;
    };

    /**
     * Based on the current "plan" status and task title, it returns the the title that should be used by Google.
     */
    TaskModel.prototype.getPriorityNameForAPI = function () {
        return this.name.concat(' #', this.planStatus);
    };

    return TaskModel;
}($));


var TaskDAO = (function ($) {

    var TaskDAO = function (utils) {
        this.utils = utils;
        this.taskStoreId = 'task-store';
        this.taskIdPrefix = 'task-';
    };

    /**
     * When invoked, TaskDAO saves the given taskModel to the DOM store. For clarity, this is kept separate from the
     * TaskView DOM.
     *
     * If this taskModel doesn't exist in the DOM store, then a new one is created, otherwise, the existing one is
     * updated.
     *
     * @param taskModel to be saved
     */
    TaskDAO.prototype.saveToDOM = function (taskModel) {
        var taskElement, taskIdForStore, taskStoreElement;
        if (taskModel.taskId === null) {
            throw "This TaskModel has no ID";
        }
        taskIdForStore = this.taskIdPrefix.concat(taskModel.taskId);
        taskElement = document.getElementById(taskIdForStore);
        taskStoreElement = document.getElementById(this.taskStoreId);

        // Create a new task element in store if it's a new one.
        if (taskElement === null) {
            taskElement = document.createElement('span');
            taskStoreElement.appendChild(taskElement);
        }

        taskElement.id = taskIdForStore;
        taskElement.setAttribute('taskListId', taskModel.getTaskListId());
        taskElement.setAttribute('priorityName', taskModel.getName());
        taskElement.setAttribute('planStatus', taskModel.getPlanStatus());
        taskElement.setAttribute('position', taskModel.getPosition());
        taskElement.setAttribute('temporary', taskModel.isTemporary());
    };

    /**
     * Given the task ID, it retrieves from DOM the latest model represented by ID.
     *
     * @param taskId
     * @return the task model that represents the given taskId
     */
    TaskDAO.prototype.getTaskFromDOM = function (taskId) {
        var taskModel, taskListId, priorityName, position, planStatus, taskElement;
        taskElement = $('#'.concat(this.taskIdPrefix).concat(taskId));
        if (typeof taskElement === 'undefined') {
            throw 'Given Task ID does not exist';
        }

        priorityName = taskElement.attr('priorityName');
        planStatus = taskElement.attr('planStatus');
        taskListId = taskElement.attr('taskListId');
        position = taskElement.attr('position');
        taskModel = new TaskModel(priorityName, taskListId, taskId, planStatus, position);
        taskModel.setIsTemporary(taskElement.attr('temporary') === 'true');
        return taskModel;
    };

    /**
     * Removes the given task from DOM storage.
     *
     * @param taskId of task to remove from DOM storage.
     */
    TaskDAO.prototype.removeTaskFromDOM = function (taskId) {
        var taskElement, taskStoreElement;
        taskElement = $('#'.concat(this.taskIdPrefix).concat(taskId));
        taskStoreElement = document.getElementById(this.taskStoreId);

        //
        if (typeof taskElement === 'undefined') {
            return; // Does nothing if such ID cannot be found
        }
        taskElement.remove();
    };

    /**
     * Given the position number of a task, this returns the first task that matches the position number
     *
     * @param position to be matched in search
     */
    TaskDAO.prototype.getTaskByPosition = function (position) {
        var taskMatchingPosition;
        taskMatchingPosition = document.querySelector(''.concat('#task-store > span[position="', position, '"]'));

        if (taskMatchingPosition === null) {
            return null;
        }
        return this.getTaskFromDOM(taskMatchingPosition.id.substring(this.taskIdPrefix.length));
    };

    /**
     * Deletes the given task from DOM store.
     *
     * @param taskId
     */
    TaskDAO.prototype.deleteTaskFromDOM = function (taskId) {
        var taskElement;
        taskElement = document.getElementById(this.taskIdPrefix.concat(taskId));

        if (typeof taskElement == 'undefined') {
            throw 'Given Task ID does not exist';
        }

        taskElement.parentNode.removeChild(taskElement);
    }

    /**
     * Given the task Model, it updates it to the API.
     *
     * @param taskModel
     * @returns the promise handle, which then will be informed when update is done.
     */
    TaskDAO.prototype.updateTaskToAPI = function (taskModel) {
        var encodedTaskListId, encodedTaskId, url, data, newPriorityName;
        encodedTaskListId = window.btoa(taskModel.taskListId);
        encodedTaskId = window.btoa(taskModel.taskId);
        url = '/api/task/'.concat(encodedTaskListId, '/', encodedTaskId, '/');


        newPriorityName = taskModel.getPriorityNameForAPI();
        data = {priorityName: newPriorityName};

        if (taskModel.previous !== null) {
            data['previous'] = taskModel.previous;
        }
        return this.utils.makeRequest(url, 'POST', data).promise();
    };

    /**
     * This retrieves a list of tasks from API
     *
     * @return Promise, when object is returned.
     */
    TaskDAO.prototype.getTasksFromAPI = function () {
        var url = '/api/tasks/', callback, promise;
        callback = function (data, textStatus, jqXHR) {
            var i, parsedData, taskModels;
            taskModels = [];
            if (data) {
                parsedData = JSON.parse(data);
                parsedData.forEach(function (priorityList) {
                    var tasks, planStatus, priorityName, hashTagStartIndex;
                    tasks = priorityList.priorities;
                    for (i = 0; i < tasks.length; i++) {

                        // Re-format information received to construct task model objects.
                        planStatus = TaskDAO.prototype.getTaskPlanStatusFromGoogle(tasks[i].priorityName);
                        hashTagStartIndex = tasks[i].priorityName.indexOf(' #'.concat(planStatus));
                        if (hashTagStartIndex === -1) {
                            priorityName = tasks[i].priorityName;
                        } else {
                            priorityName = tasks[i].priorityName.substring(0, hashTagStartIndex);
                        }

                        taskModels.push(new TaskModel(priorityName, tasks[i].taskListId, tasks[i].priorityId, planStatus,
                            tasks[i].position));
                    }
                });
            }
            return taskModels;

        };

        promise = this.utils.makeRequest(url, 'GET', null, null).then(callback);

        return promise;

    };

    /**
     * Static method for retrieve plan status based on priorityName
     *
     * @param originalPriorityName
     * @returns {*}
     */
    TaskDAO.prototype.getTaskPlanStatusFromGoogle = function (originalPriorityName) {
        var i, hashTagStartIndex;
        for (i = 0; i < TaskModel.prototype.STATUSES.length; i++) {
            hashTagStartIndex = originalPriorityName.indexOf('#'.concat(TaskModel.prototype.STATUSES[i]));
            if (hashTagStartIndex !== -1) {
                return TaskModel.prototype.STATUSES[i];
            }
        }
    };

    /**
     *
     * @param priorityName which doesn't have hashTag.
     * @param planStatus of the priority
     * @return the task name that should be recorded in Google API
     */
    TaskDAO.prototype.getTaskNameForGoogle = function (priorityName, planStatus) {
        var hashTagStartIndex, newTaskPriorityName;
        if (typeof planStatus == 'undefined') {
            throw "plan status cannot be undefined";
        }
        hashTagStartIndex = priorityName.indexOf('#'.concat(planStatus));
        if (hashTagStartIndex !== -1) {
            throw "there is already # in the task model name, unexpected";
        }
        // Append the hashtag together to the name
        return priorityName.concat(' #', planStatus);
    };

    return TaskDAO;
}($));