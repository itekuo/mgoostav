<?php
session_cache_limiter(false);
session_start();
/**
 * Date: 9/6/14
 * Time: 10:40 AM
 * @author Ted Kuo <itekuo@gmail.com>
 */

/**
 * Specifies the path to this application. It's compulsory to append '/' to source. This is relative to the location of this file
 */
$srcPath = __DIR__ . '/../../../src/';

// Specifies the auto-loading to include source itself
/** @var Composer\AutoLoad\ClassLoader $loader */
$loader = require '../../../lib/vendor/autoload.php';
$loader->add('', $srcPath); // This is dodgy as it's hacking psr-0 auto-loader to use it's fallback mechanism

// Initialise application with configuration
$app = new \Slim\Slim();
$app->config(array(
    'templates.path' => '../'

));

/**
 * Initialise Middleware
 */
$middleWare = function() {
    // Return directly if already logged in.
    if (isset($_SESSION['service_token']) && $_SESSION['service_token']) {
        return;
    }
    $app = \Slim\Slim::getInstance();
    $app->redirect('/login');
};

/**
 * Route Setup for the backend - REST API. Meta-controller to setup controllers.
 */
$app->get('/api/calendar/:calendarId(/:year(/:month(/:day)))', $middleWare, function ($calendarId, $year = null, $month = null, $day = null) use ($app) {
    $ajax = false;
    if (is_null($day) || is_null($month) || is_null($year)) {
        $ajax = true;
        $todayTime = new DateTime();
        $year = $todayTime->format('Y');
        $month = $todayTime->format('m');
        $day = $todayTime->format('d');
    }

    $dateToCheck = Datetime::createFromFormat('Y-m-d', $year . '-' . $month . '-' . $day);
    $calendarId = base64_decode($calendarId);
    $monsieurFactory = new Monsieur_Factory();
    $calendarService = $monsieurFactory->createCalendarService();

    $arrayResult = $calendarService->get($calendarId, $dateToCheck);
    if ($ajax) {
        $result = json_encode($arrayResult);
        $app->response->write($result);
        return;
    }
    else {
        $app->render('api/result.php', array('result' => $arrayResult));
    }
});

/**
 * Adds a new calendar event to the given calendar ID. Requires three parameters in POST for specification of a new schedule
 * # summary - Specifies the title of the new schedule
 * # date - date of the new schedule
 * # time - time in UTC of the new schedule
 *
 * @param calendarId
 *
 */
$app->post('/api/calendar/:calendarId/', function ($calendarId) use ($app) {
    $calendarId = base64_decode($calendarId);
    $monsieurFactory = new Monsieur_Factory();
    $calendarService = $monsieurFactory->createCalendarService();
    $calendarService->authenticate();
    $summary = $app->request->post('summary');
    $date = $app->request->post('date');
    $time = $app->request->post('time');
    $taskIdLink = $app->request->post('taskIdLink');
    // TODO: Validation on the parameters, which is to be extracted into controllers.
    $startDateTime = DateTime::createFromFormat('Y-m-d\TH:i', $date . 'T' . $time, new DateTimeZone('UTC'));
    $endDateTime = DateTime::createFromFormat('Y-m-d\TH:i', $date . 'T' . $time, new DateTimeZone('UTC'));
    $oneHour = new DateInterval('PT1H');
    $endDateTime->add($oneHour);

    $schedule = new Monsieur_Calendar_Schedule(null, $summary, $startDateTime->format(DateTime::ATOM),
        $endDateTime->format(DateTime::ATOM), $taskIdLink);
    $scheduleAdded = $calendarService->add($calendarId, $schedule);
    $result = json_encode($scheduleAdded);
    $app->response->write($result);
    return;
//    $app->render('api/result.php',  array('result' => array($schedule)));
});

