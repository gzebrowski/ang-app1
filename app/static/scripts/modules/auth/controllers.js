'use strict';

angular.module('App.AuthControllers', [])
  .controller('AuthController', ['$scope', '$rootScope', 'Server', 'Auth', 'Api', 'ApplicationConfig', '$timeout', '$state', '$stateParams', function($scope, $rootScope, Server, Auth, Api, ApplicationConfig, $timeout, $state, $stateParams){
    $scope.registration_extra = {location: null};
    $scope.registration = {};
    $scope.registerFormShowErrors = false;
    $scope.registrationInProgress = false;
    $scope.registerUser = function() {
        // TODO: after testing create common code for registerUser and registerSocialUser
        $scope.registrationInProgress = true;
        $scope.registerFormShowErrors = true;
        if ($scope.registrationform.$valid) {
            if ($scope.registration_extra.location) {
                $scope.registration.lat = $scope.registration_extra.location.lat;
                $scope.registration.lon = $scope.registration_extra.location.lon;
            }
            Auth.registerUser($scope.registration).then(function(data, resp) {
                $scope.showMessage('Thank you', [], 'info', function(scope) {}, $scope)
            }, function(data, errors, resp) {
                if (errors && errors.length) {
                    $scope.showMessage('Registration failed', errors, 'error', function(scope) {}, $scope);
                }
                $scope.registrationInProgress = false;
            });
        } else {
            $scope.showMessage('Invalid form', ['Please fill up all required fields'], 'error', function(scope) {}, $scope);
            $scope.registrationInProgress = false;
        }
    }
    $scope.loginOauth = function() {
        Auth.oauthLogin();
    }
    $scope.login = {};
    $scope.appLogin = function() {
        var data = $scope.login;
        Auth.logInUser($scope.login).then(function(data) {
            $timeout(function() { $scope.$apply()}, 0);
            $state.go('base.home');
        }, function(data, stat) {
            alert('auth failed');
        });
    }
    $scope.registerSocialUser = function() {
        // TODO: after testing create common code for registerUser and registerSocialUser
        $scope.registrationInProgress = true;
        $scope.registerFormShowErrors = true;
        if ($scope.registrationform.$valid) {
            if ($scope.registration_extra.location) {
                $scope.registration.lat = $scope.registration_extra.location.lat;
                $scope.registration.lon = $scope.registration_extra.location.lon;
            }
            Auth.registerSocialUser($stateParams.provider, $scope.registration).then(function(data, resp) {
                $scope.showMessage('Thank you', [], 'info', function(scope) {}, $scope)
            }, function(data, errors, resp) {
                if (errors && errors.length) {
                    $scope.showMessage('Registration failed', errors, 'error', function(scope) {}, $scope);
                }
                $scope.registrationInProgress = false;
            });
        } else {
            $scope.showMessage('Invalid form', ['Please fill up all required fields'], 'error', function(scope) {}, $scope);
            $scope.registrationInProgress = false;
        }
    }
    $scope.$on('retrievedUserDetails', function(scope, val) {
        $rootScope.userAuthenticated = !!val;
        Auth.getUserInfo().then(function(data) {
            $rootScope.currUser = {avatar: 'static/img/per1.jpg', username: data.first_name, userlocation: 'Wasington DC',
            friends: [{avatar: 'static/img/per2.jpg', username: 'Alex', time: 2, url: '/api/user/1', activityType: 'Left comment on', activityDetails: "Islam isn't a religion? A Teacher's Pamphlet Makes"},
                      {avatar: 'static/img/per3.jpg', username: 'Samantha', time: 4, url: '/api/user/1', activityType: 'Favourited a story', activityDetails: "South Carolina shooting sheds doubt on police    "},
                      {avatar: 'static/img/per4.jpg', username: 'Elif', time: 12, url: '/api/user/1', activityType: 'Embeded a quote from', activityDetails: "100 facts about Billie Holiday's life and legacy"},
                      {avatar: 'static/img/per5.jpg', username: 'Laura', time: 14, url: '/api/user/1', activityType: 'Followed topic', activityDetails: "#Nemtsov + #Killed"},
                      
                      ]};
            });
    });
    /*
    $rootScope.$on('userLogIn', function(val) {
    });
    $rootScope.$on('userAuthenticated', function(val) {
    });
    */
    $scope.$on('loggedOut', function(val) {
        $rootScope.userAuthenticated = false;
        $rootScope.currUser = {avatar: '', username: '', userlocation: '', friends: []};
    });
    
}]);
/*
{
 "email": "",
 "first_name": "",
 "last_name": "",
 "password": "",
 phone_number
 lat
 lon
 oauth
 privacy: enum {PRIVATE: 0, PUBLIC: 1}
 
}
*/