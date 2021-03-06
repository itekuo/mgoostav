<?php
/**
 * Controller for Calendar
 * User: tkuo
 * Date: 9/6/14
 * Time: 11:58 AM
 */
require_once 'Google/Client.php';
require_once 'Google/Service/Calendar.php';
require_once 'Google/Auth/AssertionCredentials.php';
require_once 'Google/Auth/OAuth2.php';

class Monsieur_Calendar_Service {
    /**
     * @var string ClientID passed to Google that is used for usage tracking purpose
     */
    private $serviceAccountName;

    /**
     * @var string specifies the file path which contains the
     */
    private $privateKey;

    /**
     * @var string Specifies the scope of authorization required.
     */
    private $scopes = 'https://www.googleapis.com/auth/calendar';

    /**
     * @var Google_Auth_AssertionCredentials generated by passing Google based on $privateKey
     */
    private $googleAssertionCredentials;

    /**
     * @var Google_Client
     */
    private $client;

    /**
     * @var Google_Service_Calendar for accessing calendar for specified $calendarId
     */
    private $calendarService;

    /** Application name */
    const APPLICATION_NAME = 'M. Goostav';

    /**
     * Constructor
     *
     * @param Google_Client $client
     */
    function __construct(Google_Client $client) {
        $this->client = $client;
        // Initialise calendar service
        $this->calendarService = new Google_Service_Calendar($this->client);
    }

    /**
     * In order to get access the "booking" calendar, this performs the required authentication to gain access. It stores the access token in session, thus assuming
     */
    public function authenticate() {
        if ($this->client->isAccessTokenExpired()) {
            $this->client->getAuth()->refreshTokenWithAssertion($this->googleAssertionCredentials);
        }

        $_SESSION['service_token'] = $this->client->getAccessToken();
    }

    /**
     * This adds the given schedule event into the pre-configured calendar.
     * At present, disregards all the existing schedule, and book a schedule anyway.
     *
     * @param string $calendarId
     * @param Monsieur_Calendar_Schedule $newSchedule to be added
     * @return Google_Service_Calendar_Event that is added to the calendar
     */
    public function add($calendarId, Monsieur_Calendar_Schedule $newSchedule) {
        try {
            $event = $newSchedule->toGoogleEvent();
            $createdEvent = $this->calendarService->events->insert($calendarId, $event);
            $newScheduleAdded = $this->convertGoogleEventToSchedule($createdEvent);
            return $newScheduleAdded;
        } catch (Exception $e) {
            return '-1';// This is bad.
        }

    }

    /**
     * Returns a list of Calendar ID for the current user.
     *
     * @return array list of calendar Ids
     */
    public function getCalendarIds() {
        /** @var Google_Service_Calendar_CalendarList $calendarList */
        $calendarList = $this->calendarService->calendarList->listCalendarList();

        /** @var $calendarIds array */
        $calendarIds = array();
        /** @var google_service_calendar_calendarlistentry[] $calendarEntries */
        $calendarEntries = $calendarList->getItems();
        foreach ($calendarEntries as $calendar) {
            $calendarIds[] = $calendar->getId();
        }
        return $calendarIds;
    }


    /**
     * Given a date in the format of "yyyy-mm-dd", it fetches all the schedules that have scheduled on the given day.
     *
     * @param string $calendarId
     * @param DateTime $date which schedule is to be fetched. If none is specified, today is assumed.
     * @return Monsieur_Calendar_Schedule[]
     * @throws InvalidArgumentException
     */
    public function get($calendarId, $date) {
        if (empty($date)) {
            throw new InvalidArgumentException('Given date is in the wrong format: ');
        }

        $timeMin = $date->format('Y-m-d\T00:00:00\Z');
        $oneDay = new DateInterval('P1D');
        $dateMax = $date->add($oneDay);
        $timeMax = $dateMax->format('Y-m-d\T00:00:00\Z');
        $optParams = array('timeMin' => $timeMin, 'timeMax' => $timeMax);
        $eventListResult = $this->calendarService->events->listEvents($calendarId, $optParams);

        /** @var $eventsArray Google_Service_Calendar_Event[] */
        $eventsArray = $eventListResult->getItems();

        /** @var $scheduleList Monsieur_Calendar_Schedule[] */
        $scheduleList = array();
        foreach ($eventsArray as $event) {
            $newSchedule = $this->convertGoogleEventToSchedule($event);

            $scheduleList[] = $newSchedule;
        }

        return $scheduleList;
    }

