angular.module('app', ['formly', 'formlyBootstrap']);


angular
  .module('app')
  .directive('dynamiclistDirective',function() {
    return {
      templateUrl: 'dynamiclist-directive.html'
    };
  });



angular
  .module('app')
  .config(function(formlyConfigProvider){
    var unique = 1;
    formlyConfigProvider.setType({
      name: 'dynamicList',
      templateUrl: 'dynamiclist-directive_.html',
      controller: function($scope) {
        $scope.addNewField= addNewField;
        $scope.copyFields = copyFields;

        function copyFields(fields) {
              fields = angular.copy(fields);
              addRandomIds(fields);
              return fields;
        }

        function addNewField(fields) {
          // $scope.model[$scope.options.key] = $scope.model[$scope.options.key] || [];
          // var repeatsection = $scope.model[$scope.options.key];
          // var lastSection = repeatsection[repeatsection.length - 1];
          // var newsection = {};
          // if (lastSection) {
          //   newsection = angular.copy(lastSection);
          // }
          // repeatsection.push(newsection);
          $scope.model[$scope.options.key] = $scope.model[$scope.options.key] || []
          var repeatsection = $scope.model[$scope.options.key];
          $scope.model['sub_1_2'] = repeatsection;
        }

        function addRandomIds(fields) {
          unique++;
          angular.forEach(fields, function(field, index) {
            if (field.fieldGroup) {
              addRandomIds(field.fieldGroup);
              return; // fieldGroups don't need an ID
            }

            if (field.templateOptions && field.templateOptions.fields) {
              addRandomIds(field.templateOptions.fields);
            }

            field.id = field.id || (field.key + '_' + index + '_' + unique + getRandomInt(0, 9999));
          });
        }

        function getRandomInt(min, max) {
          return Math.floor(Math.random() * (max - min)) + min;
        }
      }
    });
  });


angular
  .module('app')
  .controller('formsController',formsController);

formsController.$inject = ['$scope','$http','$timeout'];


