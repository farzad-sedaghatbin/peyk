App.controller('landCtrl', function ($rootScope, $state, $scope, $q, $cordovaToast, $http, $ionicLoading, $compile, $ionicModal, $window, $timeout, $ionicPopup, landInit, WebService, $interval, $cordovaNativeAudio, $cordovaVibration) {



  /* Funtion For set Map
   =========================================================== */

  function set_map() {
    // Create an array of styles.
    var styles = landInit.mapStyles();

    // Create a new StyledMapType object, passing it the array of styles,
    var styledMap = new google.maps.StyledMapType(styles,
      {name: "Styled Map"});
    var myLatlng = new google.maps.LatLng(35.705097,51.385516);
    var mapOptions = {
      center: myLatlng,
      zoom: 16,
      disableDefaultUI: true,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    var map = new google.maps.Map(document.getElementById("map"),
      mapOptions);
    map.mapTypes.set('map_style', styledMap);
    map.setMapTypeId('map_style');
    $rootScope.map = map;
    $rootScope.init_status = true;
    $ionicLoading.hide();
  }


  /* Function For Get place from LatLng
   ==================================================*/
  function codeLatLng(lat, lng) {
    geocoder = new google.maps.Geocoder();
    var latlng = new google.maps.LatLng(lat, lng);
    geocoder.geocode({'latLng': latlng}, function (results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
        if (results[1]) {
          $rootScope.$apply(function () {
            $rootScope.Location = results[0].formatted_address;
          });
          $rootScope.current_box = angular.copy($rootScope.start_box);
        } else {
          //alert("No results found");
          // $rootScope.Location = "You are here";

        }
      } else {
        // $rootScope.Location = "You are here";

        //alert("Geocoder failed due to: " + status);
      }
    });
  }

  var lat;
  var lng;
  var marker;

  $rootScope.getCurrentLocation = function () {
    if (!$rootScope.map) {
      return;
    }
    var image = 'img/icons/google_marker.png';
    navigator.geolocation.getCurrentPosition(function (pos) {
      //console.log(pos);
      //alert(JSON.stringify(pos));
      lat = pos.coords.latitude;
      lng = pos.coords.longitude;
      var myLatlng = new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
      codeLatLng(pos.coords.latitude, pos.coords.longitude);
      if (marker)
        marker.setMap(null);
      marker = new google.maps.Marker({
        position: myLatlng,
        map: $rootScope.map,
        title: '',
        icon: image
      });
      $rootScope.map.setCenter(myLatlng);
      $ionicLoading.hide();
    }, function (error) {
      $ionicLoading.hide();
    });
  };
  function prepareSocket(){
    $rootScope.socket = new WebSocket("wss://migmig.cfapps.io:4443/driverHandler");
    $rootScope.interval;
    $rootScope.socket.onopen = function () {
      if (!$rootScope.userid) {
        var db = openDatabase('mydb', '1.0', 'Test DB', 1024 * 1024);
        db.transaction(function (tx) {
          tx.executeSql('SELECT d.log FROM ANIJUU d WHERE d.name="userid"', [], function (tx, results) {
            var len = results.rows.length, i, result = '';
            if (!results.rows || results.rows.length == 0) {
              result = null;
            } else {
              result = results.rows.item(0).log;
            }
            setUserId(result)
          }, null);
        });
        var setUserId = function (result) {
          if (!result) {
            $state.go("landing")
          } else {
            $rootScope.userid = result;
            $rootScope.interval = $interval(function () {
              $rootScope.socket.send("mylocation," + $rootScope.userid + "," + lat + "," + lng)
            }, 1000);
          }
        };
      } else {
        $rootScope.interval = $interval(function () {
          $rootScope.socket.send("mylocation," + $rootScope.userid + "," + lat + "," + lng)
        }, 1000);
      }
    };
    $rootScope.socket.onmessage = function (msg) {
      var data = JSON.parse(msg.data);
      switch (data.command) {
        case "request":
          if ($rootScope.startMarker) {
            $rootScope.startMarker.setMap(null);
            $rootScope.endMarker.setMap(null);
            $rootScope.ren.setMap(null);
          }
          $rootScope.$apply(function () {
            $rootScope.tripInfo = data.tripInfo;
            $rootScope.pop_status = 1;
          });
          var start = new google.maps.LatLng(data.tripInfo.slat, data.tripInfo.slng);
          $rootScope.startMarker = new google.maps.Marker({
            position: start,
            map: $rootScope.map,
            title: '',
            icon: startImage
          });
          var end = new google.maps.LatLng(data.tripInfo.dlat, data.tripInfo.dlng);
          $rootScope.endMarker = new google.maps.Marker({
            position: end,
            map: $rootScope.map,
            title: '',
            icon: endImage
          });
          bound.extend(start);
          bound.extend(end);
          $rootScope.map.fitBounds(bound);
          animateMyPop();
          $rootScope.ren = new google.maps.DirectionsRenderer({
            'draggable': false,
            suppressMarkers: true
          });
          $rootScope.ren.setMap($rootScope.map);
          var ser = new google.maps.DirectionsService();
          ser.route({
            'origin': $rootScope.startMarker.getPosition(),
            'destination': $rootScope.endMarker.getPosition(),
            'travelMode': google.maps.DirectionsTravelMode.DRIVING
          }, function (res, sts) {
            if (sts == google.maps.DirectionsStatus.OK) {
              $rootScope.ren.setDirections(res);
              edame(data);
            } else {
              edame(data);
            }
          });

          break;
        case "rejectuser":
          nextElementAfterRemove($rootScope.active_cab);
          $rootScope.trips.splice($rootScope.active_cab, 1);
          $rootScope.$apply();
          break;
      }
    };
  }
  var startImage = 'img/source.png';
  var endImage = 'img/destination.png';
  $rootScope.pop_status = 0;
  $rootScope.startMarker;
  $rootScope.endMarker;
  $rootScope.ren;
  var bound;
  $rootScope.trips = [];

  function initialVars(){
    bound = new google.maps.LatLngBounds(null);
  }

  function nextElementAfterRemove(index) {
    if ($rootScope.trips.length == 1) {
      $rootScope.startMarker.setVisible(false);
      $rootScope.endMarker.setVisible(false);
      $rootScope.ren.setMap(null);
    } else if ($rootScope.trips.length == index + 1) {
      $rootScope.clicked_item(index - 1);
    } else {
      $rootScope.clicked_item(index + 1);
    }
  }

  function edame(data) {
    $rootScope.tripInfo.state = "request";
    var trip = {
      tripInfo: data.tripInfo,
      start: $rootScope.startMarker,
      end: $rootScope.endMarker,
      ren: $rootScope.ren
    };
    $rootScope.trips.push(trip);

    $cordovaNativeAudio
      .preloadSimple('migmig', 'audio/migmig.mp3')

      .then(function (msg) {
        console.log(msg);
      }, function (error) {
        console.log(error);
      });
    $cordovaNativeAudio.play("migmig");
    $cordovaVibration.vibrate(1000);
  }

  $scope.$on('ngRepeatFinished', function (ngRepeatFinishedEvent) {
    $rootScope.clicked_item($rootScope.indexOfNg);
  });
  $rootScope.clicked_item = function (index) {
    // $window.alert(item);
    $rootScope.active_cab = index;
    animate_tab();
    $rootScope.startMarker.setVisible(false);
    $rootScope.endMarker.setVisible(false);
    $rootScope.ren.setMap(null);
    $rootScope.tripInfo = $rootScope.trips[index].tripInfo;
    $rootScope.startMarker = $rootScope.trips[index].start;
    $rootScope.endMarker = $rootScope.trips[index].end;
    $rootScope.ren = $rootScope.trips[index].ren;
    $rootScope.ren.setMap($rootScope.map);
    $rootScope.startMarker.setVisible(true);
    $rootScope.startMarker.setMap($rootScope.map);
    $rootScope.endMarker.setVisible(true);
    $rootScope.endMarker.setMap($rootScope.map);
    var element = $("#my-pop");
    switch ($rootScope.tripInfo.state) {
      case "request":
        $rootScope.pop_status = 1;
        if (!element.hasClass("my-active")) {
          element.addClass("my-active")
        }
        break;
      case "accept":
        $rootScope.pop_status = 2;
        if (element.hasClass("my-active")) {
          element.removeClass("my-active")
        }
        break;
      case "rejectBeforeAccept":
        resetAllThings();
        if (element.hasClass("my-active")) {
          element.removeClass("my-active")
        }
        break;
      case "arrived":
        $rootScope.pop_status = 3;
        if (element.hasClass("my-active")) {
          element.removeClass("my-active")
        }
        break;
      case "cancelAfterAccept":
        resetAllThings();
        if (element.hasClass("my-active")) {
          element.removeClass("my-active")
        }
        break;
      case "endOfTrip":
        nextElementAfterRemove(index);
        $rootScope.trips.splice(index, 1);
        $rootScope.ren.setMap(null);
        resetAllThings();
        if (element.hasClass("my-active")) {
          element.removeClass("my-active")
        }
        break;
    }
  };
  function animate_tab() {
    $('#tab-hide').addClass('hidden');
    $timeout(function () {
      $('#tab-hide').removeClass('hidden');
    }, 300);
  }

  var available = true;
  $rootScope.availableOrNot = function () {
    if (available) {
      available = false;
      $("#availableText").html("خارج از دسترس");
      $http({
        method: "POST",
        url: "https://migmig.cfapps.io/api/1/unavailable"
      }).then(function (resp) {
      }, function (err) {
      });
      $interval.cancel($rootScope.interval);
    } else {
      available = true;
      $("#availableText").html("در دسترس");
      $rootScope.getCurrentLocation();
      if ($rootScope.tripInfo && ($rootScope.tripInfo.state == "accept" || $rootScope.tripInfo.state == "arrived")) {
        $rootScope.interval = $interval(function () {
          $rootScope.socket.send("delivery," + $rootScope.userid + "," + lat + "," + lng);
        }, 1000);
      } else {
        $rootScope.interval = $interval(function () {
          $rootScope.socket.send("mylocation," + $rootScope.userid + "," + lat + "," + lng)
        }, 1000);
      }
    }
  };
  $rootScope.CallNumber = function () {
    window.plugins.CallNumber.callNumber(function () {
    }, function () {
    }, $rootScope.tripInfo.mobile)
  };
  $rootScope.arrived = function () {
    WebService.startLoading();
    $rootScope.tripInfo.state = "arrived";
    $rootScope.pop_status = 3;
    $http({
      method: "POST",
      url: "https://migmig.cfapps.io/api/1/arrived",
      data: $rootScope.tripInfo.uid
    }).then(function (resp) {
      WebService.stopLoading();
    }, function (err) {
      WebService.stopLoading();
      WebService.myErrorHandler(err, false);
    });
  };
  $rootScope.accept = function () {
    WebService.startLoading();
    $rootScope.tripInfo.state = "accept";
    animateMyPop();
    $http({
      method: "POST",
      url: "https://migmig.cfapps.io/api/1/approvedDriver",
      data: $rootScope.tripInfo.uid
    }).then(function (resp) {
      $rootScope.pop_status = 2;
      $interval.cancel($rootScope.interval);
      if (!lat)
        $rootScope.getCurrentLocation();
      $rootScope.interval = $interval(function () {
        $rootScope.socket.send("delivery," + $rootScope.userid + "," + lat + "," + lng + "," + $rootScope.tripInfo.userID);
      }, 1000);
      WebService.stopLoading();
    }, function (err) {
      if (err.status == 404) {
        nextElementAfterRemove($rootScope.active_cab);
        $rootScope.trips.splice($rootScope.active_cab, 1);
        $cordovaToast.showShortBottom('این سفر توسط مسافر لغو شد');
      } else {
        WebService.myErrorHandler(err, false);
      }
      WebService.stopLoading();
    });
  };
  $rootScope.rejectBeforeAccept = function () {
    WebService.startLoading();
    $rootScope.tripInfo.state = "rejectBeforeAccept";
    resetAllThings();
    animateMyPop();
    $http({
      method: "POST",
      url: "https://migmig.cfapps.io/api/1/rejectBeforeDriver",
      data: $rootScope.tripInfo.uid
    }).then(function (resp) {
      WebService.stopLoading();
    }, function (err) {
      WebService.stopLoading();
      WebService.myErrorHandler(err, false);
    });
  };
  $rootScope.cancelAfterAccept = function () {
    WebService.startLoading();
    $rootScope.tripInfo.state = "cancelAfterAccept";
    resetAllThings();
    $http({
      method: "POST",
      url: "https://migmig.cfapps.io/api/1/rejectAfterDriver",
      data: $rootScope.tripInfo.uid
    }).then(function (resp) {
      WebService.stopLoading();
    }, function (err) {
      WebService.stopLoading();
      WebService.myErrorHandler(err, false);
    });
  };
  function resetAllThings() {
    if ($rootScope.startMarker) {
      $rootScope.startMarker.setMap(null);
      $rootScope.endMarker.setMap(null);
    }
    $rootScope.pop_status = 0;
    $interval.cancel($rootScope.interval);
    $rootScope.getCurrentLocation();
    $rootScope.interval = $interval(function () {
      $rootScope.socket.send("mylocation," + $rootScope.userid + "," + lat + "," + lng)
    }, 1000);
  }

  $rootScope.endOfTrip = function () {
    WebService.startLoading();
    $rootScope.tripInfo.state = "endOfTrip";
    $rootScope.ren.setMap(null);
    nextElementAfterRemove($rootScope.active_cab);
    $rootScope.trips.splice($rootScope.active_cab, 1);
    resetAllThings();
    $http({
      method: "POST",
      url: "https://migmig.cfapps.io/api/1/endOfTrip",
      data: $rootScope.tripInfo.uid
    }).then(function (resp) {
      WebService.stopLoading();
    }, function (err) {
      WebService.stopLoading();
      WebService.myErrorHandler(err, false);
    });
  };
  if ($rootScope.init_status === undefined) {
    $.getScript("http://maps.googleapis.com/maps/api/js?key=AIzaSyBksdkjWFIfdMS_IhY8sEit6r9IPrPq-lA&sensor=true&libraries=places", function (data, textStatus, jqxhr) {
      if (typeof google === 'object' && typeof google.maps === 'object') {
        var s = document.createElement("script");
        s.type = "text/javascript";
        s.data = data;
        $("head").append(s);
        initialMainPage();
      } else {
        $cordovaToast.showShortBottom('لطفا اتصال اینترنت خود را بررسی کنید');
      }
    });
  }
  function initialMainPage(){
    prepareSocket();
    set_map();
    initialVars();
    $rootScope.getCurrentLocation();
    google.maps.event.trigger($rootScope.map, 'resize');
  }
  document.addEventListener("online", onOnline, false);
  function onOnline() {
    if ($rootScope.init_status === undefined) {
      initialMainPage();
    }
  }

  function animateMyPop() {
    $('#my-pop').toggleClass('my-active');
  }
});

App.service('serv', function ($rootScope) {
  this.set_trip_tab = function () {
    $rootScope.myTrip_menu_selected = 0;
  };
});
