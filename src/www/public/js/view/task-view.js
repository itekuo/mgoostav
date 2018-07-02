/*global  $*/
var TaskView = (function ($) {

    /**
     * @constructor
     */
    var TaskView = function (viewUtilities) {
        this.viewUtilities = viewUtilities;
    };

    /**
     * Given a TaskModel, it creates and returns a new corresponding task view element
     *
     * @param taskModel to be rendered in HTML
     * @returns {HTMLElement} representing task in view
     */
    TaskView.prototype.createNewTaskElement = function (taskModel) {
        var taskRow, completeAction, deleteAction, taskName, taskUpdateFlag;
        taskRow = document.createElement('tr');
        taskRow.id = taskModel.getTaskId();
        taskRow.classList.add('task-row');
        taskRow.setAttribute('position', taskModel.getPosition());

        completeAction = document.createElement('td');
        this.viewUtilities.addClasses(completeAction, 'glyphicon glyphicon-ok task-item-complete-action');
        completeAction.classList.add('col-lg-1');
        completeAction.classList.add('task-item-action');
        taskRow.appendChild(completeAction);

        deleteAction = document.createElement('td');
        this.viewUtilities.addClasses(deleteAction, 'glyphicon glyphicon-remove task-item-delete-action');
        deleteAction.classList.add('col-lg-1');
        deleteAction.classList.add('task-item-action');
        taskRow.appendChild(deleteAction);

        taskName = document.createElement('td');
        taskName.classList.add('col-lg-10');
        taskName.classList.add('task-item');
        taskName.setAttribute('contenteditable', '');
        taskName.innerHTML = taskModel.getName();
        taskName.setAttribute('draggable', 'true');
        taskRow.appendChild(taskName);

        if (taskModel.isTemporary() === true) {
            taskRow.classList.add('temporary');
        }

        taskUpdateFlag = document.createElement('td');
        this.viewUtilities.addClasses(taskUpdateFlag, 'task-item glyphicon glyphicon-flash task-item-feedback');
        taskRow.appendChild(taskUpdateFlag);

        return taskRow;
    };

    /**
     * Retrieves the task that is current under the hover the mouse x & y. It's assumed to be client X and client Y
     *
     * @param x client X
     * @param y client Y
     * @return the id of the task currently under X & Y, otherwise return null
     */
    TaskView.prototype.getTaskIdAtPoint = function (x, y) {
        var currentTaskRow, taskRows, i, isTheTask;
        taskRows = document.querySelectorAll('.task-row');
        for (i = 0; i < taskRows.length; i++) {
            currentTaskRow = taskRows[i];
            isTheTask = this.viewUtilities.isWithinBoundRectangle(x, y, currentTaskRow.getBoundingClientRect());
            if (isTheTask === true) {
                return currentTaskRow.id;
            }
        }
        return null;
    };

    /**
     * This adds the given task model to the card type given. If the given type doesn't belong to TaskController.types,
     * then nothing is done.
     *
     * If the given taskModel already exists, it removes it from it's original list and add it to the right
     * list and at the right position.
     *
     * Lastly, it toggles to display the given task in list.
     *
     * @param taskModel
     * @param type from TaskController
     */
    TaskView.prototype.addTaskToList = function (taskModel, type) {
        var taskListElement, taskRow, typeId, taskListNodes, i, chosenNode, currentTaskNode;
        typeId = this.getTypeId(type);
        taskListElement = document.querySelector('#'.concat(typeId, '>tbody'));

        /* Get/Create the task view element representing the taskModel */
        taskRow = document.querySelector('#'.concat(taskModel.getTaskId()));
        if (taskRow !== null) {
            taskRow.parentNode.removeChild(taskRow);
        }
        taskRow = this.createNewTaskElement(taskModel);

        // Insert it at the right position
        taskListNodes = taskListElement.querySelectorAll('tr');
        for (i = 0; i < taskListNodes.length; i++) {
            currentTaskNode = taskListNodes[i];
            if (currentTaskNode.getAttribute('position') > taskRow.getAttribute('position')) {
                chosenNode = currentTaskNode;
                break;
            }
        }

        if (typeof chosenNode === 'undefined') {
            taskListElement.appendChild(taskRow);
        } else {
            taskListElement.insertBefore(taskRow, chosenNode);
        }

        this.toggleTaskDisplay(taskModel, true);
    };

    /**
     * This when invoked removes all temporary tasks that were created for user assistance reasons in view. This should
     * be invoked whenever a user change is confirmed.
     */
    TaskView.prototype.removeTemporaryTask = function () {
        var taskListSection, currentTemporaryTask, temporaryTasks, i;
        taskListSection = document.getElementById('task-list-section');
        temporaryTasks = taskListSection.querySelectorAll('.temporary');
        for (i = 0; i < temporaryTasks.length; i++) {
            currentTemporaryTask = temporaryTasks[i];
            currentTemporaryTask.parentNode.removeChild(currentTemporaryTask);
        }
    };

    /**
     * Removes the given taskModel from task list cards, within the task view (within the boundary of task-list-section).
     *
     * @param taskModel
     * @param isShown true if to be hidden, false otherwise
     * @returns {boolean}
     */
    TaskView.prototype.toggleTaskDisplay = function (taskModel, isShown) {
        var taskElement, taskListViewSection;
        taskListViewSection = document.getElementById('task-list-section');
        taskElement = taskListViewSection.querySelector('#'.concat(taskModel.getTaskId()));
        if (taskElement !== null) {
            if (isShown) {
                taskElement.style.display = 'table-row'
            } else {
                taskElement.style.display = 'none';
            }

        }
        return true;
    };

    /**
     * Once asked, for a given taskId, it animates to indicates to user an update to the task has occurred.
     *
     * @param taskId to update
     */
    TaskView.prototype.animateUpdate = function (taskId) {
        var fadeOut, taskElementToUpdate;
        taskElementToUpdate = $('#'.concat(taskId));
        fadeOut = function () {
            taskElementToUpdate.children('.task-item-feedback').animate({opacity: 0}, 500);
        };
        taskElementToUpdate.children('.task-item-feedback').animate({opacity: 1}, 200, fadeOut);
    };


    /**
     * Given a list of string indicates the type list. This setups the task cards as many as indicated in the given list of type.
     *
     * @param $typeList a string indicating the name of each type.
     */
    TaskView.prototype.setupTaskTable = function (typeList) {
        var type, taskListCard, cardHeading, table, tableBody, root;
        for (type in typeList) {
            if (typeList.hasOwnProperty(type)) {
                taskListCard = document.createElement('div');
                taskListCard.classList.add('task-list-card');

                cardHeading = document.createElement('h5');
                cardHeading.classList.add('task-list-card-heading');
                cardHeading.innerHTML = this.getTypeId(type);
                taskListCard.appendChild(cardHeading);

                table = document.createElement('table');
                table.id = this.getTypeId(type);
                table.classList.add('table');
                table.classList.add('table-hover');
                taskListCard.appendChild(table);

                tableBody = document.createElement('tbody');
                table.appendChild(tableBody);

                root = document.querySelector('#task-list-section');
                root.appendChild(taskListCard);
            }
        }
    };

    TaskView.prototype.getTypeId = function (type) {
        return type.toLowerCase().split(' ').join('_');
    };

    return TaskView;
}($));