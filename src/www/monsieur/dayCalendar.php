<?php
/**
 * Daily calendar view
 *
 * @author Ted Kuo <itekuo@gmail.com>
 * @package Partial
 * Date: 10/21/14
 * Time: 1:13 PM
 */
?>
<div>
    <div id="'date-section">
        <h4><?php echo $todayLine1;  ?></h4>
        <h6><?php echo $todayLine2; ?></h6>
    </div>
    <span id="calendar-id"><?php echo $calendarId;?></span>
    <div id='calendar-section' class='calendar-card'>
        <img id="drag-image" src="http://www.garyhyman.com/wp-content/uploads/2013/05/schedule_icon.png" style="display:none"></img>
        <table class="table" id="schedule-table">
            <tr id="marker-row">
                <td class="col-lg-12" colspan="2">
                    <div id="marker-wrapper">
                        <div id="marker-root">
                            <div id="first-row">
                                <div class="col-md-2 col-lg-2 hour-mark">
                                </div>
                                <div class="schedule-grid col-md-10 col-lg-10">
                                </div>
                            </div>
                        </div>
                    </div>
                </td>
            </tr>
            <tr id="schedule-row">
                <td class="col-md-2 col-lg-2"></td>
                <td class="col-md-10 col-lg-10">
                    <div id="schedule-chip-wrapper">
                    </div>
                </td>
            </tr>
        </table>
    </div>
</div>