$app->delete('/api/calendar/:calendarId/:id', function ($calendarId, $id) use ($app) {
    $calendarId = base64_decode($calendarId);
    $monsieurFactory = new Monsieur_Factory();
    $calendarService = $monsieurFactory->createCalendarService();
    $deleted = $calendarService->delete($calendarId, $id);
    if ($deleted) {
        $result = '1';
    } else {
        $result = '-1';
    }
    $app->response->write($result);
    return;
//    $app->render('api/result.php',  array('result' => array($deleted)));
});

$app->put('/api/calendar/:calendarId/:id', function ($calendarId, $id) use ($app) {
    $calendarId = base64_decode($calendarId);
    $monsieurFactory = new Monsieur_Factory();
    $calendarService = $monsieurFactory->createCalendarService();
    $summary = $app->request->post('summary');
    $date = $app->request->post('date');
    $time = $app->request->post('time');
    $taskIdLink = $app->request->post('taskIdLink');

    if (!empty($date) && !empty($time)) {
        // TODO: Validation on the parameters, which is to be extracted into controllers.
        $startDateTime = DateTime::createFromFormat('Y-m-d\TH:i', $date . 'T' . $time, new DateTimeZone('UTC'));
        $endDateTime = DateTime::createFromFormat('Y-m-d\TH:i', $date . 'T' . $time, new DateTimeZone('UTC'));
        $oneHour = new DateInterval('PT1H');
        $endDateTime->add($oneHour);
    }

    $schedule = new Monsieur_Calendar_Schedule($id, $summary, $startDateTime->format(DateTime::ATOM),
        $endDateTime->format(DateTime::ATOM), $taskIdLink);

    $scheduleAdded = $calendarService->update($calendarId, $schedule);
    $result = json_encode($scheduleAdded);
    $app->response->write($result);
    return;
//    $app->render('api/result.php',  array('result' => array($schedule)));
});

$app->get('/api/task/:taskListId/', function ($taskListId) use ($app) {
    $taskListId = base64_decode($taskListId);
    $monsieurFactory = new Monsieur_Factory();
    $taskService = $monsieurFactory->createTaskService();
    $priorities = $taskService->getTasks($taskListId);
    $app->render('api/result.php', array('result' => $priorities));
});


/**
 * Updates a task
 */
$app->post('/api/task/:taskListId/:taskId/', function ($taskListId, $taskId) use ($app) {
    if (is_null($taskListId) || is_null($taskId)) {
        throw new InvalidArgumentException('Task list ID must be present');
    }
    $taskListId = base64_decode($taskListId);
    $taskId = base64_decode($taskId);
    $monsieurFactory = new Monsieur_Factory();
    $taskService = $monsieurFactory->createTaskService();

    $completed = $app->request->post('completed');
    $priorityName = $app->request->post('priorityName');
    $previous = $app->request->post('previous');
    if (!empty($completed) && $completed == 'completed') {

        $taskService->completeTask($taskListId, $taskId);
        $app->response->write('1');
        return;
    }
    else if (!empty($priorityName) && !empty($taskId)) { // Updates the priority name
        $taskService->updateTask($taskListId, $taskId, $priorityName, $previous);
        $app->response->write('1');
        return;
    }
});

$app->post('/api/task/add/', function() use ($app) {
    $priorityName = $app->request->post('priorityName');
    if(is_null($priorityName) || empty($priorityName)) {
        throw new InvalidArgumentException('Priority name must be present');
    }
    $monsieurFactory = new Monsieur_Factory();
    $taskService = $monsieurFactory->createTaskService();
    $taskService->addTask($priorityName);
    $app->response->write('1');
    return;
});

$app->delete('/api/task/:taskListId/:taskId/', function ($taskListId, $taskId) use ($app) {
    $taskListId = base64_decode($taskListId);
    $taskId = base64_decode($taskId);
    $monsieurFactory = new Monsieur_Factory();
    $taskService = $monsieurFactory->createTaskService();

    $updatedTask = $taskService->delete($taskListId, $taskId);
    return $updatedTask;
});

/**
 * This gets the list of tasks to be planned for this user. This includes tasks from all lists.
 */