    /**
     * Deletes the given $schedule on Google Calendar.
     *
     * @param string $calendarId
     * @param int $scheduleId
     * @return true if event has been successfully deleted
     */
    public function delete($calendarId, $scheduleId) {
        // If it's not even stored in Google, return true.
        if (is_null($scheduleId)) {
            return true;
        }
        $optParams = array('sendNotifications' => 'true');

        try {
            /** @var $deleteResponse Google_Http_Request */
            $deleteResponse = $this->calendarService->events->delete($calendarId, $scheduleId, $optParams);
        } catch (Google_Service_Exception $e) {
            if ($e->getCode() == 410) {
                // Schedule already deleted
                return true;
            }
            return print_r($e, true);
        }

        if (is_null($deleteResponse)) {
            return true;
        } else {
            return print_r($deleteResponse, true);
        }
    }

    /**
     * Updates the given schedule with all it's latest information stored in it.
     *
     * @param $calendarId
     * @param Monsieur_Calendar_Schedule $schedule
     * @return Google_Service_Calendar_Event
     * @throws InvalidArgumentException
     */
    public function update($calendarId, Monsieur_Calendar_Schedule $schedule) {
        if (is_null($schedule->getScheduleId())) {
            throw new InvalidArgumentException('This is not an existing schedule.');
        }

        try {
            $event = $schedule->toGoogleEvent();
            /** @var Google_Service_Calendar_Event $updatedEvent */
            $updatedEvent = $this->calendarService->events->update($calendarId, $event->getId(), $event);

            $updatedSchedule = $this->convertGoogleEventToSchedule($updatedEvent);
            return $updatedSchedule;
        } catch (Exception $e) {
            return "-1";
        }
    }

    public function getCalendarIdFromDB() {
        return 'm.goostav@gmail.com';
    }

    /**
     * @param $event
     * @return Monsieur_Calendar_Schedule
     */
    private function convertGoogleEventToSchedule($event)
    {
        /** @var $start Google_Service_Calendar_EventDateTime */
        $start = $event->getStart();
        $end = $event->getEnd();

        // Event with both date and time
        $startDateTime = $start->getDateTime();
        $endDateTime = $end->getDateTime();

        // If it's a whole day event
        $startDate = $start->getDate();
        if (empty($startDateTime) && !empty($startDate)) {
            $startDateTime = $startDate . 'T00:00:00+08:00'; // Assume Singapore timezone
        }

        $endDate = $end->getDate();
        if (empty($endDateTime) && !empty($endDate)) {
            $endDateTime = $endDate . 'T00:00:00+08:00'; // Assume Singapore timezone
        }

        $taskIdLink = null;
        if (!is_null($event->getDescription())) {
            $strPositionOfKey = strpos($event->getDescription(), Monsieur_Calendar_Schedule::GOOGLE_TASK_LINK_SYMBOL_KEY_PREFIX);
            if ($strPositionOfKey !== false) {
                $taskIdLink = substr($event->getDescription(),
                    $strPositionOfKey + strlen(Monsieur_Calendar_Schedule::GOOGLE_TASK_LINK_SYMBOL_KEY_PREFIX));
            }

        }
        $newSchedule = new Monsieur_Calendar_Schedule($event->getId(), $event->getSummary(), $startDateTime, $endDateTime, $taskIdLink);
        return $newSchedule;
    }
}
