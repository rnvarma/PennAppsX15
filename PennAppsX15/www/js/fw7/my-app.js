// Initialize your app
var myApp = new Framework7({
    template7Pages: true
});

// Export selectors engine
var $$ = Dom7;

// Add view
var mainView = myApp.addView('.view-main', {
    // Because we use fixed-through navbar we can enable dynamic navbar
    dynamicNavbar: true
});

function addRefreshListener() {
    // Pull to refresh content
    var ptrContent = $$('.pull-to-refresh-content');
     
    // Add 'refresh' listener on it
    ptrContent.on('refresh', function (e) {
        setTimeout(function() {
            myApp.pullToRefreshDone();
        }, 1000)
    });
}

// Returns Google static map centered on given coords
function staticMap(lat, lon) {
    var coords = lat + "," + lon;
    return "https://maps.googleapis.com/maps/api/staticmap?center="+
        coords + "&markers=" + coords +
        "&zoom=14&size=400x400&key=AIzaSyAH-KSfz-462dVd84424pUVWa7vO2RgfAs";
}

//e.g. path=color:0x0000ff|weight:5|40.737102,-73.990318|40.749825,-73.987963|40.752946,-73.987384|40.755823,-73.986397
// Takes list of coord tuples [lat, long] in route 
// Returns Google static map
function routeMap(routePath) {
    return "https://maps.googleapis.com/maps/api/staticmap?path=color:0x0000ff|weight:5"+
        routePath + "&size=400x400&key=AIzaSyAH-KSfz-462dVd84424pUVWa7vO2RgfAs";
}

