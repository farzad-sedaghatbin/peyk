App.controller('landCtrl', function ($scope, $rootScope, $q, $http, $ionicLoading, $compile, $ionicModal, $window, $timeout, $ionicPopup, landInit, WebService, $interval) {



  /* Funtion For set Map
   =========================================================== */

  function set_map() {
    // Create an array of styles.
    var styles = landInit.mapStyles();

    // Create a new StyledMapType object, passing it the array of styles,
    var styledMap = new google.maps.StyledMapType(styles,
      {name: "Styled Map"});
    var myLatlng = new google.maps.LatLng(43.07493, -89.381388);
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
    $scope.map = map;
    $scope.init_status = true;
    $ionicLoading.hide();
  }


  /* Function For Get place from LatLng
   ==================================================*/
  function codeLatLng(lat, lng) {
    $scope.loading = $ionicLoading.show({
      content: 'Getting current location...',
      showBackdrop: false
    });
    geocoder = new google.maps.Geocoder();
    var latlng = new google.maps.LatLng(lat, lng);
    geocoder.geocode({'latLng': latlng}, function (results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
        if (results[1]) {
          $scope.$apply(function () {
            $scope.Location = results[0].formatted_address;
          });
          $scope.current_box = angular.copy($scope.start_box);
        } else {
          //alert("No results found");
          // $scope.Location = "You are here";

        }
      } else {
        // $scope.Location = "You are here";

        //alert("Geocoder failed due to: " + status);
      }
    });
  }

  $scope.getCurrentLocation = function () {
    if (!$scope.map) {
      return;
    }
    var contentString = "<div style='width: 200px'><a  ng-click='clickTest()'>{{Location}}</a></div>";
    var compiled = $compile(contentString)($scope);
    var image = 'img/icons/google_marker.png';
    $scope.infowindow = new google.maps.InfoWindow({
      content: compiled[0]
    });
    navigator.geolocation.getCurrentPosition(function (pos) {
      //console.log(pos);
      //alert(JSON.stringify(pos));
      var myLatlng = new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
      codeLatLng(pos.coords.latitude, pos.coords.longitude);
      var marker = new google.maps.Marker({
        position: myLatlng,
        map: $scope.map,
        title: '',
        icon: image
      });
      $scope.infowindow.open($scope.map, marker);
      google.maps.event.addListener(marker, 'click', function () {
        $scope.infowindow.open($scope.map, marker);
      });
      $scope.map.setCenter(myLatlng);
      $ionicLoading.hide();
    }, function (error) {
      alert('Unable to get location: ' + error.message);
    });
  };

  var socket = new WebSocket("ws://192.168.161.111:8080/driverHandler");
  var interval;
  socket.onopen = function () {
    interval = $interval(function () {
      socket.send("mylocation,1,35.770412,51.444817")
    }, 1000);
  };
  var image = 'img/icons/google_marker.png';
  $scope.pop_status = 0;
  var startMarker;
  var endMarker;
  var bound = new google.maps.LatLngBounds(null);
  $scope.trips = [];
  socket.onmessage = function (msg) {
    var data = JSON.parse(msg.data);
    switch (data.command) {
      case "request":
        if (startMarker) {
          startMarker.setMap(null);
          endMarker.setMap(null);
        }
        $scope.$apply(function () {
          $scope.tripInfo = data.tripInfo;
          $scope.pop_status = 1;
        });
        var start = new google.maps.LatLng(data.tripInfo.slat, data.tripInfo.slng);
        startMarker = new google.maps.Marker({
          position: start,
          map: $scope.map,
          title: '',
          icon: image
        });
        var end = new google.maps.LatLng(data.tripInfo.dlat, data.tripInfo.dlng);
        endMarker = new google.maps.Marker({
          position: end,
          map: $scope.map,
          title: '',
          icon: image
        });
        bound.extend(start);
        bound.extend(end);
        $scope.map.fitBounds(bound);
        animateMyPop();
        $scope.tripInfo.state = "request";
        var trip = {
          tripInfo: data.tripInfo,
          start: startMarker,
          end: endMarker
        };
        $scope.trips.push(trip);
        $cordovaNativeAudio.play("driver");
        break;
    }
  };
  $scope.clicked_item = function (index) {
    // $window.alert(item);
    $scope.active_cab = index;
    animate_tab();
    startMarker.setVisible(false);
    endMarker.setVisible(false);
    $scope.tripInfo = $scope.trips[index].tripInfo;
    startMarker = $scope.trips[index].start;
    endMarker = $scope.trips[index].end;
    startMarker.setVisible(true);
    endMarker.setVisible(true);
    var element = $("#my-pop");
    switch ($scope.tripInfo.state) {
      case "request":
        $scope.pop_status = 1;
        if (!element.hasClass("my-active")){
          element.addClass("my-active")
        }
        break;
      case "accept":
        $scope.pop_status = 2;
        if (element.hasClass("my-active")){
          element.removeClass("my-active")
        }
        break;
      case "rejectBeforeAccept":
        resetAllThings();
        if (element.hasClass("my-active")){
          element.removeClass("my-active")
        }
        break;
      case "arrived":
        $scope.pop_status = 3;
        if (element.hasClass("my-active")){
          element.removeClass("my-active")
        }
        break;
      case "cancelAfterAccept":
        resetAllThings();
        if (element.hasClass("my-active")){
          element.removeClass("my-active")
        }
        break;
      case "endOfTrip":
        resetAllThings();
        if (element.hasClass("my-active")){
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
  var available = false;
  $scope.availableOrNot = function () {
    if (available){
      available = false;
      $("#availableText").html("خارج از دسترس")
    } else {
      available = true;
      $("#availableText").html("در دسترس")
    }
  };
  $scope.arrived = function () {
    $scope.tripInfo.state = "arrived";
    $scope.pop_status = 3;
    $http({
      method: "POST",
      url: "http://192.168.161.111:8080/api/1/arrived",
      data: $scope.tripInfo.uid
    }).then(function (resp) {
    }, function (err) {
    });
  };
  $scope.accept = function () {
    $scope.tripInfo.state = "accept";
    animateMyPop();
    $scope.pop_status = 2;
    $http({
      method: "POST",
      url: "http://192.168.161.111:8080/api/1/approvedDriver",
      data: $scope.tripInfo.uid
    }).then(function (resp) {
      $interval.cancel(interval);
      interval = $interval(function () {
        socket.send("delivery,1,35.770412,51.444817,1")
      }, 1000);
    }, function (err) {
    });
  };
  $scope.rejectBeforeAccept = function () {
    $scope.tripInfo.state = "rejectBeforeAccept";
    resetAllThings();
    animateMyPop();
    $http({
      method: "POST",
      url: "http://192.168.161.111:8080/api/1/rejectBeforeDriver",
      data: $scope.tripInfo.uid
    }).then(function (resp) {
    }, function (err) {
    });
  };
  $scope.cancelAfterAccept = function () {
    $scope.tripInfo.state = "cancelAfterAccept";
    resetAllThings();
    $http({
      method: "POST",
      url: "http://192.168.161.111:8080/api/1/rejectAfterDriver",
      data: $scope.tripInfo.uid
    }).then(function (resp) {
    }, function (err) {
    });
  };
  function resetAllThings() {
    if (startMarker) {
      startMarker.setMap(null);
      endMarker.setMap(null);
    }
    $scope.pop_status = 0;
    $interval.cancel(interval);
    interval = $interval(function () {
      socket.send("mylocation,1,35.770412,51.444817")
    }, 1000);
  }

  $scope.endOfTrip = function () {
    $scope.tripInfo.state = "endOfTrip";
    resetAllThings();
    $http({
      method: "POST",
      url: "http://192.168.161.111:8080/api/1/endOfTrip",
      data: $scope.tripInfo.uid
    }).then(function (resp) {
    }, function (err) {
    });
  };
  if ($scope.init_status === undefined) {
    set_map();
    $scope.getCurrentLocation();
    var link = 'settings';
    var post_data = {};
    WebService.show_loading();
    var promise = WebService.send_data(link, post_data);
    promise.then(function (data) {
    });
  }

  $scope.$on("$ionicView.enter", function (scopes, states) {
    google.maps.event.trigger($scope.map, 'resize');
  });

  function animateMyPop() {
    $('#my-pop').toggleClass('my-active');
  }
});

App.service('serv', function ($rootScope) {
  this.set_trip_tab = function () {
    $rootScope.myTrip_menu_selected = 0;
  };
});
