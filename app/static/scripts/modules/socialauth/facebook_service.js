'use strict';

window.fbAsyncInit = function() {
    window.FB.init({
        appId      : window.applicationConfig.facebookClientId,
        cookie     : true,  // enable cookies to allow the server to access 
                            // the session
        xfbml      : true,  // parse social plugins on this page
        version    : 'v2.2' // use version 2.2
    });

    // Now that we've initialized the JavaScript SDK, we call 
    // FB.getLoginStatus().  This function gets the state of the
    // person visiting this page and can return one of three states to
    // the callback you provide.  They can be:
    //
    // 1. Logged into your app ('connected')
    // 2. Logged into Facebook, but not your app ('not_authorized')
    // 3. Not logged into Facebook and can't tell if they are logged into
    //    your app or not.
    //
    // These three cases are handled in the callback function.

    window.FB.getLoginStatus(function(response) {
        processSocialMedia('facebook', 'statusChangeCallback', response)
        //$this.statusChangeCallback(response);
    });

}

angular.module('App.SocialAuthFacebookService', [])
    .service('facebookService', ['$rootScope', '$state', '$q', '$timeout', 'ApplicationConfig', '$window', 'Api', function ($rootScope, $state, $q, $timeout, ApplicationConfig, $window, Api) {
        var service = {
            actionRequired: false,
            isConnected: false,
            statusChangeCallback: function(response) {
                this.isConnected = (response.status == 'connected');
                if (response.status == 'connected') {
                    var expiresIn = 1000 * parseInt(response.authResponse.expiresIn); 
                    var tm = new Date().getTime() + expiresIn;
                    $rootScope.processSocialMedia('facebook', 'storeAccessToken', {token: response.authResponse.accessToken, expiresIn: tm});
                    $rootScope.processSocialMedia('facebook', 'storeUserId', response.authResponse.userID);
                    if (this.actionRequired) {
                        this.processRequest();
                        console.debug('executed from statusChangeCallback');
                    }
                } else if (response.status == 'not_authorized') {
                    // The person is logged into Facebook, but not your app.
                } else {
                    // The person is not logged into Facebook, so we're not sure if
                    // they are logged into this app or not.
                }
            },
            _getLoginStatus: function() {
                var defered = $q.defer();
                var $this = this;
                $window.FB.getLoginStatus(function(response) {
                    $this.statusChangeCallback(response);
                    if ($this.isConnected) {
                        defered.resolve();
                    } else {
                        defered.reject(response.status);
                    }
                });
                return defered.promise;
            },
            processRequest: function() {
                if (this.actionRequired && this.isConnected) {
                    $rootScope.processSocialMedia('facebook', 'notifyStatus', 'connected');
                    $rootScope.processSocialMedia('facebook', 'processSocialRequest', this.actionRequired);
                    this.actionRequired = false;
                }
            },
            reciveNotification: function() {
                var $this = this;
                var defered = $q.defer();
                $window.FB.getLoginStatus(function(response) {
                    $this.statusChangeCallback(response);
                    if (response.status == 'connected') {
                        defered.resolve('connected');
                    } else {
                        var statusTrans = {not_authorized: 'not_authorized'};
                        defered.reject(statusTrans[response.status] || 'disconnected');
                    }
                });
                return defered.promise;
            },
            getUserInfo: function() {
                var defered = $q.defer();
                var $this = this;
                $this._getValidAccesToken().then(function() {
                    $this._getUserData(defered);
                }, function() {
                    defered.reject();
                });
                return defered.promise;
            },
            _getUserData: function(defered) {
                $window.FB.api('/me?fields=first_name,last_name,email,id', function(r) {
                    var result = {
                    }
                    if (r.email && r.id) {
                        angular.extend(result, {first_name: r.first_name, last_name: r.last_name,
                                                email: r.email, remote_id: r.id});
                        defered.resolve(result);
                    } else {
                        defered.reject(result);
                    }
                });
            },
            requestAction: function(action) {
                this.actionRequired = action;
                this.processRequest();
            },
            _getValidAccesToken: function() {
                var defered = $q.defer();
                var $this = this;
                var accessToken = $rootScope.processSocialMedia('facebook', 'getAccessToken');
                if (!accessToken && $this.isConnected) {
                    $this._getLoginStatus().then(function() {
                        var accessToken2;
                        accessToken2 = $rootScope.processSocialMedia('facebook', 'getAccessToken');
                        if (accessToken2) {
                            defered.resolve(accessToken2);
                        } else {
                            defered.reject();
                        }
                    }, function() {
                        defered.reject();
                    });
                } else if (accessToken && $this.isConnected) {
                    $timeout(function() { defered.resolve(accessToken); }, 0);
                } else {
                    $timeout(function() { defered.reject(); }, 0);
                }
                return defered.promise;
            },
            getOauthObject: function(options) {
                var $this = this;
                var defered = $q.defer();
                this._getValidAccesToken().then(function(token) {
                    defered.resolve($this._constructOauthObject(token, options));
                }, function() {
                    defered.reject();
                });
                return defered.promise;
            },
            _constructOauthObject: function(accessToken, options) {
                options = options || {};
                var result = {
                    provider: 'facebook',
                    provider_access_token: accessToken.access_token,
                    provider_secret: ''
                }
                if (options.remote_id) {
                    var userId = $rootScope.processSocialMedia('facebook', 'getUserId');
                    result.remote_id = userId;
                }
                return result;
            },
            getMissingFields: function() {
                return {location: 'optional', phone_number: 'optional'};
            },
            logoutMe: function() {
            },
            fbLogin: function () {
                window.FB.login( function(response) {

                    if (response.authResponse) {
                        $rootScope.processSocialMedia('facebook', 'login');
                    }
                }, { scope: 'email,public_profile' } );
            }
        }
        return service;
    }]);
