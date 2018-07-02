<h4>API</h4>
<div class="api-action">
    <p>Calendar ID</p>
    <div class="col-lg-9">
        <select id="calendar-id" class="form-control" placeholder="Login to get calendar ID">
            <?php if (empty($calendarIds)): ?>
                <option value>Login to get calendar ID</option>
            <?php else:
                foreach ($calendarIds as $calendarId) {
                    echo "<option value='" . $calendarId . "'>" . $calendarId . "</option>";
                }
            endif;
            ?>
        </select>
    </div>
</div>
<div class="api-action">
    <p>View Events</p>
    <form action="/api/calendar/" id="calendarGetForm" method="GET">
        <div class="col-lg-9">
            <input type="date" class="form-control" id="getFormDate" name="date" placeholder="Default - today" required>
        </div>
        <div class="col-lg-3">
            <input type="submit" class="btn btn-default btn-primary" value="Check"/>
        </div>
    </form>
</div>

<div class="api-action">
    <p>Add Event</p>
    <form action="/api/calendar/" id="calendarAddForm" method="POST">
        <div class="col-lg-9">
            <input type="text" class="form-control" id="addFormSummary" name="summary" placeholder="New schedule..." required>
        </div>
        <div class="col-lg-5">
            <input type="date" class="form-control" id="addFormDate" name="date" placeholder="Default - today" required>
        </div>
        <div class="col-lg-4">
            <input type="time" class="form-control" id="addFormTime" name="time" placeholder="Default - current time" required>
        </div>
        <div class="col-lg-3">
            <input type="submit" class="btn btn-default btn-primary" value="Add"/>
        </div>
    </form>
</div>

<div class="api-action">
    <p>Update Event</p>
    <form action="/api/calendar/" id="calendarChangeForm" method="post">
        <div class="col-lg-9">
            <input type="text" class="form-control" id="changeFormId" name="id" placeholder="ID to update..." required>
        </div>
        <div class="col-lg-9">
            <input type="text" class="form-control" id="changeFormSummary" name="summary" placeholder="New task description..." required>
        </div>
        <div class="col-lg-5">
            <input type="date" class="form-control" id="changeFormDate" name="date" placeholder="Default - today" required>
        </div>
        <div class="col-lg-4">
            <input type="time" class="form-control" id="changeFormTime" name="time" placeholder="Default - current time" required>
        </div>
        <div class="col-lg-3">
            <input type="submit" class="btn btn-default btn-primary" value="Update"/>
        </div>
    </form>
</div>

<div class="api-action">
    <p>Delete Event</p>
    <form action="/api/calendar/" id="calendarDeleteForm" method="POST">
        <div class="col-lg-9">
            <input type="hidden" name="_METHOD" value="DELETE"/>
            <input type="text" class="form-control" id="deleteFormId" name="id" placeholder="ID to delete..." required>
        </div>
        <div class="col-lg-3">
            <input type="submit" class="btn btn-default btn-primary" value="Delete"/>
        </div>
    </form>
</div>
