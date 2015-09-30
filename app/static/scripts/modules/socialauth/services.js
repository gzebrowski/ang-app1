'use strict';
function processSocialMedia(provider, command, data) {
    var rootScope = angular.element('body').scope().$root;
    rootScope.$apply(function(){
        rootScope.processSocialMedia(provider, command, data);
    });
}
(function(angular) {
    var anotations = ['$http', '$rootScope', '$state', '$q', '$timeout', 'ApplicationConfig', '$window', 'Api'];
    angular.forEach(window.applicationConfig.socialMedias, function(item) {
        anotations.push(item + 'Service');
    });
    var func = function() {
        var argno = 0;
        var $http = arguments[argno++], 
            $rootScope = arguments[argno++],
            $state = arguments[argno++],
            $q = arguments[argno++],
            $timeout = arguments[argno++],
            ApplicationConfig = arguments[argno++],
            $window = arguments[argno++],
            Api = arguments[argno++],
            socialApps = {};
        var x;
        for (x = 0; x < ApplicationConfig.socialMedias.length; x++) {
            socialApps[ApplicationConfig.socialMedias[x]] = arguments[argno++];
        };
        var service = {
            currentAction: null,
            providerExists: function(name) {
                return !!socialApps[name];
            },
            storeAccessToken: function(provider, data) {
                localStorage.setItem(provider + '_token', data.token);
                localStorage.setItem(provider + '_token_secret', data.tokenSecret || '');
                localStorage.setItem(provider + '_expires_in', data.expiresIn);
            },
            storeUserId: function(provider, userId) {
                localStorage.setItem(provider + '_user_id', userId);
            },
            storeData: function(provider, data) {
                var k;
                for (k in data) {
                    localStorage.setItem(provider + '_data_' + k, data[k]);
                }
            },
            getData: function(provider, data) {
                var k, result = {};
                for (k in localStorage) {
                    if (k.indexOf(provider + '_data_') === 0) {
                        result[k.substr((provider + '_data_').length)] = localStorage.getItem(k);
                    }
                }
                return result;
            },
            getAccessToken: function(provider) {
                var token = {access_token: localStorage.getItem(provider + '_token'),
                             access_token_secret: localStorage.getItem(provider + '_token_secret')};
                var expiresIn = localStorage.getItem(provider + '_expires_in');
                var tm = new Date().getTime() + 5000;
                if (token.access_token && (expiresIn == 0 || (expiresIn && expiresIn > tm))) {
                    return token;
                }
                return null;
            },
            getUserId: function(provider) {
                if (this.getAccessToken(provider)) {
                    return localStorage.getItem(provider + '_user_id');
                }
                return null;
            },
            notifyStatus: function(provider, status) {
                if (status == 'connected') {
                    socialApps[provider].getUserInfo().then(function(params) {
                        console.debug('retrieved params from', provider, params);
                    }, function(data) {
                        console.debug('something went wrong with getUserInfo for ', provider, data); 
                    });
                }
            },
            runCommand: function(provider, command, data) {
                if (provider && socialApps[provider] && socialApps[provider][command]) {
                    return socialApps[provider][command](data);
                } else if (this[command]) {
                    return this[command](provider, data);
                }
            },
            register: function(provider) {
                socialApps[provider].requestAction('register');
            },
            login: function(provider) {
                socialApps[provider].requestAction('login');
            },
            processSocialRequest: function(provider, action) {
                this.currentAction = action;
                var $this = this;
                if (action == 'login') {
                    socialApps[provider].getOauthObject().then(function(obj) {
                        var userId = $this.getUserId(provider);
                        $rootScope.runAuthCommand('socialLoginUser', provider, obj, userId).then(function(data) {
                            $timeout(function() { $rootScope.$apply()}, 0);
                            $state.go('base.home');
                        }, function(data, status) {
                            console.debug('social auth login failed', data, status);
                            alert('social auth login failed');
                        });
                    }, function(data) {
                        console.debug('couldnt get oauth object', data);
                    });
                    
                } else if (action == 'register') {
                    $state.go('main.socialregisterpage', {provider: provider});
                }
            },
            createRegistrationData: function(provider, formData) {
                var defered = $q.defer();
                var data = {};
                socialApps[provider].getOauthObject({remote_id: true}).then(function(oauthObj) {
                    socialApps[provider].getUserInfo().then(function(userData) {
                        var keys = ['email', 'first_name', 'last_name', 'lat', 'lon', 'phone_number'];
                        angular.forEach(keys, function(key) {
                            if (userData[key]) {
                                data[key] = userData[key];
                            }
                        });
                        var missingFields = socialApps[provider].getMissingFields();
                        angular.forEach(missingFields, function(value, key) {
                            if (key == 'location') {
                                data.lon = formData.lon;
                                data.lat = formData.lat;
                            } else {
                                data[key] = formData[key];
                            }
                        });
                        data.oauth = [oauthObj];
                        defered.resolve(data);
                    }, function() {
                        defered.reject(data);
                    });
                    
                }, function() {
                    defered.reject(data);
                });
                return defered.promise;
            },
            initProviders: function() {
                var provider;
                for (provider in socialApps) {
                    socialApps[provider].init && socialApps[provider].init();
                }
            },
            logout: function() {
                var provider;
                for (provider in socialApps) {
                    socialApps[provider].logoutMe();
                    var keys = ['_token', '_expires_in', '_token_secret', '_user_id'];
                    angular.forEach(keys, function(item) {
                        localStorage.getItem(provider + item) && localStorage.removeItem(provider + item);
                    });
                }
            },
            getSocialRequestTokens: function(provider) {
                return {
                    request_token: localStorage.getItem(provider + '_request_token'),
                    request_token_secret: localStorage.getItem(provider + '_request_token_secret'),
                    datahash: localStorage.getItem(provider + '_datahash')
                }
            },
            setSocialRequestTokens: function(provider, data) {
                    localStorage.setItem(provider + '_request_token', data.request_token);
                    localStorage.setItem(provider + '_request_token_secret', data.request_token_secret);
                    localStorage.setItem(provider + '_datahash', data.datahash);
            }
        };
        return service;
    }
    anotations.push(func);
    angular.module('App.SocialAuthServices', []).service('SocialAuth', anotations);
})(window.angular);