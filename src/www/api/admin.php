<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Good Day! Check Check</title>

        <!-- Bootstrap -->
        <link rel="stylesheet" href="//netdna.bootstrapcdn.com/bootstrap/3.1.1/css/bootstrap.min.css">

        <link rel="stylesheet" href="/css/base.css">

        <!-- HTML5 Shim and Respond.js IE8 support of HTML5 elements and media queries -->
        <!-- WARNING: Respond.js doesn't work if you view the page via file:// -->
        <!--[if lt IE 9]>
        <script src="https://oss.maxcdn.com/html5shiv/3.7.2/html5shiv.min.js"></script>
        <script src="https://oss.maxcdn.com/respond/1.4.2/respond.min.js"></script>
        <![endif]-->
    </head>
    <body>
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
                    <li class="" id="calendar-api"><a href="">Calendar</a></li>
                    <li class="" id="task-api"><a href="">Task</a></li>
                </ul>
                <h3 class="text-muted">Monsieur Goostav</h3>
            </div>

            <div class="row content" id="admin-body">
                <div class="col-lg-6" id="api-section">
                </div>

                <div class="col-lg-6" id="result">
                    <?php include 'result.php';?>
                </div>
            </div>

            <div class="footer">
                <p>&copy; 2014</p>
            </div>

        </div> <!-- /container -->

        <!-- jQuery (necessary for Bootstrap's JavaScript plugins) -->
        <script src="https://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js"></script>
        <script src="/js/utils.js"></script>
        <script src="/js/admin.js"></script>
        <!-- Include all compiled plugins (below), or include individual files as needed -->
    </body>
</html>