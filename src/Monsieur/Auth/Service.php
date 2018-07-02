<?php


class Monsieur_Auth_Service {

    /**
     * @var Google_Client $googleClient
     */
    private $googleClient;

    /**
     * @param $googleClient
     */
    function __construct($googleClient) {
        $this->googleClient = $googleClient;
    }

    /**
     * Creates a authentication URL for user to login
     *
     * @return string the auth url
     */
    public function createAuthURL() {
        return $this->googleClient->createAuthUrl();
    }

    /**
     * Returns true if user is currently logged in to Google.
     *
     * @return true if user is logged in to Google
     */
    public function isLoggedIn() {
        if (!isset($_SESSION['service_token']) || !$_SESSION['service_token']) {
            return false;
        }

        if ($this->googleClient->isAccessTokenExpired()) {
            return false;
        }

        return true;
    }

    /**
     * Returns user email;
     *
     * @return empty if not logged in, otherwise user email
     */
    public function getUserEmail() {
        if (!$this->isLoggedIn()) {
            return '';
        }
        else {
            // Get the token from the current user
            $this->googleClient->setAccessToken($_SESSION['service_token']);
            $attributes = $this->googleClient->verifyIdToken()->getAttributes();
            $payload = $attributes['payload'];
            $userEmail = $payload['email'];
            return $userEmail;
        }
    }

    /**
     * @param string $code from Google as a result of a authorization
     * @throws InvalidArgumentException
     * @throws Google_Service_Exception if authentication failed
     */
    public function authenticate($code) {
        if (!isset($code)) {
            throw new InvalidArgumentException('code is not set');
        }
        $this->googleClient->authenticate($code);
        $_SESSION['service_token'] = $this->googleClient->getAccessToken();
        return;
    }
}