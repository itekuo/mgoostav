<?php
/**
 * This represents a priority list containing a list of priorities
 *
 * @author Ted Kuo <itekuo@gmail.com>
 * Date: 10/20/14
 * Time: 11:14 AM
 */

class Monsieur_Task_PriorityList implements JsonSerializable {

    /**
     * Specifies the types of a priority list.
     */
    const TO_REPLAN = 'to_replan';
    const TO_PLAN = 'to_plan';
    const ONE_WEEK = '1_week';
    const ONE_MONTH = '1_month';

    /**
     * Name of this priority list
     * @var string
     */
    private $name;

    /**
     * @var string
     */
    private $id;

    /**
     * @var string
     */
    private $googleId;

    /**
     * This maps to the 4 different const to indicate type of this priroity list.
     *
     * @var string $type
     */
    private $type;

    /**
     * Collection of priorities under this list.
     *
     * @var Monsieur_Task_Priority[]
     */
    private $priorityCollection;

    /**
     * Constructor
     *
     * @param $email
     * @param $name
     * @param $id
     * @param $googleId
     * @param $type
     */
    function __construct($email, $name, $id, $googleId, $type) {
        $this->name = $name;
        $this->id = $id;
        $this->googleId = $googleId;
        $this->type = $type;
        $this->priorityCollection = array();
    }

    /**
     * @return string
     */
    public function getGoogleId()
    {
        return $this->googleId;
    }

    /**
     * @return string
     */
    public function getId()
    {
        return $this->id;
    }

    /**
     * @return string
     */
    public function getName()
    {
        return $this->name;
    }

    /**
     * @return string
     */
    public function getType()
    {
        return $this->type;
    }

    /**
     * @param \Monsieur_Task_Priority[] $priorityCollection
     */
    public function setPriorityCollection($priorityCollection)
    {
        $this->priorityCollection = $priorityCollection;
    }

    /**
     * @return \Monsieur_Task_Priority[]
     */
    public function getPriorityCollection()
    {
        return $this->priorityCollection;
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
        $prioritiesOutput = array();
        foreach ($this->priorityCollection as $priority) {
            $prioritiesOutput[] = $priority->jsonSerialize();

        }
        $objectOutput = array('id' => $this->id, 'googleId' => $this->googleId, 'name' => $this->name, 'priorities' => $prioritiesOutput);
        return $objectOutput;
    }
}