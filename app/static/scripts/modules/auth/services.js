'use strict';
function initApis() {
    var rootScope = angular.element('body').scope().$root;
    rootScope.$apply(function(){
        rootScope.gapiLoaded = true;
    });
}
angular.module('App.AuthServices', [])
    .service('Auth', ['$http', '$rootScope', '$state', '$q', '$timeout', 'ApplicationConfig', '$window', 'Api', 'SocialAuth', function ($http, $rootScope, $state, $q, $timeout, ApplicationConfig, $window, Api, SocialAuth) {
        var userDetailKeys = ['first_name', 'last_name', 'is_publisher', 'email', 'email_verified', 'privacy'];
        var authKeys = ['access_token', 'expires_in', 'refresh_token', 'token_type'];
        var startApi = function() {
            var apisToLoad;
            var loadCallback = function() {
                if (--apisToLoad == 0) {
                    $rootScope.gapi = $window.gapi;
                    $rootScope.$broadcast('api_loaded');
                    signin(true, userAuthed);
                }
            };
            var apiList = ApplicationConfig.apiList;
            apisToLoad = apiList.length + 1; // must match number of calls to gapi.client.load()
            var defaultApiRoot = ApplicationConfig.apiRoot;
            var apiRoot;
            for (var x = 0; x < apiList.length; x++) {
                apiRoot = (apiList[x].length > 2) ? apiList[x][2] : defaultApiRoot;
                $window.gapi.client.load(apiList[x][0], apiList[x][1], loadCallback, apiRoot);
            }
            $window.gapi.client.load('oauth2', 'v2', loadCallback);
        }
        var signin = function(mode, authorizeCallback) {
            /*
            var SCOPES = ApplicationConfig.gapiScopes;
            var CLIENT_ID = ApplicationConfig.gapiClientId;
            $window.gapi.auth.authorize({client_id: CLIENT_ID,
            scope: SCOPES, immediate: mode},
            authorizeCallback);
            */
            authorizeCallback();
        }
        var userAuthed = function() {
            if (service._loginBySession()) {
                service._retrieveUserDetails();
            } else {
                $rootScope.$broadcast('retrievedUserDetails', false);
            }
            SocialAuth.initProviders();
        }
        var authUser = function() {
            var defered = $q.defer();
            var request =
                $window.gapi.client.oauth2.userinfo.get().execute(function(resp) {
                if (!resp.code) {
                    defered.resolve(resp);
                } else {
                    defered.reject(resp);
                }

            });
            return defered.promise;
        }
        $rootScope.$watch('gapiLoaded', function(val) {
            if (val) {
                
                startApi();
            }

        });
        var service = {
            _getToken: function() {
                return localStorage.getItem('auth_access_token');
            },
            _validToken: function() {
                var expiresIn = localStorage.getItem('auth_expires_in');
                var currTime = new Date().getTime();
                if (this._getToken() && expiresIn && currTime + 10000 < parseInt(expiresIn)) {
                    return parseInt(expiresIn) - currTime;
                }
                return 0;
            },
            isAuth: function() {
                if ($window.gapi && $window.gapi.auth.getToken()) {
                    return true;
                } else if ($window.gapi && this._validToken()) {
                    if (!$window.gapi.auth.getToken()) {
                        return this._loginBySession();
                    }
                    return true;
                }

                return this._validToken();
            },
            oauthLogin: function() {
                signin(false, this._authed);
            
            },
            _authed: function() {
                authUser().then(function(resp) {
                    console.debug('authed success:', resp);
                }, function(resp) {
                    console.debug('authed failed:', resp);
                });
            },
            logInUser: function(data, loginScope) {
                //access_token, expires_in, refresh_token, token_type
                return this._commonLoginUser('auth.login_user', data, loginScope);
            },
            socialLoginUser: function(provider, data, remote_id, loginScope) {
                var defered = $q.defer();
                this._commonLoginUser('auth.social_login_user', data, loginScope).then(function(dt) {
                    defered.resolve(dt)
                }, function(dt, resp) {
                    Api.exec('users.add_social_account', {
                        // TODO: apply remote_id
                        provider: provider, provider_access_token: data.provider_access_token,
                        provider_secret: null, remote_id: remote_id}).then(function(dt2) {
                            defered.resolve(dt2);
                        }, function(dt2, resp) {
                            defered.reject(dt2, resp);
                        });
                });
                
                return defered.promise;
            },
            _commonLoginUser: function(apiName, data, loginScope) {
                var defered = $q.defer();
                data.client = ApplicationConfig.apiClientId;
                data.client_secret = ApplicationConfig.apiClientSecret;
                data.scope = loginScope || 'articles';
                var $this = this;
                Api.exec(apiName, data).then(function(dt, resp) {
                    $this._setAuthSession(dt);
                    $this._loginBySession();
                    console.debug('login succeeded', data, resp);
                    $this._retrieveUserDetails();
                    $rootScope.$broadcast('userLogIn', true);
                    defered.resolve(dt);
                }, function(dt, resp) {
                    defered.reject(dt, resp);
                    $rootScope.$broadcast('userLogIn', false);
                    console.debug('login failed', dt, resp);
                });
                return defered.promise;
            },
            registerUser: function(data) {
                return this._commonRegisterUser('users.add_user', data);
            },
            registerSocialUser: function(provider, data) {
                var defered = $q.defer();
                var $this = this;
                SocialAuth.createRegistrationData(provider, data).then(function(dt2) {
                    $this._commonRegisterUser('users.add_social_user', dt2).then(function(dt3, resp) {
                        defered.resolve(dt3, resp);
                    }, function(dt3, errors, resp) {
                        defered.reject(dt3, errors, resp);
                    });
                }, function() {
                    defered.reject({}, ['Could not connect yo social provider'], null);
                });
                return defered.promise;
            },
            _commonRegisterUser: function(apiName, data) {
                var defered = $q.defer();
                Api.exec(apiName, data).then(function(dt, resp) {
                    defered.resolve(dt, resp);
                }, function(dt, resp) {
                    var errors = Api.getAllErrorMessages(dt);
                    defered.reject(dt, errors, resp);
                });
                return defered.promise;
            },
            _retrieveUserDetails: function() {
                var $this = this;
                if ($this._isUserDataValid()) {
                    $rootScope.$broadcast('retrievedUserDetails', 'from_cache');
                    return;
                }
                $this._retrieveUserDetailsPromise().then(function(data) {
                    $rootScope.$broadcast('retrievedUserDetails', true);
                }, function(data, status) {
                    $rootScope.$broadcast('retrievedUserDetails', false);
                });

            },
            _retrieveUserDetailsPromise: function() {
                var defered = $q.defer();
                var $this = this;
                Api.exec('users.get_current_user').then(function(data) {
                    $this._setUserData(data);
                    defered.resolve(data);
                }, function(data, status) {
                    console.debug('users.get_current_user: something went wrong');
                    defered.reject(data, status);
                });
                return defered.promise;
            },
            _isUserDataValid: function() {
                var expiresIn = parseInt(localStorage.getItem('user_expires_in') || 0);
                var tm = new Date().getTime();
                return expiresIn > tm;
            },
            _setUserData: function(data) {
                angular.forEach(userDetailKeys, function(val) {
                    localStorage.setItem('user_' + val, data.result[val]);
                });
                var tm = new Date().getTime() + 3 * 3600000;
                localStorage.setItem('user_expires_in', tm);
            },
            getUserInfo: function() {
                var defered = $q.defer();
                var $this = this;
                if (!this._validToken()) {
                    $timeout(function() {defered.reject({}); }, 0);
                    return defered.promise;
                }
                if (this._isUserDataValid()) {
                    $timeout(function() {
                        var data = $this._userInfoFromCache();
                        defered.resolve(data); 
                    }, 0);
                    
                } else {
                    this._retrieveUserDetailsPromise().then(function() {
                        var data = $this._userInfoFromCache();
                        defered.resolve(data);
                    }, function() {
                        defered.reject({});
                    });
                }
                return defered.promise;
            },
            _userInfoFromCache: function() {
                var result = {};
                angular.forEach(userDetailKeys, function(key) {
                    result[key] = localStorage.getItem('user_' + key);
                });
                return result;
            },
            _setAuthSession: function(data) {
                var curr_time = new Date().getTime();
                for (var k in data.result) {
                    localStorage.setItem('auth_' + k, data.result[k]);
                };
                localStorage.setItem('auth_expires_in', parseInt(data.result.expires_in) * 1000 + curr_time);
            },
            _loginBySession: function() {
                var result = false;
                var validTokenTime = this._validToken();
                if (validTokenTime) {
                    var currAuthToken = gapi.auth.getToken();
                    currAuthToken = (currAuthToken) ? currAuthToken.access_token : null;
                    var currToken = this._getToken();
                    if (!currAuthToken || currAuthToken != currToken) {
                        gapi.auth.setToken({access_token: currToken});
                    }
                    if (validTokenTime < 3 * 3600000) {
                        this._refreshToken();
                    }
                    result = !!gapi.auth.getToken();
                }
                $rootScope.$broadcast('userAuthenticated', result);
                return result;
            },
            logOutUser: function() {
                angular.forEach(userDetailKeys, function(item) {
                    localStorage.removeItem('user_' + item);
                });
                localStorage.removeItem('user_expires_in');
                angular.forEach(authKeys, function(item) {
                    localStorage.removeItem('auth_' + item);
                });
                SocialAuth.logout();
                $window.gapi.auth.setToken(null);
                $rootScope.$broadcast('loggedOut');
            },
            _refreshTokenPromise: function(tokenScope) {
                var refresh_token = localStorage.getItem('auth_refresh_token');
                if (!refresh_token) {
                    var defered = $q.defer();
                    $timeout(function() { defered.reject({}); }, 0);
                    return defered.promise;
                }
                var $this = this;
                return Api.exec('auth.refresh_access_token', {
                    refresh_token: refresh_token,
                    client: ApplicationConfig.apiClientId,
                    client_secret: ApplicationConfig.apiClientSecret,
                    scope: tokenScope || 'articles'});
            }, 
            _refreshToken: function(tokenScope) {
                var $this = this;
                this._refreshTokenPromise(tokenScope).then(function(data) {
                    $this._setAuthSession(data);
                    gapi.auth.setToken({access_token: data.result.access_token});
                }, function(data, status) {
                    $this.logOutUser();
                })
            },
            runCommandSocialAuth: function(provider, command, data) {
                return SocialAuth.runCommand(provider, command, data);
            },
            storeCurrentState: function() {
                var currLoc = {state_name: $state.$current.name};
                var k;
                for (k in $state.$current.params) {
                    currLoc['state_param__' + k] = $state.$current.params[k];
                }
                for (k in currLoc) {
                    localStorage.setItem('stored_state_' + k, currLoc[k]);
                }

            },
            restorePreviousState: function(goHome) {
                var k, result = {}, params = {};
                for (k in localStorage) {
                    if (k.indexOf('stored_state_') === 0) {
                        result[k.substr(('stored_state_').length)] = localStorage.getItem(k);
                        localStorage.removeItem(k);
                    }
                }
                for (k in result) {
                    if (k.indexOf('state_param__') === 0) {
                        params[k.substr(('state_param__').length)] = result[k];
                    }
                }
                if (result.state_name) {
                    $state.go(result.state_name, params);
                } else if (goHome !== false) {
                    $state.go('base.home');
                }
            }
        }
        return service;
    }]);
