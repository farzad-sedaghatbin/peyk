
 App.service('WebService', function( $http, $q, $ionicLoading,$cordovaToast,$ionicPopup){

	/* SIGN UP
	===========================================*/
	 this.upload = function( link,img_el,post_data ){

		// $.mobile.loading('show');
		var url = base_url + link ;
		var result = null;

		var deferred = $q.defer();

		var img = document.getElementById(img_el);
		var imageURI = img.src;

			var options = new FileUploadOptions();
			options.fileKey="file";
			options.fileName=imageURI.substr(imageURI.lastIndexOf('/')+1);
			options.mimeType="image/jpeg";
			// var params = new Object();
			// params.value1 = "test";
			// params.value2 = "param";

			options.params = post_data;
			options.chunkedMode = false;
			var ft = new FileTransfer();

			ft.upload(imageURI, url,
			function(r){
				deferred.resolve(r.response);
			}, function(error){
				alert("An error has occurred: Code::: = " + error.code);


			}, options);

		return deferred.promise;
	  //alert(result);
	 }

	 /* SEND DATA
	  ===============================================*/
	 this.send_data = function( link , post_data ){
			var self = this;

			var deferred = $q.defer();
			 var result = null;
				/* WP
        --------------------------------------*/
            if( wordpress == true){

                var url = base_url ;



                post_data.action = link;


                 $.ajax({
                  type: "POST",
                  url: url,
                  data: post_data,
                  success: function(data){
                     // alert(JSON.stringify(data));
                    deferred.resolve(data);
                  },
                  dataType: "json"
                });




            }
			else{

					var url = base_url + link;
					var req = {
						 method: 'POST',
						 url: url,
						 data: post_data
					}


					$http(req).then(
						function (data){
							 //alert(JSON.stringify(data.data));
							deferred.resolve(data.data);
						},function (error){
							/*
							alert(error.status +" "+ error.statusText);
							// alert(JSON.stringify(error,null,4));
							if(error.status == 404){
								alert("Sorry! Server not responding (404)");
							}
							else{
								alert('sorry! an error occured');
							}
							*/
							// self.remove_loading();
							$ionicLoading.hide();
							deferred.reject();
						}
					);
			}



		  return deferred.promise;
		 }

	this.show_loading = function(){

			$ionicLoading.show({
          content: 'Loading',
          showBackdrop: false
      });

	 }
   this.myErrorHandler = function (err, isFromLogin) {
     if (err == 401 || err.status == 401) {
       if (isFromLogin) {
         $ionicPopup.alert({
           title: '<span class="myText">پیام</span>',
           template: '<div class="myText" style="font-size: 24px;padding-bottom: 10px;direction: rtl;text-align: right">نام کاربری یا رمز عبور اشتباه می باشد</div>'
         });
       } else {
         delete $http.defaults.headers.common.Authorization;
         $ionicPopup.alert({
           title: '<span class="myText">پیام</span>',
           template: '<div class="myText" style="font-size: 24px;padding-bottom: 10px;direction: rtl;text-align: right">لطفا مجددا اطلاعات حساب خود را وارد نمایید</div>'
         });
       }
       $(".popup").css("width", "90%");
     } else if (err && err.status == 0) {
       if (window.navigator.onLine) {
         $cordovaToast.showShortBottom('ارتباط با سرور قطع میباشد. لحظاتی دیگر مجددا تلاش کنید');
       } else {
         $cordovaToast.showShortBottom('لطفا اتصال اینترنت خود را بررسی کنید');
       }
     } else if (err && err.status == 418) {
       $ionicPopup.alert({
         title: '<span class="myText">بروزرسانی</span>',
         template: '<div class="myText" style="font-size: 24px;padding-bottom: 10px;direction: rtl;text-align: right">لطفا اپلیکیشن خود را بروزرسانی کنید</div>'
         //content: 'Hello World!!!'
       }).then(function (res) {
         navigator.app.exitApp();
       });
       $(".popup").css("width", "90%");
       //$(".popup-buttons").css("display", "none");
     } else {
       $cordovaToast.showShortBottom('خطا در ارتباط با سرور');
     }
   }

   this.handleMyLocationError = function (mes1, mes2) {
     cordova.plugins.diagnostic.isLocationEnabled(function (enabled) {
       var m;
       if (!enabled) {
         if (mes1) {
           m = mes1;
         } else {
           m = "لطفا دسترسی به موقعیت جغرافیایی خود را روشن کنید";
         }
       } else {
         if (mes2) {
           m = mes2;
         } else {
           m = "لطفا موقعیت جغرافیایی خود را روی only gps قرار دهید";
         }
       }
       if (ionic.Platform.isAndroid()) {
         $ionicPopup.show({
           template: '<div class="myText" style="text-align: right;direction: rtl">' + m + '</div>',
           buttons: [
             {
               text: '<b>قبول</b>',
               type: 'button-positive',
               onTap: function (e) {
                 cordova.plugins.diagnostic.switchToLocationSettings();
               }
             },
             {text: 'لغو'}
           ]
         });
         $(".popup").css("width", "90%");
       } else {
         $cordovaToast.showShortBottom(m);
       }
     }, function (error) {
       $cordovaToast.showShortBottom("لطفا موقعیت جغرافیایی خود را روشن کنید و یا اگر روشن است آنرا در حالت gps only قرار دهید");
     });
   };
   this.startLoading = function () {
     $ionicLoading.show({
       showBackdrop: true,
       hideOnStateChange: false
     });
   };
   this.stopLoading = function () {
     $ionicLoading.hide();
   };
 })

 App.service('authHttpResponseInterceptor',['$q',function($q){
   return {
     responseError: function(rejection) {
       if (rejection.status === 401) {
         throw 401;
       }
       return $q.reject(rejection);
     }
   }
 }]);
