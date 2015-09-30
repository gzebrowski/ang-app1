'use strict';

angular.module('App.AppServices', [])
    .service('Server', ['$http', '$rootScope', '$state', '$q', '$timeout', 'Auth', function ($http, $rootScope, $state, $q, $timeout, Auth) {
        var apiRoot = '/_ah/api/';
        var applyHeaders = function(p) {
            if (Auth.isAuth()) {
                p.headers = {'Authorization': 'Beaver ' + Auth.getToken()};
            }
        }
        var prepareUrl = function(url, params) {
            var finalurl = apiRoot + url + '/' + ((params) ? '?' + params : '');
            return finalurl.replace('//', '/');
        }
        var sendReq = function(httpParams) {
            var promiseObj = $q.defer();
            applyHeaders(httpParams);
            $http(httpParams)
                .success(function(data, status, headers, request) {
                    promiseObj.resolve(data);
                })
                .error(function(data, status, headers, config) {
                    if (status === 401) {
                        //
                    }
                    promiseObj.reject(data, status, headers);
                    $rootScope.$broadcast('httpError', status);
                });
            return promiseObj.promise;
        }
        var service = {
            get: function (url, params) {
                var finalurl = prepareUrl(url, params);
                var p = {method:'GET', url: finalurl};
                return sendReq(p);
            },
            post: function (url, data, params) {
                var finalurl = prepareUrl(url, params);
                var p = {method:'POST', url: finalurl, data: data};
                return sendReq(p);
              },

            put: function(url, data, params) {
                var finalurl = prepareUrl(url, params);
                var p = {method: 'PUT', url: finalurl, data: data};
                return sendReq(p);
            },
            'delete': function(url) {
                var finalurl = prepareUrl(url);
                var p = {method:'DELETE', url: finalurl};
                return sendReq(p);
            }
        }
        return service;
    }])
    .service('Api', ['$rootScope', '$q', function($rootScope, $q) {

        var service = {
            queue: [],
            exec: function(apiname, params, _defered) {
                var result;
                if (typeof params == "undefined") {
                    params = {};
                }
                if (!$rootScope.gapi && !_defered) {
                    var defered = $q.defer();
                    console.debug('pushing to queue');
                    this.queue.push([apiname, params, defered]);
                    return defered.promise;
                }
                var p, obj, parts = apiname.split('.');
                obj = $rootScope.gapi.client;
                for (p = 0; p < parts.length; p++) {
                    obj = obj[parts[p]];
                    if (!obj) { console.debug('returns false', parts[p]); return false; }
                }
                result = obj(params);
                if (_defered) {
                    result.then(function() {
                        _defered.resolve.apply(null, arguments);
                    }, function() {
                        _defered.reject.apply(null, arguments);
                    });
                    return;
                }
                return result;
            },
            client: ($rootScope.gapi) ? $rootScope.gapi.client : null,
            getAllErrorMessages: function(data) {
                var errMessages = [];
                var errors = [];
                try {
                    errors = data.result.error.errors;
                } catch (err) {
                    errors = [];
                }
                angular.forEach(errors, function(item) {
                    errMessages.push(item.message || '');
                });
                return errMessages;
            }
            
        };

        $rootScope.$on('userAuthenticated', function(val) {
            if (val && service.queue.length) {
                var x, el;
                while (service.queue.length) {
                    el = service.queue.splice(0, 1);
                    console.debug('executing from queue', el);
                    service.exec(el[0][0], el[0][1], el[0][2]);
                }
            }
        });
        return service;
    }])
    .service('Helpers', ['$rootScope', function($rootScope) {
        var onResizeFunc = function() {
            var width = service.documentWidth();
            var oldThreshold = lastThreshold;
            var currThreshold = service.findThreshold();
            if (oldThreshold != currThreshold) {
                $rootScope.$broadcast('responsiveStyleChanged', oldThreshold, currThreshold, width);
            }
            currentWindowWidth = width;
            lastThreshold = currThreshold;
            $rootScope.$broadcast('widthChanged', width, oldThreshold, currThreshold);
            $rootScope.$apply();
        };
        var _get_win_width = function() {
            
        }
        var respThresholds = [1800, 1600, 1280, 1000, 768];
        var service = {
            findThreshold: function() {
                var x;

                for (x = 0; x < respThresholds.length; x++) {
                    if (window.matchMedia('(min-width: ' + (respThresholds[x] + 1) + 'px)').matches) {
                        return respThresholds[x];
                    }
                }
                return respThresholds[respThresholds.length - 1];
            },
            documentWidth: function() {
                return Math.min(angular.element(document).width(), angular.element(window).width());
            },
            emitResize: function() {
                onResizeFunc();
            }
        }
        var currentWindowWidth = service.documentWidth(), lastThreshold = service.findThreshold();
        angular.element(window).resize(onResizeFunc);
        return service;
    
    }]);
