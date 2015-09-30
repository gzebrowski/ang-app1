'use strict';

angular.module('App.AuthDirectives', [])
  .directive('errorLabel', ['$parse', function($parse){

    return {
        restrict: 'A',
        link: function(scope, element, attr) {
            var form = element.closest('form');
            if (!form.length || !form.attr('name') || !attr.name) {
                return;
            }
            scope.$watch(form.attr('name') + '.' + attr.name + '.$valid', function(val) {
                if (!val) {
                    element.before( '<div class="error-label" for-name="' + attr.name + '">' + attr.errorLabel + '</div>' );
                } else {
                    form.find('.error-label[for-name=' + attr.name + ']').remove();
                }
            });
        }
    }
  }])
  .directive('errorElement', ['$parse', function($parse){

    return {
        restrict: 'A',
        link: function(scope, element, attr) {
            var form = element.closest('form');
            if (!form.length || !form.attr('name') || !attr.forName) {
                return;
            }
            element.addClass('hidden');
            var messageSet ={'default': attr.errorElement}, typeErrors = {};
            if (attr.errorElement && attr.errorElement.indexOf('{') == 0) {
                
                try {
                    messageSet = scope.$eval(attr.errorElement);
                    if (typeof messageSet != 'object') {
                        messageSet['default'] = attr.errorElement;
                    }
                }
                catch(err) {
                    messageSet['default'] = attr.errorElement;
                }
            }
            var typeError;
            scope.$watch(form.attr('name') + '.' + attr.forName + '.$error', function(val) {
                var errList = [], e;
                if (!$parse(form.attr('name') + '.' + attr.forName + '.$valid')(scope)) {
                    typeErrors = $parse(form.attr('name') + '.' + attr.forName + '.$error')(scope);
                    for (e in typeErrors) {
                        messageSet[e] && errList.push(messageSet[e]);
                    }
                    if (!errList.length) {
                        errList.push(messageSet['default']);
                    }
                    var ulel = $('<ul />');
                    angular.forEach(errList, function(item) {
                        ulel.append($('<li>').text(item));
                    });
                    var wrapper = $('<div />').append(ulel);
                    element.removeClass('hidden').html(wrapper.contents());
                } else {
                    element.addClass('hidden').html('');
                }
            }, true);
        }
    }
  }])
.directive('getGeolocation', ['$parse', '$timeout', function($parse, $timeout){

    return {
        restrict: 'EA',
        templateUrl: '/static/views/partials/auth/share_location_message.html',
        scope: {
            messageShareLocation: '@',
            messageThankYou: '@',
            position: '=assignTo'
        },
        link: function(scope, element, attr) {
            if (!navigator.geolocation) {
                return;
            }
            scope.showThankYou = false;
            navigator.geolocation.getCurrentPosition(function(position) {
                console.debug('shared', position);
                var loc = {lat: position.coords.latitude, lon: position.coords.longitude};
                // var assignTo = attr.assignTo || attr.getGeolocation;
                // $parse(assignTo).assign(scope, loc);
                scope.position = {lat: position.coords.latitude, lon: position.coords.longitude};
                scope.showThankYou = true;
                
                $timeout(function() {
                    scope.$apply(); 
                }, 0);
            });

        }
    }
  }])

.directive('initApp', ['ApplicationConfig', function(config) {
    return {
        template: '<script src="//apis.google.com/js/client.js?onload=initApis"></script>',

    };
}])
.directive('validCondition', ['$parse', function($parse) {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function(scope, el, attrs, c) {
            scope.$watch(attrs.validCondition, function(val) {
                var k, cond = scope.$eval(attrs.validCondition);
                for (k in cond) {
                    c.$setValidity(k, !cond[k]);
                }
            });
        }
    }
}])
.directive('animateMe', ['$timeout', function($timeout) {
    return {
        restrict: 'A',
        link: function(scope, el, attrs) {
            $timeout(function() { el.addClass(attrs.animateMe); }, 0);
        }
    }
}])
.directive('socialRegisterPage', ['$timeout', '$state', '$stateParams', '$rootScope', 'SocialAuth', function($timeout, $state, $stateParams, $rootScope, SocialAuth) {
    return {
        restrict: 'E',
        templateUrl: '/static/views/partials/auth/socialregisterpage.html',
        link: function(scope, el, attrs) {
            var provider = $stateParams.provider;
            if (SocialAuth.providerExists(provider)) {
                scope.missingFields = SocialAuth.runCommand(provider, 'getMissingFields');
            }
        }
    }
}]);


