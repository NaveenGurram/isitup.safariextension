var notApplicable = "N/A";
var gifLoadingEle = "<img src='./img/ajax-loader.gif'>";
var healthResp = "Only Json is displayed";

$(document).ready(function () {
  var items = {};
  var allowIndividualRetry = localStorage.getItem("allowIndividualRetry");
  var allowAutomaticRefresh = localStorage.getItem("allowAutomaticRefresh");
  var pushNotifications = localStorage.getItem("pushNotifications");
  var pageRefreshAfter = localStorage.getItem("pageRefreshAfter");
  var cfgTxt = localStorage.getItem("cfgTxt");

  items.allowIndividualRetry = allowIndividualRetry;
  items.allowAutomaticRefresh = allowAutomaticRefresh;
  items.pushNotifications = pushNotifications;
  items.pageRefreshAfter = pageRefreshAfter;
  items.cfgTxt = cfgTxt;
  doProcess(items);

});

function doProcess(items) {
  if (!items.cfgTxt) {
    return;
  }
  var configuration = JSON.parse(items.cfgTxt);
  if (!configuration) {
    return;
  }
  var componentMap = {};
  // create a componentMap 
  var hcols = configuration.headers.cols.split(",");
  var hrows = configuration.headers.rows.split(",");
  // now validate json 
  if (configuration.rows.length != hrows.length) {
    setErrorText("Rows doesn't match list from Headers. Please check configuration");
  }
  if (hrows.length == 0) {
    setErrorText("Horizontal columns are empty. Please check configuration");
  }
  for (var i = 0; i < configuration.rows.length; i++) {
    if (configuration.rows[i].cols.length != hcols.length) {
      setErrorText("Columns doesn't match header for row: " + i);
      return;
    }
    componentMap[hrows[i]] = configuration.rows[i].cols;
  }
  // construct first row
  var isitupHtml = "<table id='envStatusTbl' class='table table-bordered table-striped table-hover table-condensed'>";
  isitupHtml += "<thead><tr class='info'><th></th>";
  for (var i = 0; i < hcols.length; i++) {
    isitupHtml += ("<th>" + hcols[i].toUpperCase() + "</th>");
  }
  isitupHtml += "</tr></thead><tbody>";

  var environments = [];

  var spanIdMap = {};

  $.each(componentMap, function (key, value) {
    isitupHtml += ("<tr><td><b>" + key + "</b></td>");
    for (var i = 0; i < value.length; i++) {
      spanId = (key + "-" + hcols[i]);
      if (value[i].healthUrl) {
        isitupHtml += ("<td><span id='" + spanId + "'>" + gifLoadingEle + "</span>");
        // if individual retry is allowed.
        if (items.allowIndividualRetry) {
          isitupHtml += (" <span id='refreshId' data='" + spanId + "' class='status-code refresh glyphicon glyphicon-refresh' title='Refresh'></span>");
        }
        // setup secondary links as hrefs
        if (value[i].other) {
          for (var j = 0; j < value[i].other.length; j++) {
            isitupHtml += " <a target='_blank' href='" + value[i].other[j].url + "'>"
            isitupHtml += "<img src='" + value[i].other[j].icon + "' title='" + value[i].other[j].url + "'/></a> ";
          }
        }
        isitupHtml += "</td>";
        spanIdMap[spanId] = value[i].healthUrl;
      } else {
        isitupHtml += ("<td><span class='status-code na'>" + notApplicable + "</span></td>");
      }

    }
    isitupHtml += "</tr>"
  });
  isitupHtml += "</tbody></table>";
  // now update table 
  $('#isitupId').html(isitupHtml);
  // now check health
  checkHealth(spanIdMap, items.pushNotifications);
  // allow automatic refresh
  if (items.allowAutomaticRefresh && items.pageRefreshAfter > 0) {
    // refresh status every x seconds
    window.setInterval(function () {
      /// call your function here
      checkHealth(spanIdMap, items.pushNotifications);
    }, parseInt(items.pageRefreshAfter * 1000));
  }

  $("span").click(function () {
    var spanData = $(this).attr("data");
    if ($(this).text() === notApplicable) {
      $('#status-detail').html("");
      $('#status-detail').hide();
      $('#health').hide();
      return;
    }
    // when refresh is clicked, just re-run the health
    if ($(this).hasClass("glyphicon-refresh")) {
      var healthMap = {};
      healthMap[spanData] = spanIdMap[spanData];
      $('#' + spanData).removeClass("status-code success");
      $('#' + spanData).html(gifLoadingEle);
      checkHealth(healthMap);
      return;
    }
    var isJson = isDataJson(spanData);
    if (!isJson) {
      spanData = "Not JSON";
    }
    $('#status-detail').html(spanData);
    $('#status-detail').show();
    $('#health').show();
  });
}

/**
 * Check health of each url.
 */
function checkHealth(spanIdMap, pushNotifications) {
  // now fire all url's and callback will update span with corresponding style and the content.
  $.each(spanIdMap, function (key, value) {
    $.ajax({
      url: value,
      type: 'GET',
      success: function (data) {
        var spanData = "";
        if (isDataJson(data)) {
          data.url = value;
          spanData = stringify(data);
        } else {
          var jsonObj = {};
          jsonObj.url = value;
          spanData = stringify(jsonObj);
        }
        $('#' + key).addClass("status-code success");
        $('#' + key).attr('data', spanData);
        $('#' + key).text("200");
      },
      error: function (jqXHR, error, errorThrown) {
        errMsg = "";
        if (jqXHR.status) {
          var statusData = {};
          statusData.error = errorThrown;
          errMsg += "with error '" + errorThrown + "' \n";
          statusData.url = value;
          $('#' + key).addClass("status-code error");
          $('#' + key).attr('data', stringify(statusData));
          $('#' + key).text(jqXHR.status);
        } else {
          var statusData = {};
          statusData.error = 'Failed to send xmlhttprequest';
          statusData.url = value;
          $('#' + key).addClass("status-code error");
          $('#' + key).attr('data', stringify(statusData));
          $('#' + key).text(jqXHR.status);
        }
        errMsg += "URL is " + value;
        if (pushNotifications) {
          sendNotification((key + " is down!!!"), errMsg);
        }
      },
      complete: function () {
        $('#' + key).removeClass("loading");
        $('#' + key).attr('title', value);
      }
    });
  });

};

/**
 * Send Notification
 */
function sendNotification(title, notificationMessage) {
  var options = {
    body: notificationMessage
  }
  //chrome.notifications.create("", options, function (cb) {});

  var n = new Notification(title, options);
  n.onclick = function () {
    this.close();
  };

}

/**
 * Checks if given data is of type JSON
 */
function isDataJson(data) {
  if (typeof data === 'object') {
    return true;
  }
  var isJson = true;
  try {
    JSON.parse(data);
  }
  catch (err) {
    isJson = false;
  }
  return isJson;
}
/**
 * Stringify data with 4 spaces.
 */
function stringify(data) {
  return JSON.stringify(data, null, 4);
}

function setErrorText(text) {
  $('#isitupId').html(text);
}