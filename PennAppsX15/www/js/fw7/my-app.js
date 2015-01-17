// Initialize your app
var myApp = new Framework7();

// Export selectors engine
var $$ = Dom7;

// Add view
var mainView = myApp.addView('.view-main', {
    // Because we use fixed-through navbar we can enable dynamic navbar
    dynamicNavbar: true
});

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
function routeMap(arr) {
    var coords = "";
    for (var i in arr) {
        coords += "|" + arr[i].lat + "," + arr[i].lon;
    }
    return "https://maps.googleapis.com/maps/api/staticmap?path=color:0x0000ff|weight:5"+
        coords + "&size=400x400&key=AIzaSyAH-KSfz-462dVd84424pUVWa7vO2RgfAs";
}

function updateUserLocation(callback, activity_id) {
    navigator.geolocation.getCurrentPosition(
            function(position) {
                var data = {
                    id: USER_DATA.fb_toke,
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                if (activity_id !== undefined) {
                    // Update activity location
                }
                // Post user's curr location to server
                $$.post("http://pennappsx15.herokuapp.com/1/currloc", data, function(d) {
                });
                callback(data);
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
    // run createContentPage func after link was clicked
    $$('.create-page').on('click', function () {
        createContentPage();
    });

    data = [
            {lat: 39.943913494072, lon: -75.14748898749997},
            {lat: 40.4892106296273, lon: -76.3669714093749},
            {lat: 41.19565802096997, lon: -77.02615109687}
        ];
    /*
    // Add map of route
    $$('.content-block').append(
        "<img src='" + routeMap(data) + "'>"
    );
    */

    // Allow input of starting point
    navigator.geolocation.getCurrentPosition(
            function(position) {
                var latlong = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                var mapOptions = {
                  center: latlong,
                  zoom: 12
                };
                var map = new google.maps.Map(document.getElementById('map-div'), mapOptions);
                var marker = new google.maps.Marker({
                    position: latlong,
                    title:"Starting Point",
                    draggable:true
                });
                marker.setMap(map);
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
                        console.log(data);
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

myApp.onPageInit('home', function (page) {
    // run createContentPage func after link was clicked
    $$('.create-page').on('click', function () {
        createContentPage();
    });
    
    // timer
    $$('#start').on('click', function () {
        // create array to store locations
        var locations = [];
        var starting = updateUserLocation();
        locations.push(starting);
        console.log(starting);

        // Start timer
        setInterval(function() {
            var newLocation = updateUserLocation();
            console.log(newLocation);
            locations.push(newLocation);
        }, 30000);

        $$("#start").html('End');

    });
});

myApp.onPageInit('newsfeed', function (page) {
    // run createContentPage func after link was clicked
    $$('.create-page').on('click', function () {
        createContentPage();
    });
});

myApp.onPageInit('leaderboard', function (page) {
    // run createContentPage func after link was clicked
    $$('.create-page').on('click', function () {
        createContentPage();
    });
});

myApp.onPageInit('profile', function (page) {
    // run createContentPage func after link was clicked
    $$('.create-page').on('click', function () {
        createContentPage();
    });
    var name = USER_DATA.name;
    var id = USER_DATA.fb_toke;
    var img_url = "http://graph.facebook.com/" + id + "/picture?type=large";
    $(".fb-img").attr("src", img_url);
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

