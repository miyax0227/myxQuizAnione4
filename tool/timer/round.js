'use strict';

var appName = "myxQuizMain";
var app = angular.module(appName);

/*******************************************************************************
 * round - ラウンド特有のクイズのルール・画面操作の設定
 ******************************************************************************/
app.factory('round', ['qCommon', '$filter', '$location',
	function (qCommon, $filter, $location) {

		var round = {};
		var timer = qCommon.timer;
		round.global_actions = [];

		round.setNowQuestion = setNowQuestion;

		/**
		 * 問題文を設定する
		 * @param {object} scope - $scope
		 * @param {number} index - 問題番号
		 */
		function setNowQuestion(scope, index) {
			scope.nowQuestion = index;
			$location.hash("Question_" + index);
		}

		/*****************************************************************************
		 * global_actions - 全体に対する操作の設定
		 ****************************************************************************/
		Array.prototype.push.apply(round.global_actions, [
			/*****************************************************************************
			 * 表示
			 ****************************************************************************/
			{
				name: "view",
				button_css: "btn btn-primary",
				group: "basic",
				enable: function (scope) {
					return true;
				},
				action: function (scope) {
					// 一定時間ボタン押下を抑止
					qCommon.pushed(scope);
					// ウィンドウを開く
					qCommon.openWindow(scope.windowSize);
				}
			},
			/*****************************************************************************
			 * 問題戻す
			 ****************************************************************************/
			{
				name: "Prev",
				button_css: "btn btn-primary",
				group: "question",
				enable: function (scope) {
					return angular.isUndefined(scope.nowQuestion) || scope.nowQuestion > 0;
				},
				action: function (scope) {
					// 一定時間ボタン押下を抑止
					qCommon.pushed(scope);
					// 問題番号を-1
					if (angular.isUndefined(scope.nowQuestion)) {
						setNowQuestion(scope, 0);
					} else {
						setNowQuestion(scope, scope.nowQuestion - 1);
					}
				}
			},
			/*****************************************************************************
			 * 問題進める
			 ****************************************************************************/
			{
				name: "Next",
				button_css: "btn btn-primary",
				group: "question",
				enable: function (scope) {
					return angular.isUndefined(scope.nowQuestion) || scope.nowQuestion < scope.question.length - 1;
				},
				action: function (scope) {
					// 一定時間ボタン押下を抑止
					qCommon.pushed(scope);
					// 問題番号を+1
					if (angular.isUndefined(scope.nowQuestion)) {
						setNowQuestion(scope, 0);
					} else {
						setNowQuestion(scope, scope.nowQuestion + 1);
					}
				}
			},
			/*****************************************************************************
			 * 問題を設定する
			 ****************************************************************************/
			{
				name: "Q",
				button_css: "btn btn-primary",
				group: "question",
				enable: function (scope) {
					return !angular.isUndefined(scope.nowQuestion);
				},
				action: function (scope) {
					// 一定時間ボタン押下を抑止
					qCommon.pushed(scope);
					// 問題を設定
					scope.current.header.question = scope.question[scope.nowQuestion].question;
					scope.current.header.answer = undefined;
					// 履歴登録
					qCommon.createHist(scope);
				}
			},
			/*****************************************************************************
			 * 問題・答えを設定する
			 ****************************************************************************/
			{
				name: "QA",
				button_css: "btn btn-primary",
				group: "question",
				enable: function (scope) {
					return !angular.isUndefined(scope.nowQuestion);
				},
				action: function (scope) {
					// 一定時間ボタン押下を抑止
					qCommon.pushed(scope);
					// 問題・答えを設定
					scope.current.header.question = scope.question[scope.nowQuestion].question;
					scope.current.header.answer = scope.question[scope.nowQuestion].answer;
					// 履歴登録
					qCommon.createHist(scope);
				}
			},
			/*****************************************************************************
			 * 問題・答えを非表示にする
			 ****************************************************************************/
			{
				name: "hide",
				button_css: "btn btn-primary",
				group: "question",
				enable: function (scope) {
					return !angular.isUndefined(scope.nowQuestion);
				},
				action: function (scope) {
					// 一定時間ボタン押下を抑止
					qCommon.pushed(scope);
					// 問題・答えを設定
					scope.current.header.question = undefined;
					scope.current.header.answer = undefined;
					// 履歴登録
					qCommon.createHist(scope);
				}
			},
			/*****************************************************************************
			 * アンドゥ
			 ****************************************************************************/
			{
				name: "undo",
				button_css: "btn btn-danger",
				group: "history",
				keyboard: "Left",
				enable: function (scope) {
					return (scope.history.length >= 2);
				},
				action: function (scope) {
					// 一定時間ボタン押下を抑止
					qCommon.pushed(scope);
					if (scope.history.length > 0) {
						// redo用の配列に現在の状態を退避
						scope.redoHistory.push(angular.copy(scope.history.pop()));
						// 履歴から最新の状態を取得
						var hist = scope.history[scope.history.length - 1];
						// 状態を更新
						qCommon.refreshCurrent(hist, scope);
					}
				}
			},
			/*****************************************************************************
			 * リドゥ
			 ****************************************************************************/
			{
				name: "redo",
				button_css: "btn btn-danger",
				group: "history",
				keyboard: "Right",
				enable: function (scope) {
					return (scope.redoHistory.length > 0);
				},
				action: function (scope) {
					// 一定時間ボタン押下を抑止
					qCommon.pushed(scope);
					if (scope.redoHistory.length > 0) {
						// redo用の配列から最新の状態を取得
						var hist = scope.redoHistory.pop();
						// 状態を更新
						qCommon.refreshCurrent(hist, scope);
						// 履歴に現在の状態を退避
						scope.history.push(angular.copy(scope.current));
						scope.currentPage = scope.history.length;
					}
				}
			},
			/*****************************************************************************
			 * 1秒＋
			 ****************************************************************************/
			{
				name: "+",
				button_css: "btn btn-success",
				group: "timer",
				enable: function (scope) {
					return (qCommon.timer.destination == null);
				},
				action: function (scope) {
					// 一定時間ボタン押下を抑止
					qCommon.pushed(scope);
					qCommon.timerPlus1();
				}
			},
			/*****************************************************************************
			 * 1秒－
			 ****************************************************************************/
			{
				name: "-",
				button_css: "btn btn-success",
				group: "timer",
				enable: function (scope) {
					return (qCommon.timer.destination == null);
				},
				action: function (scope) {
					// 一定時間ボタン押下を抑止
					qCommon.pushed(scope);
					qCommon.timerMinus1();
				}
			},
			/*****************************************************************************
			 * タイマースタート/リセット
			 ****************************************************************************/
			{
				name: "start/reset",
				button_css: "btn btn-success",
				group: "timer",
				enable: function (scope) {
					return (qCommon.timer.destination == null);
				},
				action: function (scope) {
					// 一定時間ボタン押下を抑止
					qCommon.pushed(scope);
					if (qCommon.timer.working) {
						qCommon.timerReset();
					} else {
						qCommon.timerStart();
					}
				}
			},
			/*****************************************************************************
			 * タイマーストップ/リスタート
			 ****************************************************************************/
			{
				name: "stop/restart",
				button_css: "btn btn-success",
				group: "timer",
				enable: function (scope) {
					return qCommon.timer.working;
				},
				action: function (scope) {
					// 一定時間ボタン押下を抑止
					qCommon.pushed(scope);
					if (qCommon.timer.restTime == null) {
						qCommon.timerStop();
					} else {
						qCommon.timerRestart();
					}
				}
			},
			/*****************************************************************************
			 * タイマー表示/非表示
			 ****************************************************************************/
			{
				name: "show/hide",
				button_css: "btn btn-success",
				group: "timer",
				enable: function (scope) {
					return true;
				},
				action: function (scope) {
					// 一定時間ボタン押下を抑止
					qCommon.pushed(scope);
					if (qCommon.timer.visible) {
						qCommon.timerHide();
					} else {
						qCommon.timerShow();
					}
				}
			},
			/*****************************************************************************
			 * 説明文送る
			 ****************************************************************************/
			{
				name: "exp",
				button_css: "btn btn-success",
				group: "timer",
				enable: function (scope) {
					return true;
				},
				action: function (scope) {
					// 一定時間ボタン押下を抑止
					qCommon.pushed(scope);
					// 説明文を次へ
					qCommon.explainNext();
				}
			},
			/*****************************************************************************
			 * global_action表示/非表示
			 ****************************************************************************/
			{
				name: "x",
				button_css: "btn btn-info",
				group: "view",
				keyboard: "S+Left",
				enable: function (scope) {
					return true;
				},
				action: function (scope) {
					// 一定時間ボタン押下を抑止
					qCommon.pushed(scope);
					// 表示/非表示を反転
					scope.globalActionVisible = !scope.globalActionVisible;
				}
			}
		]);

		return round;
	}
]);