"use strict";

window.app = angular.module('App',
  [
    'ui.router',
    'App.Router',
    'App.AppControllers',
    'App.AppServices',
    'App.AppDirectives',
    'App.HomeControllers',
    'App.HomeDirectives',
    'App.AuthServices',
    'App.AuthControllers',
    'App.AuthDirectives',
    'App.AppPartials',
    'App.SocialAuthServices',
    'App.SocialAuthDirectives',
    'App.SocialAuthFacebookService',
    'App.SocialAuthGoogleService',
    'App.SocialAuthTwitterService'
  ])
.constant('ApplicationConfig', window.applicationConfig)
.config(['$interpolateProvider', function($interpolateProvider) {
  $interpolateProvider.startSymbol('{!');
  $interpolateProvider.endSymbol('!}');
}]);
