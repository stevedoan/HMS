angular.module('HMS', ['ui.router', 'ui.bootstrap', 'ngCookies', 'ui.bootstrap.contextMenu', 'anguFixedHeaderTable'])
    .constant("baseURL", "http://localhost/HMS/public/")
    .config(function ($stateProvider, $urlRouterProvider) {
        $urlRouterProvider.otherwise('/');
        $stateProvider
            .state('login', {
                url: '/login/:token',
                views: {
                    'content': {
                        templateUrl: 'views/login.html',
                        controller: 'LoginController'
                    }
                }
            })
            .state('home', {
                url: '/',
                views: {
                    'nav': {
                        templateUrl: 'views/nav.html',
                        controller: 'NavController'
                    },
                    'content': {
                        templateUrl: 'views/home.html',
                        controller: 'HomeController'
                    }
                }
            })
            .state('construction', {
                url: '/construction/:construction_id',
                views: {
                    'nav': {
                        templateUrl: 'views/nav.html',
                        controller: 'NavController'
                    },
                    'categories': {
                        templateUrl: 'views/workplace/categories.html',
                        controller: 'CategoriesController'
                    }
                },
                params: {
                    name: null
                }
            })
            .state('construction.category', {
                url: '/category/:category_id',
                views: {
                    'tabs@': {
                        templateUrl: 'views/workplace/tabs.html',
                        controller: 'TabsController'
                    }
                }

            })
            .state('construction.category.table', {
                url: '/',
                views: {
                    'table@': {
                        templateUrl: function ($stateParams) {
                            return 'views/workplace/tables/' + $stateParams.table + 'Table.html';
                        },
                        controllerProvider: function ($stateParams) {
                            return $stateParams.table + 'TableController';
                        }
                    }
                },
                params: {
                    table: 'estimate'
                }
            })
    });
  