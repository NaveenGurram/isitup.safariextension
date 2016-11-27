$(document).ready(function () {

    document.getElementById('confFileUpld').addEventListener('change', readSingleFile, false);

    alert('there are ' + localStorage.length + ' items in the storage array.');

    var allowIndividualRetry = localStorage.getItem("allowIndividualRetry");
    var allowAutomaticRefresh = localStorage.getItem("allowAutomaticRefresh");
    var pushNotifications = localStorage.getItem("pushNotifications");
    var pageRefreshAfter = localStorage.getItem("pageRefreshAfter");
    var cfgTxt = localStorage.getItem("cfgTxt");

    if (cfgTxt) {
        $("textarea[name='cfgTxt']").val(cfgTxt);
    }
    else {
        jQuery.get("conf/defaultConf.json", function (data) {
            $("textarea[name='cfgTxt']").val(data);
        });
    }


    if (allowIndividualRetry) {
        $('#pageRefreshAfterId').show();
    }
    $('#pageRefreshAfter').val(pageRefreshAfter);

    if (allowIndividualRetry) {
        $('#allowIndividualRetry-0').prop('checked', true);
    } else {
        $('#allowIndividualRetry-1').prop('checked', true);
    }

    if (allowAutomaticRefresh) {
        $('#allowAutomaticRefresh-0').prop('checked', true);
    } else {
        $('#allowAutomaticRefresh-1').prop('checked', true);
    }

    if (pushNotifications) {
        $('#pushNotifications-0').prop('checked', true);
    } else {
        $('#pushNotifications-1').prop('checked', true);
    }


    // when allow automatic refresh is enabled
    $('input:radio[name="allowAutomaticRefresh"]').change(function () {
        if ($(this).val() == 'Yes') {
            $('#pageRefreshAfterId').show();
        } else {
            $('#pageRefreshAfterId').hide();
        }
    });
    // when saved
    $('#saveBtn').click(function () {
        var allowIndividualRetry = ($("input[name=allowIndividualRetry]:checked").val() === 'Yes');
        var allowAutomaticRefresh = ($("input[name=allowAutomaticRefresh]:checked").val() === 'Yes');
        var pushNotifications = ($("input[name=pushNotifications]:checked").val() === 'Yes');
        var pageRefreshAfter = $("input[name=pageRefreshAfter]").val();
        var cfgTxt = $("textarea[name=cfgTxt]").val();

        localStorage.setItem("allowIndividualRetry", allowIndividualRetry);
        localStorage.setItem("allowAutomaticRefresh", allowAutomaticRefresh);
        localStorage.setItem("pushNotifications", pushNotifications);
        if(allowAutomaticRefresh){
            localStorage.setItem("pageRefreshAfter", pageRefreshAfter);
        }else{
            localStorage.setItem("pageRefreshAfter", 0);
        }

        localStorage.setItem("cfgTxt", cfgTxt);

        setTimeout(function () {
            status.textContent = '';
        }, 5000);
        setTimeout(function () {
            window.close();
        }, 1000)
    });

});


function readSingleFile(evt) {
    //Retrieve the first (and only!) File from the FileList object
    var f = evt.target.files[0];
    if (f) {
        var r = new FileReader();
        r.onload = function (e) {
            var contents = e.target.result;
            var isJson = true;
            try {
                var json = $.parseJSON(contents);
            }
            catch (err) {
                isJson = false;
            }
            if (isJson) {
                $("textarea[name='cfgTxt']").val(contents);
            } else {
                alert("Invalid configuration Json file!!");
            }
        }
        r.readAsText(f);
    } else {
        alert("Failed to load file");
    }
}

