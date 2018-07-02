/*global  $*/

/**
 * Created by user on 11/2/14.
 */
// Utilities
var timeUtils = new TimeUtils();
var utils = new Utils();
var viewUtilities = new ViewUtilities();

// DAO
var scheduleDAO = new ScheduleDAO(utils, timeUtils);
var taskDAO = new TaskDAO(utils);

// View
var taskView = new TaskView(viewUtilities);
var scheduleView = new ScheduleView(viewUtilities, timeUtils);

// Controller
var taskController = new TaskController(utils, taskView, taskDAO);
var scheduleController = new ScheduleController(utils, timeUtils, scheduleView, scheduleDAO);
var plannerController = new PlannerController(utils, timeUtils, viewUtilities, scheduleDAO, taskController, scheduleController);



// DOM Ready, start initialisation
$(function ($) {
    taskController.setupEvents();
    taskController.setupTaskTable();
    var promise = taskController.fillTaskLists();
    promise.then(function () {taskController.setupEvents(); });
    promise.then(function () {plannerController.setupEventsOnDayCalendar(); });
    promise.then(function () {
        scheduleController.setupCalendarTable();
        scheduleController.fillSchedules();
        scheduleController.setupScheduleEvents();
    });
});