function formsController ($scope,$http,$timeout) {
var vm = this;
vm.historyFields=[];
vm.model={};
vm.questionTypes = [];
vm.patientHistory = {};





vm.generateAnswerModel = function () {
  vm.patientHistory = {};
  angular.forEach(vm.model, function(value, key) {
    var questionID = !isNaN(parseInt(key)) ? parseInt(key) :null ;
    if(questionID  !== null ) {
      var index = getQuestionTypeIndex(questionID,vm.questionTypes);
      var questionType = vm.questionTypes[index].questionType;
      if(!vm.patientHistory.hasOwnProperty(questionType)) {
          vm.patientHistory[questionType] = [];
      }
      vm.patientHistory[questionType].push({
        questionID : questionID,
        aComponent : getAComponent(vm.questionTypes[index],vm.model)
      });
  } else {

  }
  });
  console.log(vm.patientHistory);
};


vm.addNewDynamicField = function() {
  $timeout(function(){

  var index = null;
  angular.forEach(vm.historyFields, function(field, key){
    if(field['key'] === 'sub_1_0') {
      index = key;
      return;
    }
  });

  var historyField = vm.historyFields[index];
  console.log(historyField);
  var field = {
    key : "sub_1_2",
    type : "input"
  };
  historyField.templateOptions.fields.push(field);
  });
};


$http.get('historyQuestions.json').then(function(response) {
  var historyQuestions = angular.fromJson(response.data.payload);
  angular.forEach(historyQuestions, function(value, key) {
    var questionType = value;
    var subHeadingField = {
      key : key,
      template: '<h2>'+ key + '</h2>'
    };
    vm.historyFields.push(subHeadingField);
    angular.forEach(questionType, function(question, key) {
      var questionDetails = {};
      questionDetails.questionID = question.questionID;
      questionDetails.questionType = question.questionType;
      questionDetails.qComponentType = question.qcomponent.type;
      if(questionDetails.qComponentType == 'RADIOBUTTON') {
        angular.forEach(question.qcomponent.choices, function(value, key){
          if(value.subComponent) {
            questionDetails.qsubComponentType= [];
            angular.forEach(value.subComponent, function(value, key){
              questionDetails.qsubComponentType.push(value.type);
            });
          }
        });
      }

      vm.questionTypes.push(questionDetails);// question.questionType;

      var fields = getFields(question);
      vm.historyFields.push.apply(vm.historyFields,fields);
    });
  });
});


function getFields(question) {
  var fields = [];
  var qComponentType = getType(question.qcomponent.type);
  if(qComponentType !== 'checkbox' && qComponentType !== 'radio' && qComponentType !== 'dynamicList' ) {
    var field = {
        key : question.questionID,
        type : qComponentType,
        templateOptions : {
          label : question.questionID + '-' + question.qcomponent.labelValue
        }
    };
    fields.push(field);
  } else if (qComponentType === 'checkbox' && question.qcomponent.checkBoxOptions === undefined) {
    angular.forEach(question.qcomponent.checkBoxOptions, function(checkbox, key) {
      var checkBoxField = {
        key: question.questionID,
        type : qComponentType,
        templateOptions: {
          label : question.questionID + '-' + checkbox.labelValue
        }
      };
      fields.push(checkBoxField);
    });
  } else if(qComponentType === 'checkbox' && question.qcomponent.checkBoxOptions) {

    var multiCheckBoxField= {
      key: question.questionID,
      type: 'multiCheckbox',
      templateOptions:{
        label: question.questionID + '-' + question.qcomponent.labelValue,
        options : question.qcomponent.checkBoxOptions,
        valueProp: 'labelKey',
        labelProp: 'labelValue'
      }
    };
    fields.push(multiCheckBoxField);
  } else if(qComponentType === 'radio') {
    var options = [];
    var radioField = {
      key: question.questionID,
      type : qComponentType,
      templateOptions: {
        label : question.questionID + '-' + question.qcomponent.labelValue
      }
    };
    angular.forEach(question.qcomponent.choices, function(radio, key) {
      var option = {
        "name" : radio.labelValue,
        "value" : radio.labelValue
      };
      options.push(option);
    });
    radioField['templateOptions']['options'] = options;
    fields.push(radioField);
    //look for subcomponents in the radio group question
    angular.forEach(question.qcomponent.choices, function(radio, key) {
      if(radio.subComponent) {
        angular.forEach(radio.subComponent, function(value, key){
          var subComponent = value;
          var subComponentType = getType(subComponent.type);
          if(subComponentType !== 'dynamicList') {
            var subField = {
              key : 'sub_' + question.questionID + '_' + key,
              type : subComponentType,
              templateOptions: {
                label: subComponent.labelValue
              },
              hideExpression: '(model[' + question.questionID + '] !== "Yes")',
              hide: true
            };
            if(subComponentType === 'select') {
              subField['templateOptions']['options']= getDropDownOptions(
                                                        subComponent.dropDownKeys,
                                                        subComponent.dropDownValues);
            }
          } else if(subComponentType === 'dynamicList') {
            var subField = {
              type:'dynamicList',
              key : 'sub_' + question.questionID + '_' + key,
              templateOptions: {

                fields: [
                         {
                           type: 'input',
                           key:'sub_dynamicValue_' + question.questionID + '_' + 0,

                         }

                        ]
              },
              hideExpression: '(model[' + question.questionID + '] !== "Yes")',
              hide: true
            };
          }
          fields.push(subField);
        });
      }
    });
  } else if(qComponentType === 'dynamicList') {
    //nothing for now.
  }
  return fields;

}

function getType(typeOfUIelement) {
 var typeOptions = { TEXTBOX:'input',CHECKBOX :'checkbox',RADIOBUTTON:'radio',DROPDOWN:'select',TEXTAREA:'textarea',DYNAMICLIST :'dynamicList'};
 return typeOptions[typeOfUIelement];
}

function getDropDownOptions(dropDownKeys,dropDownValues) {
  if(dropDownKeys.length  !== dropDownValues.length) {
    return null;
  }
  var length = dropDownKeys.length;
  var options=[];
  for (var i = 0; i < length; i++) {
    var option = {
      "name": dropDownValues[i],
      "value":dropDownKeys[i]
    };
    options.push(option);
  };
  return options;
  }


  function getAComponent(question,answers) {
    var aComponent = {};
    var answerValue = "";
    aComponent.aComponentType = question.qComponentType;
    angular.forEach(answers, function(value, key){
      if(parseInt(key) === question.questionID ){
        answerValue = value;
      }
    });
    if(aComponent.aComponentType === 'RADIOBUTTON') {
      aComponent.achoice = getAChoiceAndSubAComponents(question,answers);
      aComponent.selectedChoice = answerValue;
    } else if(aComponent.aComponentType === 'CHECKBOX') {
      aComponent.checkBoxList = answerValue;
    } else if (aComponent.aComponentType === 'TEXTBOX') {
      aComponent.value = answerValue;
    }
    return aComponent;
  }

function getAChoiceAndSubAComponents(question,answers) {

  var achoice = {};
  var subComponentAnswers = [];//anwers.filter();
  var pattern = 'sub_' +  question.questionID;
  angular.forEach(answers, function(value, key){
    if(key.indexOf(pattern) !== -1 ) {
      var index = key.substr(key.lastIndexOf('_') + 1);
      subComponentAnswers[index]= value;
    }
  });

  achoice.acomponents= [];
  for (var i = 0; i < subComponentAnswers.length; i++) {
    if(question.qsubComponentType[i] == 'TEXTBOX') {
      achoice.acomponents.type = question.qsubComponentType[i];
      achoice.acomponents.value = subComponentAnswers[i];
    } else if(question.qsubComponentType[i] == 'DYNAMICLIST') {
      achoice.acomponents.type = question.qsubComponentType[i];
      achoice.acomponents.dynamicValues = subComponentAnswers[i];
    }
  }
  return achoice;
}

function getQuestionTypeIndex(questionIndex,questions) {
  for (var i = 0; i < questions.length; i++) {
    if(questions[i].questionID === questionIndex) {
      return i;
    }
  }
}




}