'use strict';

angular.module('App.SocialAuthGoogleService', [])
    .service('googleService', ['$rootScope', '$state', '$q', '$timeout', 'ApplicationConfig', '$window', 'Api', function ($rootScope, $state, $q, $timeout, ApplicationConfig, $window, Api) {
        var service = {
            auth2: null,
            actionRequired: false,
            isConnected: false,
            clickHandlerElements: [],
            statusChangeCallback: function(authResult) {
                // this.isConnected = (!!authResult);
                if (authResult) {
                    var authResponse = authResult.currentUser.get().getAuthResponse();
                    this.isConnected = !!authResponse.access_token;
                    var expiresIn = 1000 * parseInt(authResponse.expires_in); // may be used expires_at instead
                    var tm = new Date().getTime() + expiresIn;
                    // maybe access token is stored in authResponse.id_token
                    $rootScope.processSocialMedia('google', 'storeAccessToken', {token: authResponse.access_token, expiresIn: tm});
                    var userId = $rootScope.processSocialMedia('google', 'getUserId');
                    if (!userId) {
                        this.getUserInfo().then();
                    }
                    if (this.actionRequired) {
                        this.processRequest();
                    }
                } else if (!authResult || authResult['error'] || authResult.currentUser.get().getAuthResponse() == null) {
                    this.isConnected = false;
                    // The person is logged into Facebook, but not your app.
                } else {
                    this.isConnected = false;
                    // The person is not logged into Facebook, so we're not sure if
                    // they are logged into this app or not.
                }
            },
            _getLoginStatus: function() {
                var defered = $q.defer();
                var $this = this;
                
                var authResult = $window.gapi.auth2.getAuthInstance();
                $this.statusChangeCallback(authResult);
                if (this.isConnected) {
                    $timeout(function() { defered.resolve(); }, 0);
                } else {
                    $timeout(function() { defered.reject(); }, 0);
                }
                return defered.promise;
            },
            processRequest: function() {
                if (service.actionRequired && service.isConnected) {
                    var actReq = service.actionRequired;
                    service.actionRequired = false;
                    $rootScope.processSocialMedia('google', 'notifyStatus', 'connected');
                    $rootScope.processSocialMedia('google', 'processSocialRequest', actReq);
                }
            },
            reciveNotification: function() {
                
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
                var result = {
                }
                $window.gapi.client.plus.people.get({
                    'userId': 'me'
                }).then(function(resp) {
                    var r = resp.result;
                    if (r.id && r.emails && r.emails.length) {
                        $rootScope.processSocialMedia('google', 'storeUserId', r.id);
                        var x, email = null;
                        for (x = 0; x < r.emails.length; x++) {
                            if (r.emails[x].type == 'account') {
                                email = r.emails[x].value;
                                break;
                            }
                        }
                        email = email || r.emails[0].value;
                        
                        angular.extend(result, {first_name: r.name.givenName, last_name: r.name.familyName,
                                                email: email, remote_id: r.id});
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
                var accessToken = $rootScope.processSocialMedia('google', 'getAccessToken');
                if (!accessToken && $this.isConnected) {
                    $this._getLoginStatus().then(function() {
                        var accessToken2;
                        accessToken2 = $rootScope.processSocialMedia('google', 'getAccessToken');
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
                    provider: 'google',
                    provider_access_token: accessToken.access_token,
                    provider_secret: ''
                }
                if (options.remote_id) {
                    var userId = $rootScope.processSocialMedia('google', 'getUserId');
                    result.remote_id = userId;
                }
                return result;
            },
            getMissingFields: function() {
                return {location: 'optional', phone_number: 'optional'};
            },
            notifySignedIn: function() {
                if (service.auth2.isSignedIn.get()) {
                    var authInstance = $window.gapi.auth2.getAuthInstance();
                    service.statusChangeCallback(authInstance);
                } else {
                }
            },
            attachClickHandler: function(element) {
                this.clickHandlerElements.push([element, false]);
                if (this.auth2) {
                    this._attachClickHandlerToAll();
                }
            },
            _attachClickHandlerToAll: function() {
                var $this = this;
                angular.forEach(this.clickHandlerElements, function(el) {
                    if (!el[1]) {
                        $this.auth2.attachClickHandler(el[0], {'scope': 'profile email'}, $this.notifySignedIn)
                        el[1] = true;
                    }
                });
            },
            init: function() {
                var $this = this;
                var initFunc = function() {
                    $window.gapi.client.load('plus', 'v1').then(function() {
                        $window.gapi.auth2.init({fetch_basic_profile: false,
                            scope: ApplicationConfig.gapiScopes,
                            client_id: ApplicationConfig.gapiClientId
                            }).then(
                                function () {
                                    service.auth2 = $window.gapi.auth2.getAuthInstance();
                                    // service.auth2.isSignedIn.listen(service.notifySignedIn);
                                    service._attachClickHandlerToAll();
                                }, 
                                function() {
                                    // TODO: report error
                                }
                            );
                    });
                };
                if ($window.gapi.auth2) {
                    initFunc();
                } else {
                    $window.gapi.load('auth2', function() {
                        initFunc();
                    })
                }
            },
            logoutMe: function() {
                this.auth2 && this.auth2.disconnect();
            }
        }
        return service;
    }]);
