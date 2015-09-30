'use strict';
angular.module('App.AppControllers', [])
 .run(['$rootScope', '$state', function($rootScope, $state) {
  $rootScope.state = $state;
  $rootScope.gapiLoaded = false;
  $rootScope.gapi = null;
}])
 .controller('ApplicationCtrl', ['Auth', '$scope', '$rootScope', '$http', '$timeout', 'Api', '$state', 'Helpers', function (Auth, $scope, $rootScope, $http, $timeout, Api, $state, Helpers) {
    $rootScope.contextClass = 'hp';
    $rootScope.fullContentClass = 'loading';
    $rootScope.fullMenuMode = false;
    angular.element('a[href="#"]').click(function() { return false; });
    angular.element(window).load(function() {
            $rootScope.$broadcast('pageFullyLoaded');
    });
    $rootScope.$on('pageFullyLoaded', function() {
        $rootScope.fullContentClass = 'loaded';
    });
    $rootScope.userAuthenticated = Auth.isAuth();
    $rootScope.currUser = null;
    $scope.runSomeApi = function() {
        Api.exec('articles.get_articles').then(function(data) {
            console.debug('retrieved articles', data);
        }, function(data, status) {
            console.debug('failed to load articles', data, status);
        });
    }
    $rootScope._messageIsShowing = false;
    $rootScope.messageIsShowing = function() { return $rootScope._messageIsShowing; }
    $rootScope.showMessage = function(title, message, type, callback, scope, params) {
        var messages = ($.isArray(message)) ? message : [message];
        $rootScope._messageIsShowing = true;
        params = params || {};
        $rootScope.messageBoxData = {
            messages: messages,
            parentScope: scope || $scope,
            rootScope: $rootScope,
            title: title,
            extraClass: params.extraClass || '',
            type: type || 'info',
            myStyle: {},
            closeMb: function() {
                this.rootScope._messageIsShowing = false;
                if (callback && typeof callback == 'function') {
                    callback(this.parentScope);
                    $timeout(function() {$rootScope.$apply()}, 0);
                }
            }
        };
        $rootScope._messageIsShowing = true;
        $timeout(function() {$rootScope.$apply()}, 0);
    }
    $rootScope.logout = function() {
        Auth.logOutUser();
        $state.go('base.home');
    }
    $rootScope.getCategories = function() {
        return ['photography', 'design', 'pop culture', 'video', 'technology', 'graphic', 'stories'];
    }
    $rootScope.processSocialMedia = function(provider, command, data) {
        /* some services cannot inject SocialAuth service because of circular depency problem */
        return Auth.runCommandSocialAuth(provider, command, data);
    }
    $rootScope.runAuthCommand = function(func) {
        /* some services cannot inject Auth service because of circular depency problem */
        return Auth[func].apply(Auth, Array.prototype.slice.call(arguments, 1));
    }
    $rootScope.footerTags = [{url: '#', name: 'Travel'}, {url: '#', name: 'Baikal'}, {url: '#', name: 'Lake'}, {url: '#', name: 'Trees'}, {url: '#', name: 'Vacation'}, {url: '#', name: 'Life'}, {url: '#', name: 'Trip'}, {url: '#', name: 'Visiting'}, {url: '#', name: 'Holiday'}, {url: '#', name: 'Water'}, {url: '#', name: 'Duck'}, {url: '#', name: 'Rest'}, {url: '#', name: 'Tourist'}, {url: '#', name: 'Tourism'}, {url: '#', name: 'Trip'}, {url: '#', name: 'Visiting'}, {url: '#', name: 'Crazy'}];

    $rootScope.getFooterTags = function() {
        return $rootScope.footerTags;
    }
    $rootScope.switchFullMenu = function() {
        $rootScope.fullMenuMode = !$rootScope.fullMenuMode;
        angular.element(document).scrollTop(0);
    }
    $rootScope.apicall = {params: '', endpoint: ''};
    $rootScope.callCustApi = function() {
        var params = null;
        try {
            params = JSON.parse($rootScope.apicall.params);
        } catch (err) {
            console.log('xx');
        }
        if (params) {
            Api.exec($rootScope.apicall.endpoint, params).then(function(data) {
                console.log(data);
            }, function() {
                console.log('xxx');
            });
        }
    }
    
}]);

