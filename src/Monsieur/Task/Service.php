<?php
/**
 * Created by PhpStorm.
 * User: tkuo
 * Date: 10/4/14
 * Time: 5:57 PM
 */

class Monsieur_Task_Service {

    /**
     * Application name
     */
    const APPLICATION_NAME = 'M. Goostav Task Management';

    /**
     * Session key for storing access token from Google
     */
    const ACCESS_TOKEN = 'service_token';

    /**
     * @var string ClientID passed to Google that is used for usage tracking purpose
     */
    private $serviceAccountName;

    /**
     * @var string specifies the file path which contains the
     */
    private $privateKey;

    /**
     * @var Google_Auth_AssertionCredentials
     */
    private $googleAssertionCredentials;

    /**
     * @var Google_Client
     */
    private $client;

    /**
     * @var Google_Service_Tasks taskService
     */
    private $taskService;

    /**
     * Holds the connection to db.
     * @var
     */
    private $db;

    /**
     * Constructor
     *
     * @param Google_Client $googleClient
     */
    function __construct(Google_Client $googleClient) {
        $this->client = $googleClient;

        // Initialise tasks service
        $this->taskService = new Google_Service_Tasks($this->client);
    }

    private function setupServicedAccountClient($developerKey, $serviceAccountName, $privateKey) {
        // Setup Google client for later communication
        $this->client = new Google_Client();
        $this->client->setApplicationName(self::APPLICATION_NAME);
        $this->client->setDeveloperKey($developerKey);
        if (!empty($_SESSION[self::ACCESS_TOKEN])) {
            $currentAccessToken = $_SESSION[self::ACCESS_TOKEN];
            $this->client->setAccessToken($currentAccessToken);
        }

        // Saves information required for authentication later.
        $this->serviceAccountName = $serviceAccountName;
        $this->privateKey = $privateKey;
        $this->googleAssertionCredentials = new Google_Auth_AssertionCredentials($this->serviceAccountName,
            Google_Service_Tasks::TASKS, $this->privateKey);
        $this->client->setAssertionCredentials($this->googleAssertionCredentials);
    }

    /**
     * In order to get access the tasks, this performs the required authentication to gain access.
     * It stores the access token in session.
     *
     * @return true if user is authenticated, false otherwise
     */
    public function authenticate() {
        if ($this->client->isAccessTokenExpired()) {
            $token = $this->client->getAccessToken();
            var_dump($token);
//            $this->client->getAuth()->refreshToken($token['refresh_token']);
            $_SESSION[self::ACCESS_TOKEN] = $this->client->getAccessToken();
        }

        return true;
    }

    /**
     * Retrieves a map of task-list titles mapped by it's ID for the current user.
     *
     * @return array map of task list titles mapped by it's ID
     */
    public function getTaskListIdTitleMap() {
        // Authenticate
        static::authenticate();

        /** @var Google_Service_Tasks_TaskLists $taskList */
        $taskList = $this->taskService->tasklists->listTasklists();

        /** @var Google_Service_Tasks_TaskList[] $items */
        $items = $taskList->getItems();

        $taskListIds = array();
        foreach ($items as $item) {
            $taskListIds[$item->getId()] = $item->getTitle();
        }
        return $taskListIds;
    }

    /**
     * Retrieves list of all tasks in the given task list.
     *
     * @param string $taskListId
     * @return Monsieur_Task_Priority[] array of priorities
     */
    public function getTasks($taskListId) {
        // Authenticate first
        static::authenticate();

        // Always include completed for now.
        /** @var Google_Service_Tasks_Tasks $tasks */
        $tasks = $this->taskService->tasks->listTasks($taskListId);

        /** @var Google_Service_Tasks_Task $task */
        $priorityList = array();
        foreach($tasks->getItems() as $task) {
            $priority = Monsieur_Task_Priority::createFromGoogleTask($taskListId, $task);
            $priorityList[] = $priority;
        }
        return $priorityList;
    }

    /**
     * Completes a given task. It does not care if it's currently completed.
     *
     * @param string $taskListId
     * @param string $taskId
     * @throws InvalidArgumentException
     * @throws Exception
     * @return Monsieur_Task_Priority latest task that is completed
     */
    public function completeTask($taskListId, $taskId) {
        if (is_null($taskListId) || is_null($taskId)) {
            throw new InvalidArgumentException("taskId or taskList ID is null");
        }

        /** @type Google_Service_Tasks_Task */
        $task = $this->taskService->tasks->get($taskListId, $taskId);
        if (is_null($task)) {
            throw new Exception(printf("Cannot get task for %s, %s", $taskListId, $taskId));
        }

        $task->setStatus('completed');
        /** @type Google_Service_Tasks_Task $result */
        $result = $this->taskService->tasks->update($taskListId, $taskId, $task);
        return Monsieur_Task_Priority::createFromGoogleTask($taskListId, $result);
    }

