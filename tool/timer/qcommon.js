'use strict';

var appName = "myxQuizMain";
var app = angular.module(appName);

/** クイズのルールに依存しない共通関数をまとめたservice */
app.service('qCommon', ['$uibModal', '$localStorage', '$interval', '$location', '$window', '$filter',
	function ($uibModal, $localStorage, $interval, $location, $window, $filter) {
		var timer = {};

		var qCommon = {};
		qCommon.adjustWindow = adjustWindow;
		qCommon.createHist = createHist;
		qCommon.explainNext = explainNext;
		qCommon.getDefaultHeader = getDefaultHeader;
		qCommon.getExplainCount = getExplainCount;
		qCommon.keyDown = keyDown;
		qCommon.openWindow = openWindow;
		qCommon.pushed = pushed;
		qCommon.refreshCurrent = refreshCurrent;
		qCommon.resizeWindow = resizeWindow;
		qCommon.saveToStorage = saveToStorage;
		qCommon.setExplainCount = setExplainCount;
		qCommon.timer = timer;
		qCommon.timerHide = timerHide;
		qCommon.timerMinus1 = timerMinus1;
		qCommon.timerPlus1 = timerPlus1;
		qCommon.timerReset = timerReset;
		qCommon.timerRestart = timerRestart;
		qCommon.timerShow = timerShow;
		qCommon.timerStart = timerStart;
		qCommon.timerStop = timerStop;
		qCommon.timerTimerStart = timerTimerStart;
		qCommon.viewMode = viewMode;

		return qCommon;

		/** 履歴を作成する
		 * @param {object} scope  $scope
		 **/
		function createHist(scope) {
			// historyの末尾にcurrentのコピーを追加
			scope.history.push(angular.copy(scope.current));
			// currentPageをhistoryの末尾に設定
			scope.currentPage = scope.history.length;
			// redoHistoryを初期化
			scope.redoHistory = [];
		}

		/** 現在の状態を履歴に反映する（undo,redoで使用）
		 * @param {object} hist  反映したい1履歴
		 * @param {object} scope  $scope
		 **/
		function refreshCurrent(hist, scope) {
			// headerの中身を入替
			angular.forEach(scope.current.header, function (value, key) {
				delete scope.current.header[key];
			});
			angular.forEach(hist.header, function (value, key) {
				scope.current.header[key] = value;
			});
			// プレイヤーの中身を入替
			// 現在の状態から人数が変わる場合、ポインタ入替
			if (scope.current.players.length != hist.players.length) {
				scope.current.players.splice(0, scope.current.players.length);
				angular.forEach(hist.players, function (record, i) {
					scope.current.players.push(angular.copy(record));
				});
				// 現在の状態から人数が変わらない場合、ポインタ保持して内容を入替
			} else {
				angular.forEach(hist.players, function (record, i) {
					angular.forEach(scope.current.players[i], function (value, key) {
						delete scope.current.players[i][key];
					});
					angular.forEach(hist.players[i], function (value, key) {
						scope.current.players[i][key] = value;
					});
				});
			}
		}

		/** localStorageに保存する
		 * @param {object} scope  $scope
		 * @param {boolean} viewMode  表示モード
		 **/
		function saveToStorage(scope, viewMode) {
			var defaultObj = {};
			defaultObj[getRoundName()] = {
				header: {},
				players: [],
				timer: {}
			};

			scope.$storage = $localStorage.$default(defaultObj);
			scope.current = {};
			scope.current.header = scope.$storage[getRoundName()].header;
			scope.current.players = scope.$storage[getRoundName()].players;
			// scope.timer = {};
			scope.timer = scope.$storage[getRoundName()].timer;
			qCommon.timer = scope.timer;

			if (viewMode) {
				// localStorage内ではdate型を扱えないので変換
				if (scope.timer['destination'] != null) {
					scope.timer['destination'] = new Date(scope.timer['destination']);
				}
				if (scope.timer['restTime'] != null) {
					scope.timer['restTime'] = new Date(scope.timer['restTime']);
				}

				angular.element($window).bind('storage', function (event) {
					var hist = $localStorage.$default(defaultObj);
					refreshCurrent(hist[getRoundName()], scope);
					scope.timer = scope.$storage[getRoundName()].timer;
					qCommon.timer = scope.timer;

					// localStorage内ではdate型を扱えないので変換
					if (scope.timer['destination'] != null) {
						scope.timer['destination'] = new Date(scope.timer['destination']);
					}
					if (scope.timer['restTime'] != null) {
						scope.timer['restTime'] = new Date(scope.timer['restTime']);
					}
				});
			}
		}

		/** URLパラメータから表示モードかどうか判定する
		 * @return {boolean} 表示モードの場合はtrue, それ以外はfalse
		 **/
		function viewMode() {
			return $location.search()["view"] == "true";
		}

		/** パスからラウンド名を取得する
		 * @return {string} ラウンド名
		 **/
		function getRoundName() {
			var pathArray = $location.path().split("/");
			return pathArray[pathArray.length - 2];
		}

		/** サブウィンドウを開く
		 * @param {object} windowSize  windowSize
		 **/
		function openWindow(windowSize) {
			const BrowserWindow = require('electron').remote.BrowserWindow;

			// キャプチャ用ウィンドウを生成
			var win = new BrowserWindow({
				width: windowSize.width,
				height: windowSize.height,
				x: windowSize.left,
				y: windowSize.top,
				transparent: true, // ウィンドウの背景を透過
				frame: false, // 枠の無いウィンドウ
				resizable: false, // ウィンドウのリサイズを禁止
				hasShadow: false, // 影を非表示
				alwaysOnTop: true, // 常に最前面表示
				title: getRoundName() + ' - view',
				webPreferences: {
					nodeIntegration: true
				}
			});
			win.loadURL('file://' + __dirname + '/board.html?view=true');

			/*
			var parameter = "";
			parameter += 'width=' + windowSize.width;
			parameter += ',height=' + windowSize.height;
			parameter += ',left=' + windowSize.left;
			parameter += ',top=' + windowSize.top;
			parameter += ',frame=no';

			$window.open('board.html?view=true', getRoundName() + ' - view', parameter);
		*/
		}

		/** ウィンドウサイズ変更を検知する関数
		 * @param {object} scope  scope
		 **/
		function resizeWindow(scope) {
			angular.element($window).bind('resize', function (event) {
				adjustWindow(scope);
			});

		}

		/** ウィンドウサイズ変更に追従してzoomを変更する関数
		 * @param {object} scope  scope
		 **/
		function adjustWindow(scope) {
			var widthRatio = $window.innerWidth / scope.windowSize.width;
			var heightRatio = $window.innerHeight / scope.windowSize.height;
			document.body.style.zoom = Math.min(widthRatio, heightRatio);
		}

		/** header.jsonに記載されたデフォルトのheaderを取得する
		 * @param {object} header.jsonをパースした状態のオブジェクト
		 * @return {object} ヘッダ情報
		 **/
		function getDefaultHeader(headerObj) {
			var header = {};
			headerObj.map(function (record) {
				header[record.key] = record.value;
			});
			return header;
		}

		/** keydownイベントのハンドラ
		 * @param {object} scope $scope
		 * @param {object} event $event
		 **/
		function keyDown(scope, event) {
			// キー押下が有効な場合
			if (scope.workKeyDown) {
				var key = "";
				// viewModeの場合は処理終了
				if (viewMode()) {
					return;
				}

				// keyCodeリストにない場合は処理終了
				if (!scope.keyCode.hasOwnProperty(event.which)) {
					return;
				}
				key = scope.keyCode[event.which];
				// Shiftが同時押しされている場合
				if (event.shiftKey) {
					key = "S+" + key;
				}
				// Ctrlが同時押しされている場合
				if (event.ctrlKey) {
					key = "C+" + key;
				}
				// Altが同時押しされている場合
				if (event.altKey) {
					key = "A+" + key;
				}

				// playerに対する操作
				// 合致する配列がある場合
				angular.forEach(scope.keyArray, function (keyArray, keyArrayName) {
					if (keyArray.indexOf(key) >= 0) {
						var index = keyArray.indexOf(key);

						// actionsの中に合致するkeyArrayNameがある場合
						angular.forEach(scope.actions, function (action) {
							if (action.keyArray == keyArrayName) {

								// playersの中に一致するkeyIndexのplayerがいる場合
								angular.forEach(scope.current.players, function (player) {
									if (player.keyIndex == index) {
										// そのplayerのactionが行える状態の場合
										if (action.enable(player, scope)) {
											// そのplayerのactionを実行
											action.action(player, scope);
										}
									}
								});
							}
						});
					}
				});

				// global_actionの操作
				// global_actionの中に合致するkeyboardがある場合
				angular.forEach(scope.global_actions, function (action) {
					if (action.keyboard == key) {
						// そのglobal_actionが行える状態の場合
						if (action.enable(scope)) {
							// そのglobal_actionを実行
							action.action(scope);
						}
					}
				});
			}
		}

		/** タイマー表示
		 * @param {object} scope  $scope
		 * @return {string} timer  表示用タイマー文字列
		 **/
		function getTimer(scope) {
			function timerFormat(millisec) {
				if (millisec >= 60000) {
					// 1分以上の場合、m:ss形式
					return $filter('date')(new Date(millisec), 'm:ss');
				} else {
					// 1分未満の場合、s.s形式
					return $filter('date')(new Date(millisec), 's.sss').slice(0, -2);
				}
			}

			var timer = qCommon.timer;

			if (timer.visible) {
				if (timer.working) {
					if (timer.destination == null) {
						// タイマー動作中、目標時刻無しの場合、残り時間を表示
						return timerFormat(timer.restTime);
					} else {
						if (timer.destination.getTime() - (new Date()).getTime() > 0) {
							// タイマー動作中、目標時刻有り、現在が目標時刻より前の場合、差分を計算して表示
							return timerFormat(timer.destination.getTime() - (new Date()).getTime());
						} else {
							// タイマー動作中、目標時刻有り、現在が目標時刻以降の場合、0秒を表示
							return timerFormat(0);
						}
					}
				} else {
					if (timer.restTime == null) {
						// タイマー停止、残り時間が無い場合、初期時間を表示
						return timerFormat(timer.defaultTime * 1000);
					} else {
						// タイマー停止、残り時間がある場合、残り時間を表示
						return timerFormat(timer.restTime);
					}
				}
			} else {
				return "";
			}
		}

		/** タイマー表示用タイマー
		 **/
		function timerTimerStart(scope) {
			var t;
			t = $interval(function () {
				scope.timerDisplay = getTimer(scope);
			}, 100);
			t = $interval(function () {
				if (global.gc) {
					global.gc();
					console.log("Used Memory:" + process.memoryUsage().heapUsed);
				}
			}, 60000);
			t = $interval(function () {
				scope.initialAnimation = true;
			}, 2000, 1);
		}

		/** timerを初期化する
		 */
		function timerReset() {
			var timer = qCommon.timer;
			timer.destination = null;
			timer.restTime = null;
			timer.working = false;
		}

		/** timerを始める
		 */
		function timerStart() {
			var timer = qCommon.timer;
			timer.destination = new Date(new Date().getTime() + timer.defaultTime * 1000);
			timer.restTime = null;
			timer.working = true;
		}

		/** timerを止める
		 */
		function timerStop() {
			var timer = qCommon.timer;
			if (timer.destination) {
				timer.restTime = new Date(timer.destination.getTime() - new Date().getTime());
				timer.destination = null;
			}
		}

		/** timerを再び始める
		 */
		function timerRestart() {
			var timer = qCommon.timer;
			timer.destination = new Date(new Date().getTime() + timer.restTime.getTime());
			timer.restTime = null;
		}

		/** timerを表示する
		 */
		function timerShow() {
			var timer = qCommon.timer;
			timer.visible = true;
		}

		/** timerを非表示にする
		 */
		function timerHide() {
			var timer = qCommon.timer;
			timer.visible = false;
		}

		/** timerの秒数＋１
		 */
		function timerPlus1() {
			var timer = qCommon.timer;
			if (timer.restTime) {
				timer.restTime = new Date(timer.restTime.getTime() + 1000);
			} else {
				timer.defaultTime += 1;
			}
		}

		/** timerの秒数ー１
		 */
		function timerMinus1() {
			var timer = qCommon.timer;
			if (timer.restTime) {
				timer.restTime = new Date(timer.restTime.getTime() - 1000);
			} else {
				timer.defaultTime -= 1;
			}
		}

		/** 説明文　最大数設定 
		 * @param {number} max 説明文の最大数
		 */
		function setExplainCount(max) {
			var timer = qCommon.timer;
			timer.explainMax = max;
			timer.explainCount = 0;
		}
		/** 説明文　次へ
		 */
		function explainNext() {
			var timer = qCommon.timer;
			timer.explainCount++;
			if (timer.explainCount > timer.explainMax) {
				timer.explainCount = 0;
			}
		}
		/** 説明文　現在のカウント
		 * @return {number} 現在のカウント
		 */
		function getExplainCount() {
			var timer = qCommon.timer;
			if (timer.explainCount > 0) {
				try {
					var explainElement = document.getElementById("explain");
					explainElement.scrollTop = explainElement.scrollHeight;
				} catch (e) {

				}
			}
			return timer.explainCount;
		}

		/** ボタン押下後、一定時間押下できないようにする
		 * @param {object} scope  $scope
		 */
		function pushed(scope) {
			scope.pushable = false;
			var t;
			t = $interval(function () {
				scope.pushable = true;
			}, 500, 1);
		}
	}
]);