App.controller('myTripCtrl', function ($scope, $rootScope, $ionicLoading, $compile, $ionicModal, $window, $timeout, $state, $http,WebService) {

  /* JAVASCRIPT
   ===========================*/
  function animate_Trip_item() {
    $('#content-tab-area').addClass('hidden');

    $timeout(function () {
      $('#content-tab-area').removeClass('hidden');
    }, 300);
  }

  $timeout(function (){
    var back = $('.back-text');
    if (back){
      back.css("display","none");
    }
  }, 300);
  $scope.myTrip_menu = [
    {'name': 'سفرهای در حال انجام'},
    {'name': 'سفرهای انجام شده'}
  ];
  //$scope.myTrip_menu_selected = 0;
  $scope.Trip_menu_click = function (index) {
    if ($rootScope.myTrip_menu_selected != index) {
      $rootScope.myTrip_menu_selected = index;
      if (index == 0) {
        $rootScope.active_trip = $rootScope.Trips.inProgressTrips;
      } else if (index == 1) {
        $rootScope.active_trip = $rootScope.Trips.completedTrips;
      }
      animate_Trip_item();
    }
  };
  $scope.show_details = function (uid) {
    $http({
      method: "POST",
      url: "https://migmig.cfapps.io/api/1/detail",
      data : uid
    }).then(function (resp) {
      $rootScope.details = resp.data;
      $state.go("app.tripDetials")
    }, function (err) {
      WebService.myErrorHandler(err,false);
    });
  };
  $scope.showFrom = function () {
    $state.go("app.navigation");
  }

});
