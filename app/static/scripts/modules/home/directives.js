'use strict';

angular.module('App.HomeDirectives', [])
.directive('createMainSlider', ['$parse', 'Helpers', '$timeout', function($parse, Helpers, $timeout) {
    return {
        restrict: 'AE',
        templateUrl: '/static/views/partials/home/main_slider.html',
        link: function(scope, element, attr) {
            var currentWindowWidth = Helpers.documentWidth();
            
            var highlightsSliderObj, mainSliderObj;
            
            var mainSliderParams = {
                nextSelector: '.main-slider .btn-next',
                prevSelector: '.main-slider .btn-prev',
                pager: false,
                nextText: '',
                prevText: '',
                mode: 'fade',
                onSlideBefore: function($slideElement) {
                    mainSliderObj.__$_myqueue.isSliding = true;
                },
                onSlideAfter: function($slideElement) {
                    mainSliderObj.__$_myqueue.isSliding = false;
                    if (mainSliderObj.__$_myqueue.upToDateIdx !== null) {
                        mainSliderObj.goToSlide(parseInt(mainSliderObj.__$_myqueue.upToDateIdx));
                        mainSliderObj.__$_myqueue.upToDateIdx = null;
                    }
                }
            };
            var highlightsSliderParams = {
                maxSlides: 5,
                pager: false,
                prevSelector: '.the-highlights .btn-prev',
                nextSelector: '.the-highlights .btn-next',
                nextText: '',
                prevText: '',
                moveSlides: 2
                
            }

            
            var setRelativeParam = function(obj, param, value, width) {
                var th = Helpers.findThreshold(width);
                obj[param] = value * th / 1280;
                return obj;
            }

            var prepareHighlightsSliderParams = function(currThreshold, width) {
                width = width || Helpers.documentWidth();
                currThreshold = currThreshold || Helpers.findThreshold();
                var result = $.extend({}, highlightsSliderParams);
                if (currThreshold < 1000) {
                    //setRelativeParam(result, 'slideHeight', 265 * 1280 / 768, width);
                    result.mode = 'vertical';
                    result.maxSlides = 4;
                    result.minSlides = 4;
                } else {
                    setRelativeParam(result, 'slideWidth', 210, width);
                }
                return result;
            }
            scope.$on('responsiveStyleChanged', function(event, oldThreshold, currThreshold, width) {
                mainSliderObj.reloadSlider(mainSliderParams);
                var hlghParams = prepareHighlightsSliderParams(currThreshold, width);
                highlightsSliderObj.reloadSlider(hlghParams);
            });
            $timeout(function() {
                element.find('.the-highlights .item-list > li').each(function(idx) {
                    $(this).attr('data-myidx', idx);
                });
                Helpers.emitResize();
                mainSliderObj = $('.main-slider .slider-container').bxSlider(mainSliderParams);
                mainSliderObj.__$_myqueue = {upToDateIdx: null, isSliding: false};
                
                highlightsSliderObj = $('.the-highlights .slider .item-list')
                  .bxSlider(prepareHighlightsSliderParams());
                
                $('.the-highlights .item-list li').hover(function() {
                    $('.the-highlights .item-list li').removeClass('active');
                    $(this).addClass('active');
                    var idx = $(this).data('myidx');
                    if (mainSliderObj.__$_myqueue.isSliding) {
                        mainSliderObj.__$_myqueue.upToDateIdx = idx;
                    } else {
                        mainSliderObj.goToSlide(parseInt(idx));
                    }
                });
            }, 0);
            
        }
    }

}]);

