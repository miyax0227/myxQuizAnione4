'use strict';

var appName = "myxQuizMain";
var app = angular.module(appName, ["ngStorage", "ui.bootstrap", "ngAnimate", "ngResource", "ngSanitize"]);

/** クイズ画面用コントローラ */
app.controller('main', ['$scope', '$q', 'fileResource', 'qCommon', 'round',
	function ($scope, $q, fileResource, qCommon, round) {
		const fs = require('fs');

		/* 問題・答え選択 */
		$scope.setNowQuestion = function (index) {
			round.setNowQuestion($scope, index);
		};
		/* Timer表示 */
		$scope.timerDisplay = "";
		/* Timerオブジェクト */
		$scope.timer = qCommon.timer;
		/* ボタン再押下可否 */
		$scope.pushable = true;
		/* 説明文のカウント取得 */
		$scope.getExplainCount = qCommon.getExplainCount;
		/* globalActionの表示有無 */
		$scope.globalActionVisible = true;
		/* keyDownイベントのハンドラ */
		$scope.keyDown = function (event) {
			qCommon.keyDown($scope, event);
		};
		/* キー入力が有効か */
		$scope.workKeyDown = true;
		/* windowサイズの調整 */
		$scope.adjustWindow = function () {
			qCommon.adjustWindow($scope);
		};
		/* viewMode - 表示モードの判定 */
		$scope.viewMode = qCommon.viewMode();

		/* 読み込み対象のファイルを全て読み込み終えたら実行される処理（事実上のメイン処理）*/
		$q.all(fileResource.map(function (resource) {
			return resource.query().$promise;
		})).then(function (strs) {
			// keyboard入力の定義
			$scope.keyArray = strs[4][0];
			$scope.keyCode = strs[4][1];
			// windowサイズ
			$scope.windowSize = strs[3][0];
			qCommon.resizeWindow($scope);
			qCommon.adjustWindow($scope);
			// プロパティ
			$scope.property = strs[1][0];
			angular.forEach(strs[5][0], function (value, key) {
				if (!$scope.property.hasOwnProperty(key)) {
					$scope.property[key] = value;
				}
			});
			// 説明文
			if (!angular.isUndefined(strs[1][2])) {
				$scope.explain = [];
				angular.forEach(strs[1][2], function (e) {
					$scope.explain.push(e);
				})
			} else {
				$scope.explain = [];
			}
			// 問題・答え
			fs.readFile(__dirname + './../../history/current/question.json', 'utf-8', function (err, data) {
				if (err) {
					console.log(err);
					$scope.question = [];
				} else {
					$scope.question = JSON.parse(data);
				}
			});

			// items生成
			$scope.items = strs[2];
			// rule内に独自定義されたitemを追加
			Array.prototype.push.apply($scope.items, round.items);
			// defaultHeader生成
			$scope.defaultHeader = strs[0];
			// rule内に独自定義されたheaderを追加
			Array.prototype.push.apply($scope.defaultHeader, round.head);
			// localStorageとbind
			qCommon.saveToStorage($scope, qCommon.viewMode());
			// 操作ウィンドウ側の場合、localStorageに格納されていた値とは関係なく初期化
			if (!qCommon.viewMode()) {
				var initCurrent = {};
				// ヘッダ部分の初期化
				initCurrent.header = qCommon.getDefaultHeader($scope.defaultHeader);
				initCurrent.players = [];
				qCommon.refreshCurrent(initCurrent, $scope);

				// タイマー
				$scope.timer['defaultTime'] = $scope.property.timer;
				$scope.timer['working'] = false;
				$scope.timer['visible'] = false;
				$scope.timer['destination'] = null;
				$scope.timer['restTime'] = null;
				qCommon.timer = $scope.timer;

				// 説明文
				qCommon.setExplainCount($scope.explain.length);

			}
			// 履歴
			$scope.history = [];
			// redo用の履歴
			$scope.redoHistory = [];
			/* global_action - 全体的な操作 */
			$scope.global_actions = round.global_actions;
			/* 関数のラッピング(全体) */
			$scope.func_scope = function (func) {
				return func($scope);
			};
			/* 関数のラッピング（繰り返し） */
			$scope.func_index_scope = function (func, index) {
				return func(index, $scope);
			};
			// 履歴が無い場合、現在の得点状況を追加
			if ($scope.history.length == 0) {
				qCommon.createHist($scope);
			}
			// タイマースタート
			qCommon.timerTimerStart($scope);

		});
	}
]);


/** 全てのjsonファイルの読込の同期をとるためのfactory */
app.factory('fileResource', function ($resource) {
	// 読み込むjsonファイルを列挙
	return [
		// header.json - 履歴情報のうち、playerに依らない全体的な情報の定義
		$resource('../../json/header.json')
		// property.json - クイズのルールの中で、可変な値の設定(ラウンド毎に設定)
		, $resource('./property.json')
		// item.json - プレイヤーの属性の定義
		, $resource('../../json/item.json')
		// window.json - ウィンドウサイズの定義
		, $resource('../../json/window.json')
		// keyboard.json - キーボード入力の定義
		, $resource('../../json/keyboard.json')
		// property.json - クイズのルールの中で、可変な値の設定(共通、ラウンド毎に設定がないプロパティを補完)
		, $resource('../../json/property.json')
	];
});

/** ローカルプロバイダの設定 */
app.config(["$locationProvider", function ($locationProvider) {
	$locationProvider.html5Mode({
		enabled: true,
		requireBase: false
	});
}]);

/** ディレクティブ */
app.directive('globalActions', function () {
	return {
		restrict: 'A',
		transclude: false,
		templateUrl: '../../template/global_actions.html'
	};
});

app.directive('timerActions', function () {
	return {
		restrict: 'A',
		transclude: false,
		templateUrl: '../../template/timer_actions.html'
	};
});

app.directive('explain', function () {
	return {
		restrict: 'A',
		transclude: true,
		templateUrl: '../../template/explain.html'
	};
});

/** フィルタ */
app.filter('with', function () {
	return function (array, key) {
		return array.filter(function (one) {
			return one.hasOwnProperty(key);
		});
	};
});

app.filter('group', function () {
	return function (array, key) {
		if (array == null || array == undefined)
			return null;
		return array.filter(function (one) {
			return one.hasOwnProperty('group') && one.group == key;
		});
	};
});