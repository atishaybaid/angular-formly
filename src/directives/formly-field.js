angular.module('formly.render')
.directive('formlyField', function formlyField($http, $compile, $templateCache, formlyConfig, formlyUtil) {
	'use strict';
	return {
		restrict: 'AE',
		transclude: true,
		scope: {
			options: '=',
			formId: '=?',
			index: '=?',
			fields: '=?',
			result: '=formResult',
			form: '=?'
		},
		controller: function fieldController($scope, $parse) {
			// set field id to link labels and fields
			$scope.id = getFieldId();
			angular.extend($scope.options, {
				runExpressions: runExpressions,
				modelOptions: {
					getterSetter: true,
					allowInvalid: true
				}
			});
			$scope.options.runExpressions = runExpressions;
			$scope.value = valueGetterSetter;

			// initalization
			runExpressions($scope.result);

			// function definitions
			function getFieldId() {
				var type = $scope.options.type;
				if (!type && $scope.options.template) {
					type = 'template';
				} else if (!type && $scope.options.templateUrl) {
					type = 'templateUrl';
				}

				return $scope.formId + type + $scope.options.key + $scope.index;
			}


			function runExpressions(result) {
				var field = $scope.options;
				angular.forEach(field.expressionProperties, function runExpression(expression, prop) {
					if (angular.isFunction(expression)) {
						field[prop] = expression(getFieldValue(), $scope);
					} else {
						var scopeWithValue = angular.extend({
							value: valueGetterSetter()
						}, $scope);
						field[prop] = $parse(expression)(scopeWithValue);
					}
				});
			}

			function valueGetterSetter(newVal) {
				if (angular.isDefined(newVal)) {
					$scope.result[$scope.options.key || $scope.index] = newVal;
				}
				return $scope.result[$scope.options.key || $scope.index];
			}
		},
		link: function fieldLink($scope, $element) {
			var templateOptions = 0;
			templateOptions += $scope.options.template ? 1 : 0;
			templateOptions += $scope.options.type ? 1 : 0;
			templateOptions += $scope.options.templateUrl ? 1 : 0;
			if (templateOptions === 0) {
				warn('Formly Warning: template type \'' + $scope.options.type + '\' not supported. On element:', $element);
				return;
			} else if (templateOptions > 1) {
				formlyUtil.throwErrorWithField('You must only provide a type, template, or templateUrl for a field', $scope.options);
			}
			var template = $scope.options.template || formlyConfig.getTemplate($scope.options.type);
			if (template) {
				setElementTemplate(template);
			} else {
				var templateUrl = $scope.options.templateUrl || formlyConfig.getTemplateUrl($scope.options.type);
				if (templateUrl) {
					$http.get(templateUrl, {
						cache: $templateCache
					}).then(function(response) {
						setElementTemplate(response.data);
					}, function(error) {
						warn('Formly Warning: Problem loading template for ' + templateUrl, error);
					});
				}
			}
			function setElementTemplate(templateData) {
				$element.html(templateData);
				$compile($element.contents())($scope);
			}
		}
	};

	function warn() {
		if (!formlyConfig.disableWarnings) {
			console.warn.apply(console, arguments);
		}
	}
});
