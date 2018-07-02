<?php
/**
 * Created by PhpStorm.
 * User: tkuo
 * Date: 10/4/14
 * Time: 12:43 PM
 */
class Monsieur_Factory {

    const ACCESS_TOKEN = 'service_token';

    /**
     * This creates a new Calendar with the correct setting injected.
     */
    public function createCalendarService() {
        $googleClient = new Google_Client();
        $clientId = "101304200027-p6ho99r5sfbra6erlmdicjg24cj2dkh6.apps.googleusercontent.com";
        $clientSecret = "6bHrJuJzDXCTdeubHR6_pN9-";
        $googleClient->setClientId($clientId);
        $googleClient->setClientSecret($clientSecret);
        $googleClient->setRedirectUri("http://localhost:8080/auth/");

        // If user is already authenticated
        if (!empty($_SESSION[self::ACCESS_TOKEN])) {
            $currentAccessToken = $_SESSION[self::ACCESS_TOKEN];
            $googleClient->setAccessToken($currentAccessToken);
        }

        // Fixing scope to always request for both, to avoid the complication in incremental scopes.
        $googleClient->addScope(array(Google_Service_Tasks::TASKS, Google_Service_Calendar::CALENDAR, 'scope'));
        $calendarService = new Monsieur_Calendar_Service($googleClient);
        return $calendarService;
    }

    /**
     * Creates a new task service with correct settings injected.
     * s
     * @return Monsieur_Task_Service
     */
    public function createTaskService() {
        $googleClient = new Google_Client();
        $clientId = "101304200027-p6ho99r5sfbra6erlmdicjg24cj2dkh6.apps.googleusercontent.com";
        $clientSecret = "6bHrJuJzDXCTdeubHR6_pN9-";
        $googleClient->setClientId($clientId);
        $googleClient->setClientSecret($clientSecret);
        $googleClient->setRedirectUri("http://localhost:8080/auth/");

        // If user is already authenticated
        if (!empty($_SESSION[self::ACCESS_TOKEN])) {
            $currentAccessToken = $_SESSION[self::ACCESS_TOKEN];
            $googleClient->setAccessToken($currentAccessToken);
        }

        // Fixing scope to always request for both, to avoid the complication in incremental scopes.
        $googleClient->addScope(array(Google_Service_Tasks::TASKS, Google_Service_Calendar::CALENDAR, 'email'));
        $taskService = new Monsieur_Task_Service($googleClient);
        return $taskService;
    }

    /**
     * Creates anew Auth service for serving all request related to authentication & authorization.
     *
     * @return Auth_Service
     */
    public function createAuthService() {
        $googleClient = new Google_Client();
        $clientId = "101304200027-p6ho99r5sfbra6erlmdicjg24cj2dkh6.apps.googleusercontent.com";
        $clientSecret = "6bHrJuJzDXCTdeubHR6_pN9-";
        $googleClient->setClientId($clientId);
        $googleClient->setClientSecret($clientSecret);
        $googleClient->setRedirectUri("http://localhost:8080/auth/");
        // Fixing scope to always request for both, to avoid the complication in incremental scopes.
        $googleClient->addScope(array(Google_Service_Tasks::TASKS, Google_Service_Calendar::CALENDAR, 'email'));

        // If user is already authenticated
        if (!empty($_SESSION[self::ACCESS_TOKEN])) {
            $currentAccessToken = $_SESSION[self::ACCESS_TOKEN];
            $googleClient->setAccessToken($currentAccessToken);
        }

        $middleWareService = new Monsieur_Auth_Service($googleClient);
        return $middleWareService;
    }

    /**
     * This returns a task service which services in a 'serviced account' mode when communicating with Google. It uses
     * a p12 key for authentication.
     *
     * @return Monsieur_Task_Service
     */
    private function createServicedAccountTaskService() {
        // Initialise the task service
        $developerKey = "AIzaSyB6f3ej4IFYRYIf34ls3ZEhYW6YFK89jD8";
        $serviceAccountName = '101304200027-7b3th2m3bsi1tb1r9vop4gtq1il7537u@developer.gserviceaccount.com';
        $privateKey = file_get_contents('../../config/API Project-0fab12e76df8.p12');
        $taskService = new Monsieur_Task_Service($developerKey, $serviceAccountName, $privateKey);
        return $taskService;
    }

}