    /**
     * @param $priorityName
     * @throws InvalidArgumentException
     * @throws Exception
     * @return Google_Service_Tasks_Task
     */
    public function addTask($priorityName) {
        if (is_null($priorityName)) {
            throw new InvalidArgumentException("Task list ID or priority name must be present");
        }

        // Automatically select the taskList
        /** @var Monsieur_Task_PriorityList[] $priorityListCollection */
        $priorityListCollection = static::getPriorityListsFromDB();
        if (!isset($priorityListCollection['To plan']) || empty($priorityListCollection['To plan'])) {
            throw new Exception('To plan priority list is not present');
        }
        /** @var Monsieur_Task_PriorityList $priorityList */
        $priorityList = $priorityListCollection['To plan'];
        $taskListId = $priorityList->getGoogleId();

        $newPriority = new Monsieur_Task_Priority($taskListId, null, $priorityName);
        $newPriority->setNote('Created by Monsieur Goostav');
        $insertedTask = $this->taskService->tasks->insert($taskListId, $newPriority->toGoogleTask());
        return $insertedTask;
    }

    /**
     * Updates the given task to Google Service. It supports updates to name and position.
     *
     * @param $taskListId
     * @param $taskId
     * @param $priorityName
     * @param $previous
     * @throws InvalidArgumentException
     * @throws Exception
     */
    public function updateTask($taskListId, $taskId, $priorityName, $previous) {
        if (is_null($taskListId) || is_null($taskId)) {
            throw new InvalidArgumentException("taskId or taskList ID is null");
        }

        /** @type Google_Service_Tasks_Task */
        $task = $this->taskService->tasks->get($taskListId, $taskId);
        if (is_null($task)) {
            throw new Exception(printf("Cannot get task for %s, %s", $taskListId, $taskId));
        }
        $priority = Monsieur_Task_Priority::createFromGoogleTask($taskListId, $task);
        $priority->setPriorityName($priorityName);

        // If a  move is intended, set the previous attribute.
        if (!is_null($previous)) {
            $priority->setPrevious($previous);
        }

        /** @type Google_Service_Tasks_Task $result */
        static::update($priority);
    }

    /**
     * Deletes the given task
     *
     * @param $taskListId
     * @param $taskId
     * @return Monsieur_Task_Priority
     * @throws InvalidArgumentException
     * @throws Exception
     */
    public function deleteTask($taskListId, $taskId) {
        if (is_null($taskListId) || is_null($taskId)) {
            throw new InvalidArgumentException("taskId or taskList ID is null");
        }

        /** @type Google_Service_Tasks_Task */
        $task = $this->taskService->tasks->get($taskListId, $taskId);
        if (is_null($task)) {
            throw new Exception(printf("Task does not exist for %s, %s", $taskListId, $taskId));
        }

        $task->setDeleted(true);
        /** @type Google_Service_Tasks_Task $result */
        $result = $this->taskService->tasks->update($taskListId, $taskId, $task);
        return Monsieur_Task_Priority::createFromGoogleTask($taskListId, $result);
    }

    /**
     * Deletes priority based on the given priorityId and it's taskListId.
     *
     * @param $taskListId
     * @param $priorityId
     * @return true if success, false otherwiscde
     */
    public function delete($taskListId, $priorityId) {
        // Authenticate first
        static::authenticate();

        return $this->taskService->tasks->delete($taskListId, $priorityId);
    }

    /**
     * Updates the given priority to Google.
     *
     * @param Monsieur_Task_Priority $priority
     * @return Google_Service_Tasks_Task
     */
    public function update(Monsieur_Task_Priority $priority) {
        // Always include completed for now.
        /** @var Google_Service_Tasks_Task $googleTask */
        $googleTask = $priority->toGoogleTask();
        $updatedTask = $this->taskService->tasks->update($priority->getTaskListId(), $priority->getPriorityId(), $googleTask);

        if (!is_null($priority->getPrevious())) {
            $updatedTask = $this->taskService->tasks->move($priority->getTaskListId(), $priority->getPriorityId(), array('previous' => $priority->getPrevious()));
        }

        return $updatedTask;
    }

    /**
     * Trigger an update to mark a task as completed.
     *
     * @param Monsieur_Task_Priority $priority
     * @return Google_Service_Tasks_Task
     */
    public function markAsCompleted(Monsieur_Task_Priority $priority) {
        $priority->setIsCompleted(true);
        return $this->update($priority);
    }

    /**
     * This is called for daily planning to retrieve 4 task lists
     *
     * @return PriorityList[] for planning, indexed by it's type
     */
    public function getPriorityListForDailyPlan() {
        // Get from DB
        $priorityListCollection = self::getPriorityListsFromDB();

        // Use the Ids to fetch the tasks.
        foreach ($priorityListCollection as $priorityList) {
            $taskListId = $priorityList->getGoogleId();
            $priorities = static::getTasks($taskListId);
            $priorityList->setPriorityCollection($priorities);
        }

        return $priorityListCollection;
    }

    /**
     * Fetch from db
     *
     * @return Monsieur_Task_PriorityList[] collection keyed by it's type.
     */
    private function getPriorityListsFromDB() {
        // Get the token from the current user
        static::authenticate();
        $attributes = $this->client->verifyIdToken()->getAttributes();
        $payload = $attributes['payload'];
        $userEmail = $payload['email'];

        // Fetches collection of priority list configured from DB
        $priorityList = array();
        $priorityList[] = new Monsieur_Task_PriorityList($userEmail, 'To Plan', 1, 'MTUxMjkzODQ5NDExODM5ODkwMTQ6Njc0MDA1OTQ6MA', Monsieur_Task_PriorityList::TO_PLAN);
        return $priorityList;
    }


} 