<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Good Day! I'm Goostav</title>

    <!-- Bootstrap -->
    <link rel="stylesheet" href="//netdna.bootstrapcdn.com/bootstrap/3.1.1/css/bootstrap.min.css">

    <link rel="stylesheet" href="/css/base.css">
    <link rel="stylesheet" href="/css/day.css">

    <!-- HTML5 Shim and Respond.js IE8 support of HTML5 elements and media queries -->
    <!-- WARNING: Respond.js doesn't work if you view the page via file:// -->
    <!--[if lt IE 9]>
    <script src="https://oss.maxcdn.com/html5shiv/3.7.2/html5shiv.min.js"></script>
    <script src="https://oss.maxcdn.com/respond/1.4.2/respond.min.js"></script>
    <![endif]-->
</head>
<body class="page-body">
<div class="container">
    <div class="header">
        <ul class="nav nav-pills pull-right">
            <?php
            if ($loginRequired) {
                echo "<li class='' id='login-api'><a href='" . $authURL . "'>Login</a></li>";
            } else {
                echo "<li class='' id='login-user-email'><a>" . $userEmail . "</a></li>";
            }
            ?>
        </ul>
        <h3 class="text-muted">Monsieur Goostav</h3>
    </div>

    <div class="row content" id="body-content">
        <div class="col-md-5 col-lg-5" id="task-list-section"></div>

        <span id="task-store"></span>

        <div class="col-md-7 col-lg-7" id="day-calendar-section">
            <?php include 'dayCalendar.php';?>
        </div>
    </div>

    <div class="footer">
        <p>&copy; 2014</p>
    </div>

</div> <!-- /container -->

<!-- jQuery (necessary for Bootstrap's JavaScript plugins) -->
<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js"></script>
<!-- Setup all javascript module/class -->
<script src="/js/utils.js"></script>
<script src="/js/view/view-utilities.js"></script>
<script src="/js/view/task-view.js"></script>
<script src="/js/view/schedule-view.js"></script>
<script src="/js/controller/planner-controller.js"></script>
<script src="/js/controller/task-controller.js"></script>
<script src="/js/controller/schedule-controller.js"></script>
<script src="/js/schedule-model.js"></script>
<script src="/js/task-model.js"></script>


<!-- Initialise on dom ready -->
<script src="/js/dependency-injector.js"></script>

<!-- Include all compiled plugins (below), or include individual files as needed -->
</body>
</html>