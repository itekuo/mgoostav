<?php

/**
 * Created by PhpStorm.
 * User: tkuo
 * Date: 9/6/14
 * Time: 12:38 PM
 */

/**
 * Class Monsieur_Calendar_Schedule specifies the 'model' for a scheduled priority.
 *
 * At present, it only supports schedule that has both date & time. A whole day event is translated to have time of '00:00:00'
 */
class Monsieur_Calendar_Schedule implements JsonSerializable {

    /**
     * Specifies the format that's used for communicating with Google
     */
    const GOOGLE_FORMAT = DateTime::ATOM;

    const JSON_DATE_FORMAT = DateTime::ISO8601;

    /**
     * Specifies the prefix key for id a task link in a description.
     */
    const GOOGLE_TASK_LINK_SYMBOL_KEY_PREFIX = '$$@';

    /** @var $priorityName string */
    private $priorityName;

    /** @var $startDateTime DateTime */
    private $startDateTime;

    /** @var $endDateTime DateTime */
    private $endDateTime;

    /**
     * This specifies the schedule ID stored in Google. Any schedule without id indicates a new schedule.
     * @var $scheduleId int
     */
    private $scheduleId;

    /**
     * This specifies the task Id of a task which this schedule is created from. This is an optional field, however,
     * expected from all schedules created by Monsieur Goostav.
     *
     * @var $taskId string recorded in the format of "{taskListId}-{taskId}"
     */
    private $taskIdLink;

    /**
     * Constructor
     *
     * @param $scheduleId int
     * @param $priorityName string
     * @param $startDateTime string only accepts ATOM format, date on which this is scheduled.
     * @param $endDateTime string only accepts ATOM format, dates on which this is scheduled.
     * @param string $taskIdLink
     */
    function __construct($scheduleId, $priorityName, $startDateTime, $endDateTime, $taskIdLink) {
        $this->scheduleId = $scheduleId;
        $this->priorityName = $priorityName;
        $this->setStartDateTime($startDateTime);
        $this->setEndDateTime($endDateTime);
        if (!empty($taskIdLink) && strpos($taskIdLink, '-') !== false) {
            $this->taskIdLink = $taskIdLink;
        }
    }

    /**
     * @param int $scheduleId
     */
    public function setScheduleId($scheduleId)
    {
        $this->scheduleId = $scheduleId;
    }

    /**
     * @return int
     */
    public function getScheduleId()
    {
        return $this->scheduleId;
    }

    public function getPriorityName() {
        return $this->priorityName;
    }

    public function setPriorityName($priorityName) {
        if (!$priorityName) {
            throw new InvalidArgumentException("The given priority name is not right");
        }
        $this->priorityName = $priorityName;
    }

    public function getStartDateTime() {
        return $this->startDateTime;
    }

    public function getEndDateTime() {
        return $this->endDateTime;
    }

    public function getTaskIdLink() {
        return $this->taskIdLink;
    }

    /**
     * This returns the start date time of this schedule in Google Date Time format.
     *
     * @return string
     */
    public function getStartDateTimeInGoogleFormat() {
        return $this->startDateTime->format(self::GOOGLE_FORMAT);
    }

    /**
     * This returns the end date time of this schedule in Google Date Time format.
     *
     * @return string
     */
    public function getEndDateTimeInGoogleFormat() {
        return $this->endDateTime->format(self::GOOGLE_FORMAT);
    }

    /**
     * Sets the given date variable to be the start date time of this schedule. Assumed in the format of DateTime::ATOM
     *
     * @param string $startDateTime in the format of <code>DateTime::ATOM</code>
     * @throws InvalidArgumentException
     */
    public function setStartDateTime($startDateTime) {
        if (empty($startDateTime)) {
            throw new InvalidArgumentException("The given date is not set or evaluates to false");
        }

        $formattedDate = $this->formatDateTime($startDateTime);
        $this->startDateTime = $formattedDate;
    }

    /**
     * Sets the given time to be the end date time of this schedule. Assumed in the format of DateTime::ATOM
     *
     * @param string $endDateTime
     * @throws InvalidArgumentException
     */
    public function setEndDateTime($endDateTime) {
        if (empty($endDateTime)) {
            throw new InvalidArgumentException("The given date is not set or evaluates to false");
        }

        $formattedDate = $this->formatDateTime($endDateTime);
        $this->endDateTime = $formattedDate;
    }

    /**
     * Formats the given date time, assumed in DateTime::ATOM format.
     *
     * @param string $dateTime
     * @return DateTime
     * @throws InvalidArgumentException
     */
    private function formatDateTime($dateTime)
    {
        $formattedDate = DateTime::createFromFormat(DateTime::ATOM, $dateTime);
        if ($formattedDate === false) {
            throw new InvalidArgumentException("The given date is in the wrong format" . $dateTime);
        }
        return $formattedDate;
    }

    /**
     * Translate this schedule as a google event
     *
     * @return Google_Service_Calendar_Event
     */
    public function toGoogleEvent() {
        $event = new Google_Service_Calendar_Event();
        $event->setSummary($this->getPriorityName());
        $event->setId($this->getScheduleId());

        $startDate = new Google_Service_Calendar_EventDateTime();
        $formattedStartDate = $this->getStartDateTimeInGoogleFormat();
        $startDate->setDateTime($formattedStartDate);
        $startDate->setTimeZone('Asia/Singapore');
        $event->setStart($startDate);

        $endDate = new Google_Service_Calendar_EventDateTime();
        $formattedEndDate = $this->getEndDateTimeInGoogleFormat();
        $endDate->setDateTime($formattedEndDate);
        $endDate->setTimeZone('Asia/Singapore');
        $event->setEnd($endDate);

        $event->setAttendees(array());

        if ($this->getTaskIdLink() != null) {
            $event->setDescription(Monsieur_Calendar_Schedule::GOOGLE_TASK_LINK_SYMBOL_KEY_PREFIX . $this->getTaskIdLink());
        }

        return $event;
    }

    function __toString()
    {
        $toString = '';
        if (!is_null($this->scheduleId)) {
            $toString .= '[' . $this->scheduleId . '] ';
        }
        return $toString . $this->priorityName . ' @ [' . $this->getStartDateTimeInGoogleFormat() . ' - ' . $this->getEndDateTimeInGoogleFormat() . ']';
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
        return [
            'scheduleId' => $this->getScheduleId(),
            'priorityName' => $this->getPriorityName(),
            'startTime' => $this->startDateTime->format(self::JSON_DATE_FORMAT),
            'endTime' => $this->endDateTime->format(self::JSON_DATE_FORMAT),
            'taskIdLink' => $this->getTaskIdLink()
        ];
    }
}