function updateUserLocation(callback, activity_id) {
    navigator.geolocation.getCurrentPosition(
            function(position) {
                var data;
                if (activity_id !== undefined) {
                    // Update activity location
                    data = {
                        activity_id: activity_id,
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                } else {
                    if (!USER_DATA) return
                    data = {
                        id: USER_DATA.fb_toke,
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                }
                if (callback){
                    callback(data);
                }
            },
            function(error) {
                console.log('code: '    + error.code    + '\n' +
                            'message: ' + error.message + '\n');

                callback(error);
            }
    );
}


// Callbacks to run specific code for specific pages, for example for About page:
myApp.onPageInit('create', function (page) {
    addRefreshListener();
    // run createContentPage func after link was clicked
    $$('.create-page').on('click', function () {
        createContentPage();
    });

    // Allow input of starting point
    navigator.geolocation.getCurrentPosition(
            function(position) {
                var latlong = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                var mapOptions = {
                  center: latlong,
                  zoom: 12,
                  scrollwheel:false,
                  disableDoubleClickZoom: true,
                  disableDefaultUI: true
                };
                var map = new google.maps.Map(document.getElementById('map-div'), mapOptions);
                var marker = new google.maps.Marker({
                    position: latlong,
                    title:"Starting Point",
                    draggable:true
                });
                marker.setMap(map);
                $("#map-div").css("width", "100%");
                $$('#submit').on("click", function () {
                    console.log("Longitude: " + marker.getPosition().D + " Latitude: " + marker.getPosition().k);
                        // Send create request to server
                        var data = {
                                name: $$('#activity-name').val(),
                                start_date_time: $$('#activity-start-time').val(),
                                type: $$('#activity-type').val(),
                                meet_location_lat: position.coords.latitude,
                                meet_location_long: position.coords.longitude,
                                id: USER_DATA.fb_toke
                            };
                        $$.post("http://pennappsx15.herokuapp.com/1/activity", data, function(d) {
                            console.log("reply: "+d);
                            alert("Your activity was successfully created!");
                        });
                });
            },
            function(error) {
                console.log('code: '    + error.code    + '\n' +
                            'message: ' + error.message + '\n');
            }
        );
});

function getAddresses(activity) {
// get the address from the long/lat coordinates
    var addressURL = "https://maps.googleapis.com/maps/api/geocode/json?latlng="+activity["meet_location_lat"]+","+activity["meet_location_long"]+"&key=AIzaSyAH-KSfz-462dVd84424pUVWa7vO2RgfAs";
    var address = addressURL;

    $.ajax({
        url: addressURL,
        crossDomain: true,
        success: function(input) {
            address = input.results[0].formatted_address;
            // the date is formatted differently in the database
            var splitEventDate = activity["start_date_time"].split("T");
            var splitDate = splitEventDate[0].split("-");
            var splitTime = splitEventDate[1].split(":");
            var getCurrDate = new Date();

            // calculate minute, hour, and day difference
            var minuteDiff = parseInt(splitTime[1]) - getCurrDate.getMinutes();
            var hourDiff = parseInt(splitTime[0]) - getCurrDate.getHours();
            var dayDiff = parseInt(splitDate[2]) - getCurrDate.getDate();

            // by default, the time is in minutes

            var displayDate = minuteDiff.toString() + " mins";

            if (dayDiff > 0) {
                displayDate = dayDiff.toString() + " days";
            }
            else if (hourDiff > 0) {
                displayDate = hourDiff.toString() + " hrs";
            }

            var user_img = "http://graph.facebook.com/" + activity["creator"]["fb_toke"] + "/picture";

            activity['timeuntil'] = displayDate;
            activity['address'] = address

            var static_img_url = "https://maps.googleapis.com/maps/api/streetview?size=200x200&location=" + activity.meet_location_lat + "," + activity.meet_location_long
            if (dayDiff > 0 || (dayDiff == 0 && hourDiff > 0)) {
                $("#activities-list").append(
                '<li id="activities" class="swipeout">' +
                "<a href='sampleevent.html' class='item-link item-content' data-context='" + JSON.stringify(activity) + "'>" +
                '<div class="swipeout-content">' +
                '<!-- List element goes here -->' +
                '<div class="item-content">' +
                '   <div class="item-media" id="user-post" style="background-image: url('+ user_img + ');"></div>' +
                '       <div class="item-inner">' +
                '           <div class="item-title-row">' +
                '               <div class="item-title">'+ activity.name + '</div>' +
                '               <div class="item-after"><b>' + displayDate + '</b></div>' +
                '           </div>' +
                '<div class="item-subtitle"><i class="fa fa-map-marker"></i> '+ address + '</div>' +
                '    <div class="item-text">' +
                '      +3 are going!' +
                '    </div>' +
                '  </div>' +
                '</div>' + 
                '</div>' +
                ' <!-- Swipeout actions left -->' +
                '   <div class="swipeout-actions-right">' +
                '        <a href="#" class="join">Join</a>' +
                '   </div>' +
                '   </a>' +
                '</li>')
            }
        },
        dataType:"json"
    });
}

myApp.onPageInit('home', function (page) {

    addRefreshListener();
    // run createContentPage func after link was clicked
    $$('.create-page').on('click', function () {
        createContentPage();
    });

    activitiesURL = "http://pennappsx15.herokuapp.com/1/getactivities/" + USER_DATA.fb_toke;

    $.ajax({
       url: activitiesURL,
       crossDomain: true,
       success: function(data) {
        for (var i = 0; i < data.length; i++) {
            var activity = data[i];
            getAddresses(activity);
        }
       },
       dataType: "json"
     });
});

function getNewsfeed(activity) {
// get the address from the long/lat coordinates
    var addressURL = "https://maps.googleapis.com/maps/api/geocode/json?latlng="+activity["meet_location_lat"]+","+activity["meet_location_long"]+"&key=AIzaSyAH-KSfz-462dVd84424pUVWa7vO2RgfAs";
    var address = addressURL;

    $.ajax({
        url: addressURL,
        crossDomain: true,
        success: function(input) {
            address = input.results[0].formatted_address;
            // the date is formatted differently in the database
            var splitEventDate = activity["start_date_time"].split("T");
            var splitDate = splitEventDate[0].split("-");
            var splitTime = splitEventDate[1].split(":");
            var getCurrDate = new Date();

            // calculate minute, hour, and day difference
            var minuteDiff = parseInt(splitTime[1]) - getCurrDate.getMinutes();
            var hourDiff = parseInt(splitTime[0]) - getCurrDate.getHours();
            var dayDiff = parseInt(splitDate[2]) - getCurrDate.getDate();

            var displayDate = splitEventDate[0];

            var user_img = "http://graph.facebook.com/" + activity["creator"]["fb_toke"] + "/picture";

            activity['timeuntil'] = displayDate;
            activity['address'] = address;

            if (dayDiff < 0 || (dayDiff == 0 && hourDiff <= 0 && minuteDiff <= 0)) {
                $("#newsfeed-list").append(
                '<li id="activities" class="swipeout">' +
                "<a href='sampleevent.html' class='item-link item-content' data-context='" + JSON.stringify(activity) + "'>" +
                '<div class="swipeout-content">' +
                '<!-- List element goes here -->' +
                '<div class="item-content">' +
                '   <div class="item-media" id="user-post" style="background-image: url('+ user_img + ');"></div>' +
                '       <div class="item-inner">' +
                '           <div class="item-title-row">' +
                '               <div class="item-title">'+ activity.name + '</div>' +
                '               <div class="item-after"><b>' + displayDate + '</b></div>' +
                '           </div>' +
                '<div class="item-subtitle"><i class="fa fa-map-marker"></i> '+ address + '</div>' +
                '    <div class="item-text">' +
                '      +3 attended!' +
                '    </div>' +
                '  </div>' +
                '</div>' + 
                '</div>' +
                ' <!-- Swipeout actions left -->' +
                '   <div class="swipeout-actions-right">' +
                '        <a href="#" class="join">Join</a>' +
                '   </div>' +
                '   </a>' +
                '</li>')
            }
        },
        dataType:"json"
    });
}

myApp.onPageInit('newsfeed', function (page) {
    addRefreshListener();
    // run createContentPage func after link was clicked
    $$('.create-page').on('click', function () {
        createContentPage();
    });

    activitiesURL = "http://pennappsx15.herokuapp.com/1/getactivities/" + USER_DATA.fb_toke;

    $.ajax({
       url: activitiesURL,
       crossDomain: true,
       success: function(data) {
        for (var i = 0; i < data.length; i++) {
            var activity = data[i];
            getNewsfeed(activity);
        }
       },
       dataType: "json"
     });
});

function getCompetitors(activity,number) {
    var user_img = "http://graph.facebook.com/" + activity["fb_toke"] + "/picture";
    var name = activity['name'];
    var totalDistance = activity['distance_traveled'];
    $("#leaderList").append(
    '<li class="item-content" style="height: 70px;">' + number +
    '. <div class="item-media" id="user-post" style="background-image: url('+ user_img + '); margin-left: 15px;"></div>' +
    '<div class="item-inner"> ' +
    '<div class="item-title">' + name + '</div>' +
    '<div class="item-after">' + totalDistance + ' mi</div>' +
    '</div></li>');
}

myApp.onPageInit('leaderboard', function (page) {
    addRefreshListener();
    // run createContentPage func after link was clicked
    $$('.create-page').on('click', function () {
        createContentPage();
    });

    var localURL = "http://pennappsx15.herokuapp.com/1/getleaderboard/" + USER_DATA.fb_toke;

    $.ajax({
        url: localURL,
        crossDomain: true,
        success: function(data) {
            neighbors = data.sort(function(a,b) { return a["distance_traveled"] - b["distance_traveled"] } );
            for (var i = 0; i < neighbors.length; i++) {
                var neighbor = neighbors[i];
                getCompetitors(neighbor,i+1);
            }
        },
        dataType: "json"
    });

});

function load_profile_tabs(tabClass, posts) {
    
}

myApp.onPageInit('profile', function (page) {
    addRefreshListener();
    // run createContentPage func after link was clicked
    $$('.create-page').on('click', function () {
        createContentPage();
    });
    var name = USER_DATA.name;
    var id = USER_DATA.fb_toke;
    var img_url = "http://graph.facebook.com/" + id + "/picture?width=200&height=200";
    $(".fb-img").attr("src", img_url);

    var profile_url = "http://pennappsx15.herokuapp.com/1/user/" + USER_DATA.fb_toke;

    $.ajax({
        url: profile_url,
        crossDomain: true,
        success: function(data) {

        },
        dataType: "json"
     });

    $(".profile-tab").click(function() {
        $(".profile-tab.active").removeClass("active");
        $(this).addClass("active");
    });
});

function getStartTimeFromFormattedThing(thing) {
    var time, hours, minutes, after;
    time = thing.split("T")[1];
    time = time.split(":");
    hours = time[0];
    minutes = time[1];
    after = "AM";
    if (hours >= 12) {
        after = "PM";
        hours = (hours == 12) ? hours : hours % 12;
    }
    time = hours + ":" + minutes + " " + after
    return time;
}

myApp.onPageInit('sampleevent', function (page) {
    addRefreshListener();
    // run createContentPage func after link was clicked
    $$('.create-page').on('click', function () {
        createContentPage();
    });

    // Initialize map
    var lat = parseFloat($(".lattitude").attr("data-lat"));
    var lng = parseFloat($(".longitude").attr("data-long"));

    var latlong = new google.maps.LatLng(lat, lng);
    var mapOptions = {
      center: latlong,
      zoom: 18,
      draggable:false,
      scrollwheel:false,
      disableDoubleClickZoom: true,
      disableDefaultUI: true
    };
    var map = new google.maps.Map(document.getElementById('event-map-div'), mapOptions);
    var marker = new google.maps.Marker({
        position: latlong,
        title:"Starting Point",
    });
    marker.setMap(map);

    var coords = [new google.maps.LatLng(lat, lng)];

    var time = getStartTimeFromFormattedThing($(".data-activity-time").attr("data-time"));
    $(".activity-start-time").text("Start time: " + time);

    // Helper functions to turn timer on/off
    var routeString = "";
    var refreshIntervalId; // id for time interval
    function startTimer() {
        // make request to indicate that the activity is started
        $$.post("http://pennappsx15.herokuapp.com/1/activitystatus",{
            activity_id: $$(".activity-id").attr("data-id"),
            type: 'start'
        }, function(d) {});

        // create array to store locations
        var locations = [];
        // Start interval
        refreshIntervalId = setInterval(function() {
            var newLocation = updateUserLocation(function (data) {
                locations.push(data);
                
                // Update map
                coords.push(new google.maps.LatLng(data.lat, data.lng));
                var path = new google.maps.Polyline({
                    path: coords,
                    geodesic: true,
                    strokeColor: '#FF0000',
                    strokeOpacity: 0.7,
                    strokeWeight: 2
                });
                path.setMap(map);

                console.log(data);
                routeString += "|" + data.lat + "," + data.lng;

                // Post user's curr location to server
                $$.post("http://pennappsx15.herokuapp.com/1/activitypoints", data, function(data) {
                    // data contains the distance traveled in the activity so far
                });
            }, $$(".activity-id").attr("data-id"));
        }, 10000);

        // Set button action to be able to End timer
        $$("#status").append('Activity in progress! Click to end.');
        $$("#start").html('End');
        $$('#start').off('click', startTimer);
        $$('#start').on('click', endTimer);
    }
    function endTimer() {

        // make request to indicate that the activity has ended
        $.post("http://pennappsx15.herokuapp.com/1/activitystatus",{
            activity_id: $$(".activity-id").attr("data-id"),
            type: 'complete'
        }, function(d) {});

        clearInterval(refreshIntervalId); // Clear interval
        // Set button action to be able to End timer
        
        $$("#status").html('Congratulations! You just completed ___ miles.');
        $$("#start").remove('End');
        $$('#start').off('click', endTimer);
        $$('#start').on('click', startTimer);
    }
    // Initialize timer
    $$('#start').on('click', startTimer);

    var isParticipant = false

    $(".participant-fb-tokes").each(function() {
        if ($(this).attr("data-toke") == USER_DATA.fb_toke) {
            $("#start").hide();
            $("#join").show();
            $("#join").text("You have joined");
            $("#join").attr("disabled", "disabled");
            isParticipant = true;
        }
    })

    if (!isParticipant && $(".creator-fb-toke").attr("data-toke") != USER_DATA.fb_toke) {
        $("#start").hide();
        $("#join").show();
        $("#join").click(function() {
            $.post("http://pennappsx15.herokuapp.com/1/activityjoin",{
                activity_id: $$(".activity-id").attr("data-id"),
                user_id: USER_DATA.fb_toke
            }, function(d) {
                $("#join").text("You have joined");
                $("#join").attr("disabled", "disabled");
            });
        });
    }
});



// Generate dynamic page
var dynamicPageIndex = 0;
function createContentPage() {
	mainView.router.loadContent(
        '<!-- Top Navbar-->' +
        '<div class="navbar">' +
        '  <div class="navbar-inner">' +
        '    <div class="left"><a href="#" class="back link"><i class="icon icon-back"></i><span>Back</span></a></div>' +
        '    <div class="center sliding">Dynamic Page ' + (++dynamicPageIndex) + '</div>' +
        '  </div>' +
        '</div>' +
        '<div class="pages">' +
        '  <!-- Page, data-page contains page name-->' +
        '  <div data-page="dynamic-pages" class="page">' +
        '    <!-- Scrollable page content-->' +
        '    <div class="page-content">' +
        '      <div class="content-block">' +
        '        <div class="content-block-inner">' +
        '          <p>Here is a dynamic page created on ' + new Date() + ' !</p>' +
        '          <p>Go <a href="#" class="back">back</a> or go to <a href="services.html">Services</a>.</p>' +
        '        </div>' +
        '      </div>' +
        '    </div>' +
        '  </div>' +
        '</div>'
    );
	return;
}

$(".tab-link").click(function() {
    var mainView = myApp.addView('.view-main')          
    // Load page from about.html file to main View:
    myApp.mainView.router.loadPage({url: $(this).attr("href"), animatePages:false});
    $(".tab-link.active").removeClass("active");
    $(this).addClass("active");
})

