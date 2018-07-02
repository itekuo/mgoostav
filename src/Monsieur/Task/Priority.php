<?php
/**
 * Created by PhpStorm.
 * User: tkuo
 * Date: 10/4/14
 * Time: 5:59 PM
 */

class Monsieur_Task_Priority implements JsonSerializable {

    /** @var int */
    private $priorityId;

    /** @var int */
    private $taskListId;

    /** @var string  */
    private $priorityName;

    /** @var bool */
    private $isCompleted;

    /** @var string */
    private $note;

    /**
     * Indicates the position of this task, in lexicographic order relative to other tasks. At present, this is made
     * to be read-only
     *
     * @var string
     */
    private $position;

    /**
     * Stores the position of it's previous task. This is only not null when a move is intended. All tasks fetched fresh
     * from Google has this value set to null.
     *
     * @var string
     */
    private $previous;

    /**
     * Constructor
     *
     * @param $taskListId
     * @param $priorityId
     * @param $priorityName
     * @param $position
     */
    function __construct($taskListId, $priorityId, $priorityName, $position) {
        $this->taskListId = $taskListId;
        $this->priorityId = $priorityId;
        $this->priorityName = $priorityName;
        $this->position = $position;
        $this->isCompleted = false;
        $this->previous = null;
        $this->note = '';
    }

    /**
     * Creates a new instance of priority based on the information from Google_Service_Tasks_Task
     *
     * @param int $taskListId
     * @param Google_Service_Tasks_Task $task
     * @return Monsieur_Task_Priority
     */
    public static function createFromGoogleTask($taskListId, Google_Service_Tasks_Task $task) {
        $newPriority = new Monsieur_Task_Priority($taskListId, $task->id, $task->title, $task->getPosition());
        if ($task->status == 'needsAction') {
            $newPriority->setIsCompleted(false);
        } elseif ($task->status == 'completed') {
            $newPriority->setIsCompleted(true);
        }
        $newPriority->setNote($task->notes);
        return $newPriority;
    }

    /**
     * @param string $priorityName
     */
    public function setPriorityName($priorityName)
    {
        $this->priorityName = $priorityName;
    }

    /**
     * @return string
     */
    public function getPriorityName()
    {
        return $this->priorityName;
    }

    /**
     * @return string
     */
    public function getPosition()
    {
        return $this->position;
    }

    /**
     * @param boolean $isCompleted
     */
    public function setIsCompleted($isCompleted)
    {
        $this->isCompleted = $isCompleted;
    }

    /**
     * @return boolean
     */
    public function getIsCompleted()
    {
        return $this->isCompleted;
    }

    /**
     * @param string $previous specifies the position of it's previous task in the list.
     */
    public function setPrevious($previous)
    {
        $this->previous = $previous;
    }

    /**
     * @return null|string
     */
    public function getPrevious()
    {
        return $this->previous;
    }

    /**
     * @param int $priorityId
     */
    public function setPriorityId($priorityId)
    {
        $this->priorityId = $priorityId;
    }

    /**
     * @return int
     */
    public function getPriorityId()
    {
        return $this->priorityId;
    }

    /**
     * @param int $taskListId
     */
    public function setTaskListId($taskListId)
    {
        $this->taskListId = $taskListId;
    }

    /**
     * @return int
     */
    public function getTaskListId()
    {
        return $this->taskListId;
    }

    /**
     * @param string $note
     */
    public function setNote($note)
    {
        $this->note = $note;
    }

    /**
     * @return string
     */
    public function getNote()
    {
        return $this->note;
    }

    /**
     * @return string
     */
    public function __toString()
    {
        return "[" . $this->priorityName . "]";
    }

    /**
     * To Google Task format, for communication with Google
     *
     * @return Google_Service_Tasks_Task
     */
    public function toGoogleTask() {
        $googleTask = new Google_Service_Tasks_Task();
        if ($this->isCompleted) {
            $googleTask->setStatus('completed');
        } else {
            $googleTask->setStatus('needsAction');
        }
        $googleTask->id = $this->getPriorityId();
        $googleTask->title = $this->priorityName;
        // Position is omited because it's a read-only field, doesn't need to be updated to Google
        $googleTask->notes = $this->getNote();
        return $googleTask;
    }

    /**
     * (PHP 5 &gt;= 5.4.0)<br/>
     * Specify data which should be serialized to JSON
     * @link http://php.net/manual/en/jsonserializable.jsonserialize.php
     * @return mixed data which can be serialized by <b>json_encode</b>,
     * which is a value of any type other than a resource.
     */
    public function jsonSerialize()
    {
        return array('priorityId' => $this->priorityId,
            'taskListId' => $this->taskListId,
            'priorityName' => $this->getPriorityName(),
            'isCompleted' => $this->getIsCompleted(),
            'position' => $this->getPosition());

    }
}