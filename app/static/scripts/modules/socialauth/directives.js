'use strict';

angular.module('App.SocialAuthDirectives', [])
.directive('parseFbOnFly', ['$window', '$timeout', function($window, $timeout) {
    return {
        restrict: 'AE',
        link: function(scope, el, attrs) {
            try {
                $timeout(function() { $window.FB && $window.FB.XFBML && $window.FB.XFBML.parse(); }, 0);
            }catch(ex) {
            }
        }
    }
}])
.directive('attachClickHandler', ['$window', '$timeout', 'SocialAuth', function($window, $timeout, SocialAuth) {
    return {
        restrict: 'AE',
        link: function(scope, el, attrs) {
            $timeout(function() {SocialAuth.runCommand(attrs.attachClickHandler, 'attachClickHandler', el[0]);}, 0);
        }
    }
}])
.directive('socialResponse', ['$window', '$timeout', 'SocialAuth', 'Api', '$stateParams', '$state', '$rootScope', function($window, $timeout, SocialAuth, Api, $stateParams, $state, $rootScope) {
    return {
        restrict: 'E',
        link: function(scope, el, attrs) {
            var provider = $stateParams.provider;
            if (SocialAuth.providerExists(provider)) {
                var reqTokens = SocialAuth.getSocialRequestTokens(provider);
                var oauth_verifier = SocialAuth.runCommand(provider, 'getResponseParam', 'oauth_verifier');
                var data = {provider: provider, request_token: reqTokens.request_token,
                            request_token_secret: reqTokens.request_token_secret,
                            oauth_verifier: oauth_verifier, datahash: reqTokens.datahash};
                            
                Api.exec('users.social_media_get_access_token', data).then(function(dt) {
                    SocialAuth.runCommand(provider, 'storeUserData', dt.result);
                }, function(dt, status) {
                    console.error('socialResponse directive', dt, status);
                });
            }
            
        }
    }
}]);