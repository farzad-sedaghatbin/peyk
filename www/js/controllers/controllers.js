

var App = angular.module('CallAppcontrollers',[]);

App.controller('AppCtrl', function($scope,$rootScope,$cordovaNetwork, $ionicModal, $timeout,$state,$ionicLoading, $ionicPopup,$http, $cordovaOauth, $cordovaSplashscreen,$ionicHistory, WebService,$interval) {

  var link = 'fetchUserAppLanguage';
  var post_data ="";
  var promise = WebService.send_data(link, post_data);
  promise.then(function (data) {
    //console.log(data);
    $rootScope.appConvertedLang=data;
  });

  //localStorage.removeItem('user_data');

  //$cordovaSplashscreen.show();

  function set_net( status ){
    if( status == 'online'){
      $('.net-error').hide();
      $ionicLoading.hide();
    }else{
      $('.net-error').show();
      WebService.show_loading();
    }

  }
  //
  // if( $cordovaNetwork.isOffline() ){
  //
  // 	set_net('offline');
  //
  // }else{
  if( localStorage.getItem('user_data') === null ){

  }else{

    $rootScope.user_data = JSON.parse( localStorage.getItem('user_data') );
    $ionicHistory.nextViewOptions({
      historyRoot: true
    });

    $state.go('app.landing', {}, {reload: true});
    //$state.go('app.landing');
  }
  // }

  $rootScope.$on('$cordovaNetwork:online', function(event, networkState){
    set_net( 'online' );
  })

  $rootScope.$on('$cordovaNetwork:offline', function(event, networkState){
    set_net( 'offline' );
  })



  // Form data for the login modal


  //$scope.sign_up_form = {};

  // Create the login modal that we will use later
  $scope.modal = {};

  $ionicModal.fromTemplateUrl('templates/login.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.modal.sign_in = modal;
  });

  $ionicModal.fromTemplateUrl('templates/sign-up.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.modal.sign_up = modal;
  });

  // Triggered in the login modal to close it
  $scope.closeLogin = function() {
    $scope.modal.sign_in.hide();
  };

  $scope.closeSignUp = function() {
    $scope.modal.sign_up.hide();
  };


  // Open the login modal
  $scope.show_login1 = function() {
    $scope.login = {};
    $scope.modal.sign_in.show();
  };

  $scope.sign_up = function() {
    $scope.signUp = {};
    $scope.modal.sign_up.show();
  };


  // Perform the login action when the user submits the login form
  $scope.doLogin = function( form ) {
    WebService.startLoading();
    //$state.go('view', {movieid: 1});
    // $state.go('app.landing');
    if (form.$valid) {
      try {
        delete $http.defaults.headers.common.Authorization;
      }catch (e){
      }
      var url = "https://migmig.cfapps.io/api/1/user_authenticate";
      var data = {
        username: $scope.login.mail,
        password: $scope.login.pwd,
        rememberMe: false
      };
      $http.post(url, data).success(function (data, status, headers, config) {
        WebService.stopLoading();
        $rootScope.username = $scope.login.mail;
        $rootScope.wallet = data.wallet;
        $rootScope.userid = data.userid;
        $http.defaults.headers.common.Authorization = "Bearer " + data.token;
        var db = openDatabase('mydb', '1.0', 'Test DB', 1024 * 1024);
        db.transaction(function (tx) {
          tx.executeSql('INSERT INTO ANIJUU (name, log) VALUES (?, ?)', ["username", $rootScope.username + "," + $rootScope.wallet]);
          tx.executeSql('INSERT INTO ANIJUU (name, log) VALUES (?, ?)', ["userid", $rootScope.userid]);
          tx.executeSql('INSERT INTO ANIJUU (name, log) VALUES (?, ?)', ["myToken", data.token]);
        });
        $state.go('app.landing', {}, {reload: true});
      }).catch(function (err) {
        WebService.stopLoading();
        WebService.myErrorHandler(err,true);
      });
    } else {
      form.mail.$setDirty();
      form.pwd.$setDirty();
      WebService.stopLoading();
    }
    $scope.modal.sign_in.hide();
  };
  $scope.chose = function (type) {
    $scope.type = type;
    $ionicModal.fromTemplateUrl('templates/select.html', {
      scope: $scope
    }).then(function (modal) {
      $rootScope.mainModal = modal;
      $rootScope.mainModal.show();
    });
  };
  function setVariable(result) {
    $.each($scope.items, function( index, value ) {
      if (value.type == $scope.type){
        $scope.items.splice(index,1);
      }
    });
    if ($scope.type == 'DRIVER'){
      $scope.driver = result;
      $scope.title = "راننده"
    } else if ($scope.type == 'LICENSE'){
      $scope.license = result;
      $scope.title = "گواهینامه"
    } else if ($scope.type == 'CAR'){
      $scope.car = result;
      $scope.title = "کارت ماشین"
    } else {
      $scope.insurance = result;
      $scope.title = "بیمه نامه"
    }
  }
  $scope.remove = function (item) {
    if (item.type == 'DRIVER'){
      $scope.driver = null;
    } else if (item.type == 'LICENSE'){
      $scope.license = null;
    } else if (item.type == 'CAR'){
      $scope.car = null;
    } else {
      $scope.insurance = null;
    }
    $.each($scope.items, function( index, value ) {
      if (value.thumbnail == item.thumbnail){
        $scope.items.splice(index,1);
      }
    });
  };
  $scope.items = [];
  $scope.gallery = function () {
    var options = {sourceType: Camera.PictureSourceType.PHOTOLIBRARY};
    navigator.camera.getPicture(function cameraSuccess(imageUri) {
      window.resolveLocalFileSystemURL(imageUri, function (fileEntry) {
        fileEntry.file(function (file) {
          var reader = new FileReader();
          reader.onloadend = function(evt) {
            //todo: farzad breakpoint
            setVariable(evt.target.result);
            $scope.items.push({
              thumbnail : imageUri,
              type : $scope.type,
              title : $scope.title
            });
            $rootScope.mainModal.hide();
            $scope.$apply();
          };
          reader.readAsDataURL(file);
        });
      });
    }, function cameraError(error) {
      console.debug("Unable to obtain picture: " + error, "app");
    }, options);
  };
  $scope.camera = function () {
    var options = {sourceType: Camera.PictureSourceType.CAMERA};
    navigator.camera.getPicture(function cameraSuccess(imageUri) {
      window.resolveLocalFileSystemURL(imageUri, function (fileEntry) {
        fileEntry.file(function (file) {
          var reader = new FileReader();
          reader.onloadend = function(evt) {
            setVariable(evt.target.result);
            $scope.items.push({
              thumbnail : imageUri,
              type : $scope.type,
              title : $scope.title
            });
            $rootScope.mainModal.hide();
            $scope.$apply();
          };
          reader.readAsDataURL(file);
        });
      });
    }, function cameraError(error) {
      console.debug("Unable to obtain picture: " + error, "app");
    }, options);
  };
  $scope.signUp = {};
  $scope.do_signUp = function( form ) {
    WebService.startLoading();
    //$state.go('view', {movieid: 1});
    if(
      form.$valid
      && $scope.signUp.pwd ==  $scope.signUp.c_pwd
    //true
    ){

      var link = 'sign_up';

      var post_data = {
        'secret_key': secret_key,
        'Email'     : $scope.signUp.mail ,
        'Password'  : $scope.signUp.pwd ,
        'Mobile'    : $scope.signUp.mobile ,
        'User_name' : $scope.signUp.user_name ,
        'Name'			: $scope.signUp.name
      }

      /*
       var post_data = {
       'Email'     : "mynameisibnu@gmail.com" ,
       'Password'  : "123456" ,
       'Mobile'    : "9946973457" ,
       'User_name' : "ibkarbin" ,
       'Name'			: "ibnu",
       }
       */
      if (!$scope.driver){
        $ionicPopup.alert({
          title: '<p class="text-center color-yellow">' + $filter('langTranslate')("نقص در اطلاعات", $rootScope.appConvertedLang['FAILED']) + '</p>',
          template: '<p class="text-center color-gery">' + $filter('langTranslate')("عکس راننده انتخاب نشده است", $rootScope.appConvertedLang['Enter_pickup_location']) + '</p>'
        });
      } else if(!$scope.license){
        $ionicPopup.alert({
          title: '<p class="text-center color-yellow">' + $filter('langTranslate')("نقص در اطلاعات", $rootScope.appConvertedLang['FAILED']) + '</p>',
          template: '<p class="text-center color-gery">' + $filter('langTranslate')("عکس گواهینامه انتخاب نشده است", $rootScope.appConvertedLang['Enter_pickup_location']) + '</p>'
        });
      } else if (!$scope.car) {
        $ionicPopup.alert({
          title: '<p class="text-center color-yellow">' + $filter('langTranslate')("نقص در اطلاعات", $rootScope.appConvertedLang['FAILED']) + '</p>',
          template: '<p class="text-center color-gery">' + $filter('langTranslate')("عکس کارت ماشین انتخاب نشده است", $rootScope.appConvertedLang['Enter_pickup_location']) + '</p>'
        });
      } else if (!$scope.insurance){
        $ionicPopup.alert({
          title: '<p class="text-center color-yellow">' + $filter('langTranslate')("نقص در اطلاعات", $rootScope.appConvertedLang['FAILED']) + '</p>',
          template: '<p class="text-center color-gery">' + $filter('langTranslate')("عکس بیمه نامه انتخاب نشده است", $rootScope.appConvertedLang['Enter_pickup_location']) + '</p>'
        });
      }
      var url = "https://migmig.cfapps.io/api/1/signup";
      var data = {
        firstName: $scope.signUp.name,
        lastName: $scope.signUp.name,
        username: $scope.signUp.user_name,
        mobile: $scope.signUp.mobile,
        password: $scope.signUp.pwd,
        driver : $scope.driver,
        license : $scope.license,
        car : $scope.car,
        insurance : $scope.insurance
      };
      $http.post(url, data)
        .success(function (suc) {
          WebService.stopLoading();
          $state.go("app.landing");
        }).error(function (err) {
        WebService.stopLoading();
        WebService.myErrorHandler(err,false);
      });
    }else{
      form.pwd.$setDirty();
      form.number.$setDirty();
      form.mail.$setDirty();
      form.name.$setDirty();
      form.user_name.$setDirty();

    }

  };
  // MENU
  $scope.logout = function(){
    var db = openDatabase('mydb', '1.0', 'Test DB', 1024 * 1024);
    db.transaction(function (tx) {
      tx.executeSql('DELETE FROM ANIJUU');
    });
    localStorage.removeItem('user_data');
    WebService.show_loading();
    resetBeforeLogout();
    $timeout(function(){
      $ionicLoading.hide();
      $ionicHistory.nextViewOptions({
        disableAnimate: true,
        disableBack: true
      });
      $state.go('landing', {}, {reload: true});

    }, 1000);
  };
  function resetBeforeLogout(){
    if ($rootScope.startMarker) {
      $rootScope.startMarker.setMap(null);
      $rootScope.endMarker.setMap(null);
    }
    $rootScope.pop_status = 0;
    $interval.cancel($rootScope.interval);
    $rootScope.socket.close();
  }

  $scope.updateWallet = function () {
    WebService.startLoading();
    $http({
      method: "POST",
      url: "https://migmig.cfapps.io/api/1/refreshMoney"
    }).then(function (resp) {
      $rootScope.wallet = resp.data;
      WebService.stopLoading();
    }, function (err) {
      WebService.stopLoading();
      WebService.myErrorHandler(err,false);
    });
  };

  $scope.load_trips = function(){
    WebService.startLoading();
    $http({
      method: "POST",
      url: "https://migmig.cfapps.io/api/1/driverTrips"
    }).then(function (resp) {
      WebService.stopLoading();
      $rootScope.Trips = resp.data;
      $rootScope.active_trip = $rootScope.Trips.inProgressTrips;
      $state.go("app.mytrip");
    }, function (err) {
      WebService.stopLoading();
      WebService.myErrorHandler(err,false);
    });
  };
  $scope.load_card_rate = function(){

    WebService.show_loading();
    $rootScope.rateCard_menu_selected = 0;

    var link = 'load_card_rate';
    var post_data = {
      'transfertype'    : 'Point to Point Transfer'
    }
    var promise = WebService.send_data( link,post_data);

    promise.then(function(data){
      $rootScope.All_cabs = data;
      $rootScope.active_rateCard =  $rootScope.All_cabs.day;
      $ionicLoading.hide();
    });

  }

});

