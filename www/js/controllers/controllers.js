

var App = angular.module('CallAppcontrollers',[]);

App.controller('AppCtrl', function($scope,$rootScope,$cordovaNetwork, $ionicModal, $timeout,$state,$ionicLoading, $ionicPopup,$http, $cordovaOauth, $cordovaSplashscreen,$ionicHistory, WebService) {

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
		//$state.go('view', {movieid: 1});
		// $state.go('app.landing');
    if (form.$valid) {
      try {
        delete $http.defaults.headers.common.Authorization;
      }catch (e){
      }
      var url = "http://127.0.0.1:8080/api/1/user_authenticate";
      var data = {
        username: $scope.login.mail,
        password: $scope.login.pwd,
        rememberMe: false
      };
      $http.post(url, data).success(function (data, status, headers, config) {
        // $scope.username = username;
        $http.defaults.headers.common.Authorization = data.token;
        var sqldata = JSON.stringify(data);
        var db = openDatabase('mydb', '1.0', 'Test DB', 1024 * 1024);
        db.transaction(function (tx) {
          tx.executeSql('INSERT INTO ANIJUU (name, log) VALUES (?, ?)', ["username", username]);
          tx.executeSql('INSERT INTO ANIJUU (name, log) VALUES (?, ?)', ["myToken", data.token]);
        });
        $scope.modal.sign_in.hide();
        $state.go('app.landing', {}, {reload: true});
      }).catch(function (err) {
      });
    } else {
      form.mail.$setDirty();
      form.pwd.$setDirty();
    }


	};
  var newItems = [];
  $scope.chose = function () {
    $ionicModal.fromTemplateUrl('templates/select.html', {
      scope: $scope
    }).then(function (modal) {
      $rootScope.mainModal = modal;
      $rootScope.mainModal.show();
    });
  };
  $scope.gallery = function () {
    var options = {sourceType: Camera.PictureSourceType.PHOTOLIBRARY};
    navigator.camera.getPicture(function cameraSuccess(imageUri) {
      window.resolveLocalFileSystemURL(imageUri, function (fileEntry) {
        fileEntry.file(function (file) {
          var reader = new FileReader();
          reader.onloadend = function(evt) {
            //todo: farzad breakpoint
            newItems.push(evt.target.result);
            $scope.items.push({
              type : "img",
              thumbnail : imageUri,
              media : imageUri
            });
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
            newItems.push(evt.target.result);
            $scope.items.push({
              type : "img",
              thumbnail : imageUri,
              media : imageUri
            })
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
								'Name'			: $scope.signUp.name,
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
      var url = "http://127.0.0.1:8080/api/1/signup";
      var data = {
        firstName: $scope.signUp.name,
        lastName: $scope.signUp.name,
        username: $scope.signUp.user_name,
        mobile: $scope.signUp.mobile,
        password: $scope.signUp.pwd
      };
      $http.post(url, data)
        .success(function (suc) {
          if (suc == "201") {
            $ionicPopup.alert({
              title: '<span class="myText">خطا</span>',
              template: '<div class="myText" style="text-align: right">کاربر دیگری با نام کاربری شما قبلا ثبت نام کرده</div>'
            });
          } else {
            $ionicPopup.alert({
              title: '<span class="myText">پیام</span>',
              template: '<div class="myText" style="text-align: right">ثبت نام با شما با موفقیت انجام شد</div>'
            });
            $(".popup").css("width", "90%");
          }
          $state.go("app.landing");
        }).error(function (err) {
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
		localStorage.removeItem('user_data');
		WebService.show_loading();

		$timeout(function(){
				$ionicLoading.hide();
				$ionicHistory.nextViewOptions({
					disableAnimate: true,
					disableBack: true
				});
				$state.go('landing', {}, {reload: true});

		}, 1000);
		//$state.go('landing');

	};



  $scope.peyk = function(){
    $state.go("app.peyk");
  };

	$scope.load_trips = function(){
    $http({
      method: "POST",
      url: "http://127.0.0.1:8080/api/1/driverTrips"
    }).then(function (resp) {
      $rootScope.Trips = resp.data;
      $rootScope.active_trip = $rootScope.Trips.inProgressTrips;
      $state.go("app.mytrip")
    }, function (err) {
    });
	};
	$scope.load_card_rate = function(){

		 WebService.show_loading();
		 $rootScope.rateCard_menu_selected = 0;

		 var link = 'load_card_rate';
		 var post_data = {
							'transfertype'    : 'Point to Point Transfer',
						}
		 var promise = WebService.send_data( link,post_data);

		 promise.then(function(data){
			 $rootScope.All_cabs = data;
			 $rootScope.active_rateCard =  $rootScope.All_cabs.day;
			 $ionicLoading.hide();
		 });

	}

	 $scope.facebookLogin = function () {
      $cordovaOauth.facebook("415834555280405", ["email"]).then(function (result) {
        $scope.oauthResult = result;
				//alert(JSON.stringify($scope.oauthResult,null,4))
					WebService.show_loading();
				  $http.get("http://graph.facebook.com/v2.2/me", { params: { access_token: $scope.oauthResult.access_token, fields: "id,name,gender,picture", format: "json" }}).then(function(result) {
								$scope.profileData = result.data;
								$scope.social_login( $scope.profileData.id );
								//alert(JSON.stringify($scope.profileData,null,4))
						}, function(error1) {
								alert("There was a problem getting your profile.  Check the logs for details.");
								//console.log(error);
								//alert(JSON.stringify(error1,null,4))
						});



      }, function (error) {
        $scope.oauthResult = "OAUTH ERROR (see console)";
        console.log(error);
      });
    };
	 $scope.googleLogin = function () {

      $cordovaOauth.google("961941792261-65dbtr9khlc6auv8u9n78icmjtvbpj9h.apps.googleusercontent.com", ["http://www.googleapis.com/auth/urlshortener", "http://www.googleapis.com/auth/userinfo.email"]).then(function (result) {
        // $scope.oauthResult = result;
				alert(JSON.stringify( result ,null,4))
      }, function (error) {
        $scope.oauthResult = "OAUTH ERROR (see console)";
        console.log(error);
      });
    };


		$scope.social_login = function(user_name){
			//alert(user_name);

					 var link = 'social_login';
					 var post_data = {
										'Email'      : user_name ,
										'secret_key' : secret_key
									 }

					 // WebService.show_loading();

					 var promise = WebService.send_data( link,post_data);

					 promise.then(function(data){

						 $ionicLoading.hide();

						 if(data.status == 'success'){
								//alert(JSON.stringify(data));

							var user_data = {
																"User_name" : user_name,
																"token"			:	data.token
															};

							localStorage.setItem('user_data',JSON.stringify(user_data));

							$rootScope.user_data = JSON.parse( localStorage.getItem('user_data') );

							$state.go('app.landing', {}, {reload: true});

						 }

					 })
		}

});

