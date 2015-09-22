angular.module('app',[]);

angular
  .module('app')
  .controller('historyController',historyController);

historyController.$inject = ['$scope','$http'];

function historyController($scope,$http) {
  var historyAnswers = {};
  var vm = this;
  $scope.data = {};
  vm.history = {};

  //Fetch the history questions
  $http.get('historyQuestions.json').then(function(response){
    vm.history.fields = angular.fromJson(response.data.payload);
  });
}