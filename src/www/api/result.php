<h4 id="api-result">API Result</h4>
<table class="table table-bordered">
    <?php
        if (isset($result)) {
            if (empty($result)) {
                echo "<tr><td>Empty Result</td></tr>";
            }
            else {
                foreach($result as $key => $eachResult) {
                    echo "<tr>";
                    echo "<td class='key'>" . $key . "</td>";
                    echo "<td class='value'>" . $eachResult . "</td>";
                    echo "</tr>";
                }
            }

        }
    ?>
</table>
