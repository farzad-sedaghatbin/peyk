App.controller('settingsCtrl', function ($scope, $http, $rootScope, $ionicModal, $timeout, $state, $ionicLoading, $ionicPopup, serv, WebService, $filter) {

  $scope.signUp = {};
  $scope.do_update = function (form) {
    WebService.startLoading();
    if (form.$valid
      && $scope.signUp.pwd == $scope.signUp.c_pwd
    ) {
      var url = "https://migmig.cfapps.io/api/1/changePassword";
      $http.post(url, $scope.signUp.pwd)
        .success(function () {
          $ionicPopup.alert({
            title: '<p class="text-center color-yellow">عملیات موفق</p>',
            template: "<p class='text-center color-gery'>" + $filter('langTranslate')("رمز عبور با موفقیت تغییر کرد", $rootScope.appConvertedLang['Password_successfully_updated']) + "</p>",
            scope: $scope
          });
          $scope.signUp.pwd = "";
          $scope.signUp.c_pwd = "";
          WebService.stopLoading();
        })
        .error(function (err) {
          $scope.signUp.pwd = "";
          $scope.signUp.c_pwd = "";
          WebService.myErrorHandler(err, false);
          WebService.stopLoading();
        });
    } else {
      form.pwd.$setDirty();
      WebService.stopLoading();
    }
  }
});