$app->get('/api/tasks/', function() use ($app) {
    $monsieurFactory = new Monsieur_Factory();

    /** @type Monsieur_Task_Service $taskService */
    $taskService = $monsieurFactory->createTaskService();
    $priorityListCollection = $taskService->getPriorityListForDailyPlan();
    $result = json_encode($priorityListCollection);
    $app->response->write($result);
    return;
});

/**
 * Front-end Controller
 */
$app->get('/admin/', function() use ($app) {
    $monsieurFactory = new Monsieur_Factory();
    /** @var Monsieur_Auth_Service $authService */
    $authService = $monsieurFactory->createAuthService();
    $loginRequired = true;
    $authURL = "";
    $userEmail = "";
    if ($authService->isLoggedIn()) {
        $loginRequired = false;
        $userEmail = $authService->getUserEmail();
    } else {
        $authURL = $authService->createAuthURL();
    }


    $app->render('api/admin.php', array('loginRequired' => $loginRequired,
                                        'authURL' => $authURL,
                                        'userEmail' => $userEmail));
});

$app->get('/day/', function() use ($app) {
    $monsieurFactory = new Monsieur_Factory();
    /** @var Monsieur_Auth_Service $authService */
    $authService = $monsieurFactory->createAuthService();
    $loginRequired = true;
    $authURL = "";
    $userEmail = "";
    if ($authService->isLoggedIn()) {
        $loginRequired = false;
        $userEmail = $authService->getUserEmail();
    } else {
        $authURL = $authService->createAuthURL();
    }

    $today = array();
    $todayDate = new DateTime();
    $today[] = $todayDate->format('F d, Y');
    $today[] = $todayDate->format('l');

    /** @type Monsieur_Calendar_Service $calendarService */
    $calendarService = $monsieurFactory->createCalendarService();
    $calendarId = $calendarService->getCalendarIdFromDB();

    $app->render('monsieur/day.php', array(
        'loginRequired' => $loginRequired,
        'authURL' => $authURL,
        'userEmail' => $userEmail,
        'todayLine1' => $today[0],
        'todayLine2' => $today[1],
        'calendarId' => base64_encode($calendarId)));
});

/**
 * AJAX Interface
 */
$app->get('/admin/calendar', function() use ($app) {
    $monsieurFactory = new Monsieur_Factory();
    /** @var Monsieur_Auth_Service $authService */
    $authService = $monsieurFactory->createAuthService();
    $calendarService = $monsieurFactory->createCalendarService();
    $calendarIds = array();
    if ($authService->isLoggedIn()) {
        $calendarIds = $calendarService->getCalendarIds();
    }
    $app->render('api/calendarAdmin.php', array('calendarIds' => $calendarIds));
});
$app->get('/admin/task', function() use ($app) {
    $monsieurFactory = new Monsieur_Factory();
    /** @var Monsieur_Task_Service $taskService */
    $taskService = $monsieurFactory->createTaskService();
    /** @var Monsieur_Auth_Service $authService */
    $authService = $monsieurFactory->createAuthService();
    $taskListIds = array();
    if ($authService->isLoggedIn()) {
        $taskListIds = $taskService->getTaskListIdTitleMap();
    }
    $app->render('api/taskAdmin.php', array('taskListIds' => $taskListIds));
});
$app->get('/login', function() use ($app) {
    $monsieurFactory = new Monsieur_Factory();
    $authService = $monsieurFactory->createAuthService();
    $app->render('api/login.php', array('authURL' => $authService->createAuthURL()));
});
$app->get('/auth/+', function() use ($app) {
    if (!isset($_GET['code'])) {
        $app->error('Code was not received');
    }
    $monsieurFactory = new Monsieur_Factory();
    /** @var Monsieur_Auth_Service $authService */
    $authService = $monsieurFactory->createAuthService();
    $code = $_GET['code'];
    try {
        $authService->authenticate($code);
        $app->redirect('/admin/');
    } catch (Google_Service_Exception $e) {
        $app->error('Authentication failed');
    }
});

// Run
$app->run();