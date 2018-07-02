<h4>Task API</h4>
<div class="api-action">
    <p>Task List ID</p>
    <div class="col-lg-9">
        <select id="task-list-id" class="form-control" placeholder="Login to get task list ID">
            <?php if (empty($taskListIds)): ?>
                <option value>Login to get task list ID</option>
            <?php else:
                foreach ($taskListIds as $taskListId => $taskListTitle) {
                    echo "<option value='" . $taskListId . "'>" . $taskListTitle . "</option>";
                }
            endif;
            ?>
        </select>
    </div>
</div>
<div class="api-action">
    <p>View Tasks</p>
    <form action="/api/task/" id="taskGetForm" method="GET">
        <div class="col-lg-9">
<!--            <input type="text" class="form-control" id="taskGetFormId" name="taskListId" placeholder="Enter your task list ID..." required>-->
        </div>
        <div class="col-lg-3">
            <input type="submit" class="btn btn-default btn-primary" value="Get"/>
        </div>
    </form>
</div>
