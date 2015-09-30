'use strict';

angular.module('App.Router', [])
  .config(['$urlRouterProvider', '$stateProvider', '$locationProvider', function($urlRouterProvider, $stateProvider, $locationProvider) {
    // Run in HTML5 mode so we get pretty urls like /dashboard instead of /#/dashboard
    $locationProvider.html5Mode(false);

    // For any unmatched url, redirect to /hp
    $urlRouterProvider.otherwise('/');
    var needRedirection = function() {
        return location.pathname && location.pathname.length > 1;
    }
    var checkAuthentication = ['Auth', '$rootScope', '$state', '$timeout', function(Auth, $rootScope, state, $timeout){
        if (!Auth.isAuth()) {
            if (!needRedirection()) {
                //$timeout(function() {state.go('main.loginpage');}, 0);
            }
            return false;
        }
        return true;
    }];
    var checkAnonymous = ['Auth', '$rootScope', '$state', '$timeout', function(Auth, $rootScope, state, $timeout){
        if (Auth.isAuth()) {
            if (!needRedirection()) {
                $timeout(function() {state.go('base.home');}, 0);
            }
            return false;
        }
        return true;
    }];
    var checkDbg = ['$state', '$timeout', function(state, $timeout) {
        if (!window.isDbgMode) {
            $timeout(function() {state.go('base.home');}, 0);
        }
    }];
    var checkProvider = ['SocialAuth', '$stateParams', '$state', '$timeout', function(SocialAuth, $stateParams, state, $timeout) {
        if (!SocialAuth.providerExists($stateParams.provider)) {
            $timeout(function() {state.go('base.home');}, 0);
            return false;
        }
        
        return true;
    }];
    var fixPath = ['$window', function($window) {
        var urlParts = location.href.split('#')[0];
        urlParts = urlParts.split('?');
        if (needRedirection()) {
            var finalPath = location.protocol + '//' + location.host + '#' + location.pathname;
            finalPath += (urlParts.length > 1) ? '?' + urlParts[1] : '';
            location.href = finalPath;
            return false;
        }
        return true;
    }];
    
    $stateProvider
      .state('main', {
        abstract: true,
        data:{
          title: ''
        },
        views:{
          '':{
            templateUrl: '/static/views/main.html'
          },
          'header@main':{
            templateUrl: '/static/views/partials/common/header.html'
          },
          'footer@main':{
            templateUrl: '/static/views/partials/common/footer.html'
          }
        }
      })
      .state('main.registerpage', {
        url: '/auth/register',
        resolve: {
            isAnonymous: checkAnonymous
        },
        templateUrl: '/static/views/partials/auth/registerpage.html',
        controller: 'AuthController'
      })
      .state('main.loginpage', {
        url: '/auth/login',
        resolve: {
            isAnonymous: checkAnonymous
        },
        templateUrl: '/static/views/partials/auth/loginpage.html',
        controller: 'AuthController'
      })
      .state('main.socialregisterpage', {
        url: '/auth/register/{provider:[a-z]+}/',
        resolve: {
            isAnonymous: checkAnonymous,
            providerExists: checkProvider
        },
        template: '<social-register-page></social-register-page>',
        controller: 'AuthController'
      })
      .state('main.socialresponse', {
        url: '/auth/soc-resp/{provider:[a-z]+}/',
        resolve: {
            isAnonymous: checkAnonymous,
            providerExists: checkProvider
        },
        template: '<social-response></social-response>',
        controller: 'AuthController'
      })
      
      .state('base', {
        abstract: true,
        data:{
          title: ''
        },
        views:{
          '':{
            templateUrl: '/static/views/main.html'
          },
          'header@base':{
            templateUrl: '/static/views/partials/common/header.html'
          },
          'footer@base': {
            templateUrl: '/static/views/partials/common/footer.html'
          }
        },
        resolve: {
            _fp: fixPath,
            isAuthenticated: checkAuthentication
        }
      })
      

      // Home
        .state('base.home', {
        url: '/',
        data: {
          title: 'MGA Home'
        },
        templateUrl: '/static/views/partials/home/main_content.html',
        controller: 'HomeController'
      })
        .state('base.api_caller', {
        url: '/callapi',
        resolve: {
            isdbg: checkDbg
        },
        templateUrl: '/static/views/partials/app/callapi.html',
        controller: 'ApplicationCtrl'
      })
}]);