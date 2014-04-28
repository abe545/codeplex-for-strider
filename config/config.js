app.controller('CodeplexController', ['$scope', function ($scope) {
  $scope.config = $scope.providerConfig();

  $scope.save = function () {
    $scope.providerConfig($scope.config, function () {});
  };
}]);