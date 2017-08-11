angular.module('HMS')
    .controller('NavController', function (baseURL, $cookies, constructionFactory, $filter, $http, $rootScope, supplierFactory, $state, $stateParams, $scope, $uibModal, userFactory, mySweetAlert) {

        $scope.getDateFormat = function (timestamp) {
            return new Date(timestamp);
        };

        if (!$cookies.get('googleToken'))
            $state.go('login');
        $scope.logOut = function () {
            $cookies.remove('googleToken');
            $state.go('login');
        };
        userFactory.getUser().then(function (cache) {
            $scope.user = cache;
        });
		constructionFactory.get().then(function (cache) {
			$scope.constructions = cache;
		});
		supplierFactory.get().then(function (cache) {
			$scope.suppliers = cache;
		});
        if ($state.current.name === 'home')
            $scope.stateName = 'Home';
        else
			constructionFactory.getById($stateParams.construction_id)
                .then(function (constructions) {
                    $scope.stateName = constructions[0].name;
                    $scope.modifiedDate = constructions[0].updated_at;
                });
                
        $scope.allConstructions = function () {
            $uibModal.open({
                templateUrl: 'views/modals/allConstructions.html',
                size: 'lg',
                scope: $scope
            });
        };
        $scope.searchConstruction = function(input){
            $rootScope.recentConstructions = $filter('filter')($scope.constructions, {name:input});
            $rootScope.hasSearchResult = true;
        }
        $scope.addConstruction = function () {
            $scope.construction = null;
            $scope.action = "Tạo mới";
            $scope.names = $scope.constructions.map(function (con) {
                return con.name;
            });
            $uibModal.open({
                templateUrl: 'views/modals/constructionModal.html',
                scope: $scope
            }).result.then(function (construction) {
                $uibModal.open({
                    templateUrl: 'views/modals/loadingModal.html',
                    scope: $scope,
                    size: 'md'
                });

                // table 'constructions' doesn't have supplier column (just supplier_id)
                construction.supplier_id = construction.supplier.id;
                delete construction.supplier;
                constructionFactory.post(construction).then(function (construction) {
                    $state.go('construction', {construction_id: construction.id, name: construction.name});
                });
            });
        };
        $scope.editConstruction = function () {
            $scope.action = "Cập nhật";
			if ($stateParams.construction_id) {
                $scope.construction = $scope.constructions.filter(function (con) {
					return con.id == $stateParams.construction_id;
				})[0];

				$scope.names = $scope.constructions.map(function (con) {
                    if (con.id !== $scope.construction.id)
                        return con.name;
                });

				$scope.construction.supplier = $scope.suppliers.filter(function (supp) {
                        return supp.id == $scope.construction.supplier_id;
                    })[0];
                
                $uibModal.open({
                    templateUrl: 'views/modals/constructionModal.html',
                    scope: $scope
                }).result.then(function (construction) {
                    $scope.stateName = construction.name;

                    construction.supplier_id = construction.supplier.id;
                    $http.post(baseURL + 'construction/' + construction.id,
                        {construction: construction}).then(function () {
                        $scope.constructions.forEach(function (con, i) {
                            if (con.id == construction.id) {
                                construction.updated_at = new Date();
                                $scope.constructions[i] = construction;
                                $scope.recentConstructions = $scope.constructions.sort(function (a, b) {
                                    return new Date(b.updated_at) - new Date(a.updated_at);
                                }).slice(0, 4);
                            }
                            $scope.modifiedDate = construction.updated_at;
                        });
                    });
                });
            }
        };
        $scope.removeConstruction = function (construction_id) {          
            swal(
                mySweetAlert.getType("warning","Tất cả hạng mục sẽ bị xóa theo"),
                function(isConfirm){
                    if (isConfirm) {
                        $scope.showConstructions = false;
                        constructionFactory.delete(construction_id).then(function () {
                            $scope.showConstructions = true;
                        });
                        $scope.constructions = $scope.constructions.filter(function (con) {
                            return con.id !== construction_id;
                        });
                        $scope.recentConstructions = $scope.constructions.sort(function (a, b) {
                            return new Date(b.updated_at) - new Date(a.updated_at);
                        }).slice(0, 4);
                    }
                }
            );          
            
        }
        $scope.deleteUser = function () {
            swal(
                mySweetAlert.getType("warning","Tất cả thông tin và công trình của bạn sẽ bị xóa theo"),
                function(isConfirm){
                    if (isConfirm) {
                        userFactory.deleteUser().then(function(response) {
                            $scope.logOut();
                        });
                    }
                }
            );
        };
        $scope.exportToGoogleSheet = function() {
            console.log($rootScope.construction_id);
            console.log($rootScope.category_id);
            if ($rootScope.construction_id && $rootScope.category_id) {
                modal = $uibModal.open({
                        templateUrl: 'views/modals/exportLoadingModal.html',
                        scope: $scope,
                        size: 'md'
                    });
                $http.get(baseURL + 'export?construction_id=' + $rootScope.construction_id + '&category_id=' +$rootScope.category_id)
                .then(function(response) {
                    window.open(
                      'https://docs.google.com/spreadsheets/d/' + response.data,
                      '_blank' // <- This is what makes it open in a new window.
                    );
                    $rootScope.hasInternetError = false;
                    modal.close();
                }, function(error) {
                    $rootScope.hasInternetError = true;
                    setTimeout(function() { 
                      $rootScope.hasInternetError = false;
                      modal.close();
                    }, 3000);
                });
            }
        };

        $scope.exportConstructionToRedmine = function() {
            if ($rootScope.construction_id) {
                modal = $uibModal.open({
                        templateUrl: 'views/modals/redmine/exportLoadingModal.html',
                        scope: $scope,
                        size: 'md'
                    });
                $http.post(baseURL + 'redmine/construction', {construction_id: $rootScope.construction_id})
                .then(function(response) {
                    $rootScope.hasInternetError = false;
                    modal.close();
                }, function(error) {
                    $rootScope.hasInternetError = true;
                    setTimeout(function() { 
                      $rootScope.hasInternetError = false;
                      modal.close();
                    }, 3000);
                });
            }
        };

        $scope.exportCategoryToRedmine = function() {
            if ($rootScope.category_id) {
                modal = $uibModal.open({
                        templateUrl: 'views/modals/redmine/exportLoadingModal.html',
                        scope: $scope,
                        size: 'md'
                    });
                $http.post(baseURL + 'redmine/category', {category_id: $rootScope.category_id})
                .then(function(response) {
                    $rootScope.hasInternetError = false;
                    modal.close();
                }, function(error) {
                    $rootScope.hasInternetError = true;
                    setTimeout(function() { 
                      $rootScope.hasInternetError = false;
                      modal.close();
                    }, 3000);
                });
            }
        };

        $scope.initRedmine = function() {
            $scope.redmineInit = {
                step: 1,
                nextStep: function() {
                    this.step++;
                },
                previousStep: function() {
                    this.step--;
                }
            };
            $uibModal.open({
                templateUrl: 'views/modals/redmine/redmineInitModal.html',
                scope: $scope
            }).result.then(function (redmineSetting) {
                console.log(redmineSetting);
            });
        };

        $scope.configRedmine = function() {
            $uibModal.open({
                templateUrl: 'views/modals/redmine/redmineSettingsModal.html',
                scope: $scope
            }).result.then(function (redmineSetting) {
                console.log(redmineSetting);
            });
        };
    });
