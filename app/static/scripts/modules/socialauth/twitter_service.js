'use strict';

angular.module('App.SocialAuthTwitterService', [])
    .service('twitterService', ['$rootScope', '$state', '$q', '$timeout', 'ApplicationConfig', '$window', 'Api', '$location', function ($rootScope, $state, $q, $timeout, ApplicationConfig, $window, Api, $location) {
        var service = {
            auth2: null,
            actionRequired: false,
            isConnected: false,
            clickHandlerElements: [],
            processRequest: function() {
                if (service.actionRequired && service.isConnected) {
                    var actReq = service.actionRequired;
                    service.actionRequired = false;
                    $rootScope.processSocialMedia('twitter', 'notifyStatus', 'connected');
                    $rootScope.processSocialMedia('twitter', 'processSocialRequest', actReq);
                }
            },
            reciveNotification: function() {
                
            },
            getUserInfo: function() {
                var defered = $q.defer();
                var $this = this;
                var accessToken = $rootScope.processSocialMedia('twitter', 'getAccessToken');
                if (accessToken) {
                    $timeout(function() { $this._getUserData(defered); }, 0);
                } else {
                    $timeout(function() { defered.reject();}, 0);
                }
                return defered.promise;
            },
            _getUserData: function(defered) {
                var result = {
                }
                var r = $rootScope.processSocialMedia('twitter', 'getData');
                var remoteId = $rootScope.processSocialMedia('twitter', 'getUserId');
                if (!remoteId) {
                    defered.reject();
                    return;
                }
                angular.extend(result, {first_name: r.first_name, last_name: r.last_name,
                                        email: '', remote_id: remoteId});
                defered.resolve(result);
            },
            requestAction: function(action) {
                this.actionRequired = action;
                $rootScope.processSocialMedia('twitter', 'storeData', {action_required: action});
                $rootScope.runAuthCommand('storeCurrentState');
                Api.exec('users.social_media_get_request_token', {provider: 'twitter'})
                    .then(function(data) {
                        var dt = {request_token: data.result.request_token,
                                  request_token_secret: data.result.request_token_secret,
                                  datahash: data.result.datahash};
                        $rootScope.processSocialMedia('twitter', 'setSocialRequestTokens', dt);
                        location.href = data.result.redirect_url;
                    }, function(data, status) {
                        console.error('wrong response from backend :(');
                    });
                
            },
            storeUserData: function(data) {
                $rootScope.processSocialMedia('twitter', 'storeAccessToken', {
                    token: data.access_token,
                    tokenSecret: data.access_token_secret,
                    expiresIn: 0
                });
                $rootScope.processSocialMedia('twitter', 'storeUserId', data.remote_id);
                var extraData = {first_name: data.first_name, last_name: data.last_name,
                                 datahash: data.datahash, username: data.username};
                $rootScope.processSocialMedia('twitter', 'storeData', extraData);
                var twitterData = $rootScope.processSocialMedia('twitter', 'getData');
                if (twitterData.action_required) {
                    this.actionRequired = twitterData.action_required;
                    $rootScope.processSocialMedia('twitter', 'storeData', {action_required: null});
                }
                service.isConnected = true;
                service.processRequest();
                
            },
            getResponseParam: function(paramName) {
                //http://www.testgz.pl/?oauth_token=65JSkAAAAAAAhY1rAAABT6jBWlg&oauth_verifier=v82SijvVhg8yHBnfHwTwx7jrlJ7ondU4
                var loc = $location.url();
                loc = loc.split('?');
                if (loc.length != 2) {
                    return null;
                }
                var params = loc[1].split('&');
                params = params.filter(function(val) { return val.indexOf(paramName + '=') == 0});
                if (params.length != 1) {
                    return null;
                }
                var result = params[0].split('=')[1];
                return decodeURIComponent(result);
            },
            getOauthObject: function(options) {
                var $this = this;
                var defered = $q.defer();
                var accessToken = $rootScope.processSocialMedia('twitter', 'getAccessToken');
                if (accessToken) {
                    $timeout(function() { 
                        defered.resolve($this._constructOauthObject(accessToken, options));
                    }, 0);
                } else {
                    $timeout(function() { defered.reject(); }, 0);
                }
                return defered.promise;
            },
            _constructOauthObject: function(accessToken, options) {
                options = options || {};
                var result = {
                    provider: 'twitter',
                    provider_access_token: accessToken.access_token,
                    provider_secret: accessToken.access_token_secret
                }
                if (options.remote_id) {
                    var userId = $rootScope.processSocialMedia('twitter', 'getUserId');
                    result.remote_id = userId;
                }
                return result;
            },
            getMissingFields: function() {
                return {location: 'optional', phone_number: 'optional', email: 'reqired'};
            },
            attachClickHandler: function(element) {
            },
            logoutMe: function() {
            }
        }
        return service;
    }]);
