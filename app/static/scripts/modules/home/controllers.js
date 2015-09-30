'use strict';


angular.module('App.HomeControllers', [])
 .controller('HomeController', function($scope) {
    $scope.topArticles = [
            {
              image: "/static/img/head_1.jpg",
              title: "Hillary Clinton's Solar Power Expansion Plan",
              summary: "Here's How Much It Could Lay on the Taxpayer",
              url: "#"
            },
            {
              image: "/static/img/head_2.jpg",
              title: "Bernie Endorsed by Apple",
              summary: "It looks like at least one tech giant ovner is feeling the Bern",
              url: "#"
            },
            {
              image: "/static/img/head_3.jpg",
              title: "McDonalds Just Annouced New Menu",
              summary: "So say goodbye to the old familiar recipes",
              url: "#"
            },
            {
              image: "/static/img/head_4.jpg",
              title: "Marine Asking Ronda Rousey to Be His Date",
              summary: "U.S. Marine Jarrod Haschert is a brave man.",
              url: "#"
            },
            {
              image: "/static/img/head_5.jpg",
              title: "New Anti-IRS Sign is so Rand Paul",
              summary: "Here's other Merchanidise he Should Get.",
              url: "#"
            },
            {
              image: "/static/img/head_6.jpg",
              title: "Aurora Theater Shooting May Have Been Stopped?",
              summary: "A New Report Revals What Campus Police Knew...",
              url: "#"
            },
            {
              image: "/static/img/head_7.jpg",
              title: "App That Lets You Take A Selfie With Rand Paul",
              summary: "The Internet Proves Why That Was A Bad Idea",
              url: "#"
            }
        ];
    $scope.getTopArticles = function() {
        return $scope.topArticles;
    }
});
