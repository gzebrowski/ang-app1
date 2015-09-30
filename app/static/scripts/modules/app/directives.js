"use strict";
angular.module('App.AppDirectives', [])
.directive('messageBox', function() {
    
    return {
        scope: {data: '=mbData'},
        templateUrl: '/static/views/partials/app/message_box.html',
        link: function(scope, element, attr) {
            console.debug('executed messageBox link', scope);
        }
    };
}).filter('default', function() {
  return function(input, defValue) {
    return (input) ? input : defValue;
  };
})
.directive('fullMenu', function() {
    return {
        templateUrl: '/static/views/partials/full_menu.html',
        link: function(scope, element, attr) {
        }
    };
})
.directive('hScrollMenu', [function() {
    return {
        link: function(scope, element, attr) {

            var startPos = null,
                isMoving = false,
                initialLeft = null,
                currLeft = null;
            var isTouchDevice = function () {
                try {
                    document.createEvent("TouchEvent");
                    return true;
                } catch(e) {
                    return false;
                }
            };
            if (isTouchDevice()) {
                return;
            }
            var el = (attr.hScrollMenu) ? element.find(attr.hScrollMenu) : element;
            initialLeft = el.offset().left;
            element.on("touchstart", function(ev) {
                var e = ev.originalEvent;
                startPos = e.touches[0].pageX;
                isMoving = true;
                currLeft = el.offset().left;
            }).on("touchmove", function(ev) {
                if (isMoving) {
                    
                    
                    var width = el.width();
                    var parentWidth = el.parent().width();
                    var maxOffset = width - parentWidth;
                    var e = ev.originalEvent;
                    var movement = e.touches[0].pageX - startPos;
                    el.css('left', Math.min(initialLeft, Math.max(-maxOffset, currLeft + movement)));
                }
            }).on("touchend", function(ev) {
                isMoving = false;
            });
        }
    };
    
}])
.directive('jsCopyContent', function() {
    return {
        restrict: 'A',
        link: function(scope, element, attr) {
            element.html(angular.element(attr.jsCopyContent).html());
        }
    }
})
.directive('addLoadingBox', function() {
    return {
        restrict: 'A',
        link: function(scope, element, attr) {
            //$('.main-slider')
            element.prepend('<div class="loading-box hide-after-load"><div class="wrapper"><span class="ico"></span></div></div>');
        }
    };
})
.directive('scrollHandler', [function() {
    return {
        restrict: 'A',
        link: function(scope, element, attr) {
            
            var documentScrollTop = $(document).scrollTop();
            var userParams;
            try {
                userParams = scope.$eval(attr.scrollHandler);
            } catch(e) {
                console.error('scrollHandler: errors while parsing attributes');
                return;
            }
            if (typeof userParams != 'object' || !userParams.threshold  || !userParams['cls']) {
                console.error('invalid parameters object');
                return;
            }
            var params = {thresholdType: 'min', dir: 'any'};
            angular.extend(params, userParams);
            $(document).scroll(function() { 
                var curentTop = $(document).scrollTop();
                var dirFactor = 1, dirNeg = 'up';
                var fn = 'removeClass';
                if (params.thresholdType == 'max') {
                    dirFactor = -1;
                    dirNeg = 'down'
                }
                if (curentTop * dirFactor > params.threshold * dirFactor) {
                    fn = 'addClass';
                    if (params.dir == dirNeg && (dirFactor * documentScrollTop < dirFactor * curentTop)) {
                        fn = 'removeClass';
                    }
                }
                element[fn](params.cls);
                documentScrollTop = curentTop;
            }).scroll();
        }
    };
}])
.directive('dynFitImage', ['$rootScope', function($rootScope) {
    return {
        restrict: 'AC',
        link: function(scope, element, attr) {
            var onloadfn = function(element) {
                if (element.is('.loaded')) {
                    return;
                }
                var containerWidth = element.width(),
                    containerHeight = element.height();
                if (!containerWidth || !containerHeight) {
                    return;
                }
                
                element.find('img').css(
                    {width: '100%', height: '100%'});
                element.addClass('loaded');
            }
            var fixImages = function(element, restart) {
                element.removeClass('loaded').each(function() {
                    if (!restart) {
                        element.find('img').on('load', function() {onloadfn(element)});
                    }
                    onloadfn(element);
                });
            }
            fixImages(element);
            $rootScope.$on('responsiveStyleChanged', function(event, oldThreshold, currThreshold) {
                fixImages(element, true);
            });
        }
    };
}])
;