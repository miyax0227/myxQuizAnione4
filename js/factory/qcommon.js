'use strict';

var appName = "myxQuizMain";
var app = angular.module(appName);

/** クイズのルールに依存しない共通関数をまとめたservice */
app.service('qCommon', ['$uibModal', '$localStorage', '$interval', '$location', '$window', '$filter', '$http', '$sce',
	function ($uibModal, $localStorage, $interval, $location, $window, $filter, $http, $sce) {
		var ipc;
		if (!browserMode()) {
			ipc = require('electron').ipcRenderer;
		}

		var timer = {};
		var TextImageH = [];
		var textImages = {};

		var qCommon = {};
		qCommon.timer = timer;
		qCommon.createHist = createHist;
		qCommon.addPlayer = addPlayer;
		qCommon.removePlayer = removePlayer;
		qCommon.win = win;
		qCommon.lose = lose;
		qCommon.rolling = rolling;
		qCommon.decode = decode;
		qCommon.playerSortOn = playerSortOn;
		qCommon.refreshCurrent = refreshCurrent;
		qCommon.editCurrent = editCurrent;
		qCommon.saveToStorage = saveToStorage;
		qCommon.viewMode = viewMode;
		qCommon.browserMode = browserMode;
		qCommon.openWindow = openWindow;
		qCommon.getDefaultHeader = getDefaultHeader;
		qCommon.getPlayerCSS = getPlayerCSS;
		qCommon.getItemCSS = getItemCSS;
		qCommon.getRankColorCSS = getRankColorCSS;
		qCommon.resizeWindow = resizeWindow;
		qCommon.adjustWindow = adjustWindow;
		qCommon.addQCount = addQCount;
		qCommon.getDisplayValue = getDisplayValue;
		qCommon.setMotion = setMotion;
		qCommon.keyDown = keyDown;
		qCommon.getHistoryFileName = getHistoryFileName;
		qCommon.initPlayers = initPlayers;
		qCommon.getTimer = getTimer;
		qCommon.timerTimerStart = timerTimerStart;
		qCommon.victoryName = victoryName;
		qCommon.changePlayer = changePlayer;
		qCommon.filterPlayer = filterPlayer;
		qCommon.setPlayer = setPlayer;
		qCommon.clearPlayer = clearPlayer;
		qCommon.sortPlayer = sortPlayer;
		qCommon.playoffoff = playoffoff;
		qCommon.editTweet = editTweet;
		qCommon.anonymousMode = anonymousMode;
		qCommon.getEntryFileName = getEntryFileName;
		qCommon.mergeItemCSS = mergeItemCSS;
		qCommon.timerReset = timerReset;
		qCommon.timerStart = timerStart;
		qCommon.timerStop = timerStop;
		qCommon.timerRestart = timerRestart;
		qCommon.timerShow = timerShow;
		qCommon.timerHide = timerHide;
		qCommon.timerPlus1 = timerPlus1;
		qCommon.timerMinus1 = timerMinus1;
		qCommon.setExplainCount = setExplainCount;
		qCommon.explainNext = explainNext;
		qCommon.getExplainCount = getExplainCount;
		qCommon.pushed = pushed;
		qCommon.getCaptureFileName = getCaptureFileName;
		qCommon.getTempCaptureFileName = getTempCaptureFileName;
		qCommon.getRoundName = getRoundName;
		qCommon.downloadStatus = downloadStatus;
		qCommon.outputCurrentStatus = outputCurrentStatus;
		qCommon.getStringImage = getStringImage;
		return qCommon;

		/** ログ文字列を生成する
		 * @param {Object} scope  $scope
		 * @return {string}
		 **/
		function getLog(scope) {
			var logArray = [];
			var header = scope.current.header;
			var players = scope.current.players;

			angular.forEach(scope.defaultHeader, function (record, i) {
				logArray.push(header[record.key]);
			});

			angular.forEach(players, function (player, i) {
				angular.forEach(scope.items, function (record, j) {
					logArray.push(player[record.key]);
				});
			});

			return logArray.join(',');
		}

		/** 履歴を作成する
		 * @param {object} scope  $scope
		 **/
		function createHist(scope) {
			var needToTweet = false;
			if (scope.current.header.tweets.length > 0) {
				needToTweet = true;
			}

			// ツイート内容編集
			var tweet = constructTweet(scope, scope.current.header.tweets);
			scope.current.header.tweet = tweet;
			// tweets初期化
			scope.current.header.tweets = [];

			// historyの末尾にcurrentのコピーを追加
			scope.history.push(angular.copy(scope.current));
			// currentPageをhistoryの末尾に設定
			scope.currentPage = scope.history.length;
			// redoHistoryを初期化
			scope.redoHistory = [];

			// 現在の状態を出力する
			outputCurrentStatus(scope, needToTweet, tweet);
		}

		/**
		 * 外部ファイルやサーバに現在の状態を出力する
		 * @param {Object} scope 
		 */
		function outputCurrentStatus(scope, needToTweet, tweet) {
			// ブラウザモードではない場合
			if (!browserMode()) {
				try {
					var fs = require('fs');
					// ログ出力
					fs.writeFile(getHistoryFileName(), angular.toJson(scope.current), function (err) {
						if (err) {
							console.log(err);
						}
					});
					// ツイート出力
					if (needToTweet) {
						// 一度カレントディレクトリ内にファイルを作成する
						var tempFileName = getTempTweetFileName();
						var fileName = getTweetFileName();

						fs.writeFile(tempFileName, tweet, function (err) {
							if (err) {
								console.log(err);
							} else {
								// ファイルを移動する
								fs.rename(tempFileName, fileName, function (err) {
									if (err) {
										console.log(err);
									}
								});
							}
						});
					}

				} catch (e) {
					console.log('fs is not supported.');
					console.log(e);
				}

				// ブラウザモードの場合
			} else {
				// ステータスアップロード
				uploadStatus(getRoundName(), scope);
			}
		}

		/** ツイート内容を最終的に編集する
		 * @param {Object} scope  $scope
		 * @param {array} tweets  連携したいツイート（リスト形式）
		 * @return {string} 編集したツイート内容
		 **/
		function constructTweet(scope, tweets) {
			function dateString() {
				return $filter('date')(new Date(), 'HH:mm:ss');
			}

			var tweet = "";
			tweet += scope.property.tweetCupTitle || "";
			tweet += scope.property.tweetRoundTitle || "";
			tweet += "\n";

			// ヘッダ部分の埋込文字置換
			var tmpTweets = [];
			editTweet(tmpTweets, tweet, scope.current.header, true);
			tweet = tmpTweets[0];

			tweet += tweets.join("\n");
			tweet += "\n";
			tweet += " - " + dateString();

			return tweet;

		}

		/** playerを追加する
		 * @param {number} index  追加する位置
		 * @param {Object} scope  $scope
		 **/
		function addPlayer(index, scope) {
			var player = {};
			// playerにitemの初期値を設定
			angular.forEach(scope.items, function (record, i) {
				player[record.key] = record.value;
			});
			// players内のindexで指定した位置にplayerを追加
			scope.current.players.splice(index, 0, player);
			// 再計算
			scope.calc();
		}

		/** playerを勝抜処理する
		 * @param {Object} player  勝ち抜けたプレイヤー
		 * @param {Object} players  players
		 **/
		function win(player, players, header, property) {
			/* rank算出 */
			player.rank = players.filter(function (item) {
				return (item.status == 'win');
			}).length + 1;

			/* lotRank算出 */
			if (player.hasOwnProperty('lot')) {
				player.lotRank =
					players.filter(function (item) {
						return (item.status == 'win' && item.lot == player.lot)
					}).length + 1;
			}

			/* status */
			player.status = "win";
			/* 休みを消す */
			player.absent = 0;
			/* 時間を記録する */
			player.time = new Date().getTime();
			/* tweet */
			editTweet(header.tweets, property.tweet["win"], player, false);
		}

		/** playerを失格処理する
		 * @param {Object} player  勝ち抜けたプレイヤー
		 * @param {Object} players  players
		 **/
		function lose(player, players, header, property) {
			/* rank算出 */
			player.rank = players.filter(function (item) {
				return (item.status != 'lose');
			}).length;

			/* lotRank算出 */
			if (player.hasOwnProperty('lot')) {
				player.lotRank =
					players.filter(function (item) {
						return (item.status != 'lose' && item.lot == player.lot)
					}).length;
			}

			/* status */
			player.status = "lose";
			/* 休みを消す */
			player.absent = 0;
			/* 時間を記録する */
			player.time = new Date().getTime();
			/* tweet */
			editTweet(header.tweets, property.tweet["lose"], player, false);

		}

		/** 列をrollingする
		 * @param {number} players players
		 * @param {number} col ローリング対象列
		 */
		function rolling(players, col) {
			// 一人もボタンについていない場合は処理しない
			if (players.filter(function (p) {
					return (p.col === col) && (p.status == "selected");
				}).length === 0) {
				return;
			}

			// ボタンについている人を特定
			var nowPlayer = players.filter(function (p) {
				return (p.col === col) && (p.status == "selected");
			})[0];
			var nowRow = nowPlayer.row;
			// 現在ボタンについている人の権利を剥奪
			nowPlayer.status = "normal";

			var nextArray = [];
			// ボタンについていた人よりも大きいrowを持つ、勝抜・失格・休みでないプレイヤー
			players.filter(function (p) {
				return (p.col == col) && (p.row > nowRow) && (p.status == "normal");
			}).sort(function (a, b) {
				return (a.row < b.row) ? -1 : 1;
			}).map(function (p) {
				nextArray.push(p);
			});
			// ボタンについていた人以下のrowを持つ、勝抜・失格・休みでないプレイヤー
			players.filter(function (p) {
				return (p.col == col) && (p.row <= nowRow) && (p.status == "normal");
			}).sort(function (a, b) {
				return (a.row < b.row) ? -1 : 1;
			}).map(function (p) {
				nextArray.push(p);
			});
			// 要素が１つ以上ある場合、最初のプレイヤーをボタンにつける
			if (nextArray.length >= 1) {
				nextArray[0].status = "selected";
			}
		}

		/** playerを削除する
		 * @param {number} index  削除する位置
		 * @param {Object} scope  $scope
		 **/
		function removePlayer(index, scope) {
			// players内のindexで指定した位置のplayerを削除
			scope.current.players.splice(index, 1);
			// 再計算
			scope.calc();
		}

		/** 値の置換をする
		 * @param {string,number} a  元の文字列/数値
		 * @param {Array. <string,number>} alter (置換前文字列/数値, 置換後文字列/数値)*n [,elseの場合の文字列/数値]
		 * @return {string,number} 置換後の文字列/数値
		 **/
		function decode(a, alter) {
			// alterをalterCopyに退避
			var alterCopy = angular.copy(alter);
			// alterCopy内で、aに合致する奇数番目の要素が出るまで繰り返し
			while (alterCopy.length > 0) {
				// 奇数番目の要素を取得
				var b = alterCopy.shift();
				// 要素数が奇数個のalterCopyの末尾まで来た場合,elseとして末尾の要素を返却
				if (alterCopy.length == 0) {
					return b;
				}
				// 偶数番目の要素を取得
				var c = alterCopy.shift();
				// aが奇数番目の要素と合致する場合、偶数番目の要素を返却
				if (a == b) {
					return c;
				}
			}
			// 要素数が偶数個のalterCopyの末尾まで来て合致する奇数番目の要素が無い場合、aのまま返却
			return a;
		}

		/** playerのソート用関数
		 * @param {object[]} order  key:比較対象属性名 order:昇順(asc)/降順(desc) alter:置換文字列
		 * @param {boolean} position  比較結果が同等の場合、初期位置で比較を行うか
		 * @param {object} scope  $scope
		 * @return {function} 評価関数
		 **/
		function playerSortOn(order, position, players) {
			return function (a, b) {
				// ループ内のコンテキスト、flgは返却予定値(-1/0/1)
				var context = {
					flg: 0
				};
				// orderの先頭から順にaとbのそれぞれの要素を指定して比較
				angular.forEach(order, function (record, i) {
					// 返却予定値が0（同値）の場合のみ比較
					if (this.flg == 0) {
						var aComp = a[record.key];
						var bComp = b[record.key];
						// alterが設定されている場合、decodeで値を置換
						if (record.hasOwnProperty('alter')) {
							aComp = decode(aComp, record.alter);
							bComp = decode(bComp, record.alter);
						}
						// 降順（desc）の場合
						if (record.hasOwnProperty('order') && record.order == 'desc') {
							if (aComp < bComp) {
								this.flg = 1;
							} else if (aComp > bComp) {
								this.flg = -1;
							}
							// 昇順の場合
						} else {
							if (aComp < bComp) {
								this.flg = -1;
							} else if (aComp > bComp) {
								this.flg = 1;
							}
						}
					}
				}, context);
				// 返却予定値が0以外の場合、ここで返却
				if (context.flg != 0) {
					return context.flg;
				}
				// 初期位置による比較を考慮しない場合、ここで0を返却
				if (!position) {
					return 0;
				}
				// 初期位置による比較結果を返却
				var aComp = players.indexOf(a);
				var bComp = players.indexOf(b);
				if (aComp < bComp) {
					return -1;
				} else if (aComp > bComp) {
					return 1;
				}
				return 0;
			};
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

		/** 得点の編集画面を表示する
		 * @param {object} scope  $scope
		 **/
		function editCurrent(scope) {
			scope.workKeyDown = false;
			var modal = $uibModal.open({
				templateUrl: "../../template/modal.html",
				scope: scope,
				controller: "modal",
				backdrop: "static"
			});

			modal.result.then(function () {
				// 従属変数の再計算
				scope.calc();
				createHist(scope);
				scope.workKeyDown = true;
			}, function () {
				// 従属変数の再計算a
				scope.calc();
				createHist(scope);
				scope.workKeyDown = true;
			});
		}

		/** localStorageに保存する
		 * @param {object} scope  $scope
		 * @param {boolean} viewMode  表示モード
		 **/
		function saveToStorage(scope, viewMode) {
			scope.current = {};
			scope.current.header = {};
			scope.current.header.tweets = [];
			scope.current.players = [];
			scope.timer = {};
			qCommon.timer = scope.timer;

			// ブラウザモードではない場合
			if (!browserMode()) {
				ipc.send('registWindow', {
					roundName: getRoundName(),
					viewMode: viewMode
				});

				if (!viewMode) {
					scope.$watch('current', function () {
						ipcSendCurrent(scope);
					}, true);

					scope.$watch('timer', function () {
						ipcSendCurrent(scope);
					}, true);
				}

				if (viewMode) {
					ipc.on('createHist', function (event, arg) {
						console.log('receiveCreateHist');
						refreshCurrent(arg.hist, scope);
						scope.timer = arg.timer;
						qCommon.timer = scope.timer;

						if (scope.timer['destination'] != null) {
							scope.timer['destination'] = new Date(scope.timer['destination']);
						}
						if (scope.timer['restTime'] != null) {
							scope.timer['restTime'] = new Date(scope.timer['restTime']);
						}
					});
				}

				// ブラウザモードの場合
			} else {
				if (viewMode) {
					downloadStatus(scope);
					var t = $interval(function () {
						if ($location.search()["autoreloadend"] && $location.search()["autoreloadend"] > new Date().toISOString()) {
							console.log($location.search()["autoreloadend"], new Date().toISOString());
							downloadStatus(scope);
						}
					}, 5000)
				}

			}
		}

		/** URLパラメータから表示モードかどうか判定する
		 * @return {boolean} 表示モードの場合はtrue, それ以外はfalse
		 **/
		function viewMode() {
			// ブラウザモードではない場合
			if (!browserMode()) {
				return $location.search()["view"] == "true";

				// ブラウザモードの場合
			} else {
				return ($location.search()["key"] == undefined);
			}
		}

		/** URLパラメータからブラウザモードかどうか判定する
		 * @return {boolean} ブラウザモードの場合はtrue, それ以外はfalse
		 **/
		function browserMode() {
			return $location.search()["browser"] == "true";
		}

		/** URLパラメータから匿名モードかどうか判定する
		 * @return {boolean} 匿名モードの場合はtrue, それ以外はfalse
		 **/
		function anonymousMode() {
			return $location.search()["anonymous"] == "true";
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
			var parameter = "";
			parameter += 'width=' + windowSize.width;
			parameter += ',height=' + windowSize.height;
			parameter += ',left=' + windowSize.left;
			parameter += ',top=' + windowSize.top;
			parameter += ',frame=no';

			$window.open('board.html?view=true', getRoundName() + ' - view', parameter);
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
			var widthRatio = $window.innerWidth / scope.windowSize.standardWidth;
			var heightRatio = $window.innerHeight / scope.windowSize.standardHeight;
			//document.body.style.zoom = Math.min(widthRatio, heightRatio);
			document.body.style.transform = 'scale(' + Math.min(widthRatio, heightRatio) + ')';
			document.body.style.transformOrigin = "0px 0px"
			//document.body.style.zoom = 1.2;
			scope.windowSize.style = {
				"position": "absolute",
				"width": ($window.innerWidth / Math.min(widthRatio, heightRatio)) + "px",
				"height": ($window.innerHeight / Math.min(widthRatio, heightRatio)) + "px",
				"top": "0px",
				"left": "0px"
			}
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

		/** playerの表示位置を示すCSSを取得する
		 * @param [Array] players 全プレイヤー情報
		 * @param {object} player プレイヤー
		 * @param {object} windowSize ウィンドウサイズ情報
		 * @param {array} lineProperty プレイヤーが並ぶ軸の情報
		 * @param {object} roundProperty ラウンド毎のプロパティ
		 * @return {object} CSSオブジェクト
		 **/
		function getPlayerCSS(players, player, windowSize, lineProperty, roundProperty, header) {
			var property = {};
			if (lineProperty.hasOwnProperty(player.line)) {
				property = lineProperty[player.line];
			} else {
				property = {
					left: 0,
					right: 1,
					y: 0.35,
					zoom: 1,
					orderBy: "position"
				};
			}

			if (!property.orderBy) {
				property.orderBy = "position";
			}
			if (!header.playerZoom) {
				header.playerZoom = 1;
			}

			var count = players.filter(function (p) {
				return p.line == player.line;
			}).length;

			if (roundProperty.hasOwnProperty('playerCountOnLine') &&
				roundProperty.playerCountOnLine[player.line]) {
				if (count < roundProperty.playerCountOnLine[player.line]) {
					count = roundProperty.playerCountOnLine[player.line];
				}
			}

			var position = players.filter(function (p) {
				return (p.line == player.line) && (p[property.orderBy] < player[property.orderBy]);
			}).length;

			var playerTop;
			var playerLeft;
			var zoom;
			var visibility;
			var display;

			if (property.hasOwnProperty('x')) {
				playerLeft = windowSize.standardWidth * property.x;
			} else {
				var left = property.left;
				var right = property.right;
				playerLeft = windowSize.standardWidth * (left + (right - left) / count * (position + 0.5));
			}

			if (property.hasOwnProperty('y')) {
				playerTop = windowSize.standardHeight * property.y;
			} else {
				var top = property.top;
				var bottom = property.bottom;
				playerTop = windowSize.standardHeight * (top + (bottom - top) / count * (position + 0.5));
			}

			if (property.hasOwnProperty('zoom')) {
				zoom = property.zoom * windowSize.objectZoom * header.playerZoom;
			} else {
				zoom = windowSize.objectZoom * header.playerZoom;
			}

			if (property.hasOwnProperty('invisible')) {
				visibility = "hidden";
				display = "none";
			} else {
				visibility = "visible";
				display = "inline";
			}

			var transformStr = "translate3d(" + playerLeft + "px, " + playerTop + "px, 0) ";
			transformStr += "scale(" + zoom + "," + zoom + ")";

			return {
				position: 'absolute',
				// left : playerLeft + 'px',
				// top : playerTop + 'px',
				transform: transformStr,
				visibility: visibility,
				display: display,
				'z-index': player["position"]
			};
		}

		/** 伸縮が必要なアイテムのCSS情報を取得する
		 * @param {object} item アイテム情報
		 * @param {object} length 文字列長
		 * @param {object} player プレイヤー情報
		 * @return {object} CSSオブジェクト
		 **/
		function getItemCSS(item, length, player) {
			var css = {};

			if (item.hasOwnProperty('vtrans')) {
				css.transform = 'scale(1,' + (item.vtrans / length) + ')';
				// css["transform-origin"] = 'inherit';
			}
			if (item.hasOwnProperty('htrans')) {
				css.transform = 'scale(' + (item.htrans / length) + ',1)';
				// css["transform-origin"] = 'inherit';
			}

			return css;
		}

		/** 値により背景色が変わるアイテムのCSS情報を取得する（主に予選順位用）
		 * @param {object} item アイテム情報
		 * @param {object} rank 順位
		 * @return {object} CSSオブジェクト
		 **/
		function getRankColorCSS(item, rank) {
			if (item.hasOwnProperty('rankColor')) {
				return {
					'backgroundColor': 'rgb(' + item.rankColor.filter(function (element) {
						return element.maxRank >= rank;
					})[0].color + ')'
				};
			}
			return null;
		}

		/** 表示用の値を取得する
		 * @param {object} item item.json等に定義された表示方法
		 * @param {number/string} value 本当の値
		 * @return {string} 表示用の値
		 **/
		function getDisplayValue(item, value) {
			// nullやゼロの場合表示しない指定がされており、実際の値がnullやゼロの場合
			if (item.hasOwnProperty('invisibleWhenZeroOrNull') && (value == 0 || value == null)) {
				return "";

				// 文字の繰り返しが指定されている場合
			} else if (item.hasOwnProperty('repeatChar')) {
				// 数値でない場合
				if (!(parseInt(value) > 0)) {
					// 真偽値の場合、true,falseで対応
					if (typeof value === 'boolean') {
						if (value) {
							return item.repeatChar.split(',')[0];
						} else {
							return item.repeatChar.split(',')[1];
						}
					} else {
						if (item.hasOwnProperty("blankChar")){
							return item.blankChar;
						} else{
							return "";
						}
					}
				}
				if(item.hasOwnProperty("blankChar")){
					return Array(parseInt(value) + 1).join(item.repeatChar) + item.blankChar.substring(parseInt(value),item.blankChar.length);					
				} else {
					return Array(parseInt(value) + 1).join(item.repeatChar);
				}

				// DNQが指定されていて、それ以上の値の場合
			} else if (item.hasOwnProperty('dnq') && value >= item.dnq) {
				return "DNQ";

				// 普通の場合
			} else {
				var prefix = "";
				var suffix = "";
				if (item.hasOwnProperty('prefix')) {
					prefix = item.prefix;
				}
				if (item.hasOwnProperty('suffix')) {
					suffix = item.suffix;
				}

				// suffixに'th'が指定されている場合は、valueに応じてst,nd,rdに変換
				if (angular.isNumber(value)) {
					if (suffix == 'th') {
						if ([1, 21, 31, 41, 51, 61, 71, 81, 91].indexOf(value % 100) >= 0) {
							suffix = 'st';
						} else if ([2, 22, 32, 42, 52, 62, 72, 82, 92].indexOf(value % 100) >= 0) {
							suffix = 'nd';
						} else if ([3, 23, 33, 43, 53, 63, 73, 83, 93].indexOf(value % 100) >= 0) {
							suffix = 'rd';
						}
					}
				}

				return prefix + value + suffix;
			}
		}

		/** 問題数を進める
		 * @param {object} players プレイヤー情報
		 * @param {object} header ヘッダ情報
		 **/
		function addQCount(players, header, property) {
			// 問題数を進める
			header.qCount++;
			// 休みの人の対応
			angular.forEach(players, function (player) {
				if (player.status == "preabsent") {
					player.status = "absent";
				} else if (player.status == "absent") {
					if (player.absent >= 2) {
						player.absent--;
					} else if (player.absent == 1) {
						player.absent = 0;
						player.status = "normal";
						editTweet(header.tweets, property.tweet["comeback"], player, false);
					}
				}
			});
		}

		/** モーションを設定する(アニメーションさせるため、motionとmotion2に交互に設定する)
		 * @param {object} player 設定先プレイヤー
		 * @param {object} motion 設定したいmotion
		 **/
		function setMotion(player, motion) {
			if (player.motion == "") {
				player.motion = motion;
				player.motion2 = "";
			} else {
				player.motion = "";
				player.motion2 = motion;
			}
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
											index = -1;
											return;
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
							return;
						}
					}
				});
			}
		}

		/** 履歴ファイル名の取得
		 * @return {string} 履歴ファイル名
		 **/
		function getHistoryFileName() {
			try {
				return __dirname + '/../../history/current/' + getRoundName() + '.json';
			} catch (e) {
				return '../../history/current/' + getRoundName() + '.json';
			}
		}

		/** エントリーファイル名の取得
		 * @return {string} 履歴ファイル名
		 **/
		function getEntryFileName() {
			try {
				return __dirname + '/../../history/current/' + getRoundName() + '-entry.json';
			} catch (e) {
				return '../../history/current/' + getRoundName() + '-entry.json';
			}
		}

		/** yyyyMMddHHmmss.sss形式で日時を返却する
		 * @return {string} yyyyMMddHHmmss.sss形式の日時
		 */
		function dateString() {
			return $filter('date')(new Date(), 'yyyyMMddHHmmss.sss');
		}

		/** ツイートファイル名の取得
		 * @return {string} ツイートファイル名
		 **/
		function getTweetFileName() {
			try {
				return __dirname + '/../../twitter/' + dateString() + "_" + getRoundName() + '.txt';
			} catch (e) {
				return '../../twitter/' + dateString() + "_" + getRoundName() + '.txt';
			}
		}

		/** 一時ツイートファイル名の取得
		 * @return {string} 一時ツイートファイル名
		 **/
		function getTempTweetFileName() {
			return './' + dateString() + "_" + getRoundName() + '.txt';
		}

		/** ツイート用画像ファイル名の取得 
		 * @return {string} ツイート用画像ファイル名
		 */
		function getCaptureFileName() {
			try {
				return __dirname + '/../../twitter/' + dateString() + "_" + getRoundName() + '.png';
			} catch (e) {
				return '../../twitter/' + dateString() + "_" + getRoundName() + '.png';
			}
		}

		/** 一時ツイート用画像ファイル名の取得 
		 * @return {string} 一時ツイート用画像ファイル名
		 **/
		function getTempCaptureFileName() {
			return './' + dateString() + "_" + getRoundName() + '.png';
		}

		/** プレイヤー情報の補完・初期化
		 * @param {array} players  プレイヤー情報
		 * @param {array} items  アイテム情報
		 * @return {array} 不足していたアイテム情報が付加されたプレイヤー情報
		 **/
		function initPlayers(players, items) {
			var toPlayers = angular.copy(players);
			angular.forEach(toPlayers, function (player) {
				angular.forEach(items, function (item) {
					if (!player.hasOwnProperty(item.key) && item.hasOwnProperty('value')) {
						player[item.key] = item.value;
					}
				});
			});
			return toPlayers;
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
				if (!browserMode() && global.gc) {
					global.gc();
					console.log("Used Memory:" + process.memoryUsage().heapUsed);
				}
			}, 60000);
			t = $interval(function () {
				scope.initialAnimation = true;
			}, 2000, 1);
		}

		/** 優勝者名の設定
		 * @param {object} scope  $scope
		 **/
		function victoryName(scope) {
			if (scope.current.players.filter(function (player) {
					return player.rank == 1;
				}).length == 1) {
				return scope.current.players.filter(function (player) {
					return player.rank == 1;
				})[0];
			} else {
				return null;
			}
		}

		/** プレイヤー変更用のモーダルウィンドウを表示
		 * @param {object} scope  $scope
		 * @param {object} player  変更したいプレイヤー
		 * @param {array} items  items
		 **/
		function changePlayer(scope, player, items) {
			angular.forEach(scope.nameList, function (participant) {
				participant.filtered = false;
			});

			scope.selectPlayer = {};

			angular.forEach(items, function (item) {
				if (item.hasOwnProperty('profile')) {
					scope.selectPlayer[item.key] = player[item.key];
				}
			});

			var modal = $uibModal.open({
				templateUrl: "../../template/selectPlayer.html",
				scope: scope,
				controller: "modal",
				backdrop: "static"
			});

			modal.result.then(function () {
				angular.forEach(scope.selectPlayer, function (value, key) {
					player[key] = value;
				});
			}, function () {});

		}

		/** 参加者フィルタ
		 * @param {object} nameList  参加者リスト
		 * @param {object} selectPlayer  検索条件
		 **/
		function filterPlayer(nameList, selectPlayer) {
			var count = 0;
			var onlyOneParticipant = {};

			angular.forEach(nameList, function (participant) {
				participant.filtered = false;

				angular.forEach(selectPlayer, function (value, attribute) {
					if (value != "" && value != null) {
						var valueStr = "" + value;
						var value2 = "" + participant[attribute];

						if (value2 == null || value2.indexOf(valueStr) == -1) {
							participant.filtered = true;
						}
					}
				});

				if (!participant.filtered) {
					count++;
					onlyOneParticipant = participant;
				}
			});

			// もし一人に絞れた場合は、selectPlayerに設定
			if (count == 1) {
				angular.forEach(selectPlayer, function (value, attribute) {
					selectPlayer[attribute] = onlyOneParticipant[attribute];
				});
			}

		}

		/** プレイヤー選択
		 * @param {object} participant  参加者(一人)
		 * @param {object} selectPlayer  検索条件
		 **/
		function setPlayer(participant, selectPlayer) {
			angular.forEach(selectPlayer, function (value, key) {
				selectPlayer[key] = participant[key];
			});
		}

		/** プレイヤー検索条件クリア
		 * @param {object} selectPlayer  検索条件
		 **/
		function clearPlayer(selectPlayer) {
			angular.forEach(selectPlayer, function (value, key) {
				selectPlayer[key] = "";
			});
		}

		/** 参加者並び替え
		 * @param {object} selectPlayer  検索条件
		 **/
		function sortPlayer(nameList, attribute, order, style) {
			nameList.sort(function (a, b) {
				var aa;
				var bb;

				if (!a.hasOwnProperty(attribute)) {
					return 1;
				}

				if (!b.hasOwnProperty(attribute)) {
					return -1;
				}

				if (style == "number") {
					aa = Number(a[attribute]);
					bb = Number(b[attribute]);
				} else {
					aa = a[attribute];
					bb = b[attribute];
				}

				if (aa < bb) {
					if (order) {
						return -1;
					} else {
						return 1;
					}
				} else if (aa > bb) {
					if (order) {
						return 1;
					} else {
						return -1;
					}
				} else {
					return 0;
				}
			});
		}

		/** プレーオフ終了
		 * @param {object} scope  $scope
		 **/
		function playoffoff(players, header) {
			// プレーオフ終了
			header.playoff = false;

			// 待機状態のプレイヤーを通常状態に戻す
			angular.forEach(players, function (player) {
				if (player.status == "wait") {
					player.status = "normal";
				}
			});
		}

		/** ツイート編集
		 * @param {array} tweets  追加先のツイートリスト
		 * @param {string} tweet  ツイートのひな型
		 * @param {object} obj  ツイートの主体となるプレイヤーまたはプレイヤーリストまたはヘッダ情報
		 * @param {boolean} top  ツイートリストの先頭に追加する場合はtrue, 末尾に追加する場合はfalse
		 **/
		function editTweet(tweets, tweet, obj, top) {
			// objが指定されていない場合は空オブジェクトを補完
			if (obj == null) {
				obj = {};
			}

			// topが指定されていない場合はfalse扱いにする
			if (top == null) {
				top = false;
			}

			// tweet内にある埋め込み文字を置換
			angular.forEach(obj, function (value, key) {
				var reg = new RegExp("\\$\\{" + key + "\\}", "g");
				tweet = tweet.replace(reg, value);
			});

			// tweetsに追加
			if (top) {
				tweets.unshift(tweet);
			} else {
				tweets.push(tweet);
			}

		}

		/** itemのCSSを編集して返却する関数
		 * @param {string} css  item.css(スペース区切り文字列）
		 * @param {object} player  player(オブジェクト)
		 * @return {array}  cssのリスト
		 */
		function mergeItemCSS(css, player) {
			var cssArray = [];
			if (angular.isString(css)) {
				cssArray = css.split(" ");
			}
			angular.forEach(player, function (value, key) {
				if (value === true) {
					cssArray.push(key);
				}
			});
			cssArray.push(player.status);

			return cssArray;
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
		 * @param {number} wait 待ち時間（ミリ秒）
		 */
		function pushed(scope, wait) {
			scope.pushable = false;
			var t;
			t = $interval(function () {
				scope.pushable = true;
			}, wait, 1);
		}

		/** プロセス間通信で最新履歴を送る
		 * @param {object} scope $scope
		 */
		function ipcSendCurrent(scope) {
			console.log("ipc.send(createHist)");
			ipc.send('createHist', {
				roundName: getRoundName(),
				hist: {
					header: scope.current.header,
					players: scope.current.players
				},
				timer: qCommon.timer
			});
		}

		/** 
		 * サーバに状況をアップロードする 
		 * 
		 * */
		function uploadStatus(round, scope) {
			const url = "https://a2v4fab6o7.execute-api.ap-northeast-1.amazonaws.com/default/union-put";

			// API呼び出し
			$http({
				method: 'POST',
				url: $sce.trustAsResourceUrl(url),
				headers: {
					'x-api-key': $location.search()["key"]
				},
				data: {
					"round": round,
					"id": "status",
					"item": {
						roundName: getRoundName(),
						hist: {
							header: scope.current.header,
							players: scope.current.players
						},
						timer: qCommon.timer
					}
				}
			}).then(function (data) {
				console.log("成功しました。");
			}, function (err) {
				console.log("失敗しました。");
				console.log(err);
			});
		}

		/** 
		 * サーバから状況をダウンロードする 
		 * 
		 * */
		function downloadStatus(scope) {
			const url = "https://a2v4fab6o7.execute-api.ap-northeast-1.amazonaws.com/default/union-get?id=status&round=" + getRoundName();

			// API呼び出し
			$http({
				method: 'GET',
				url: $sce.trustAsResourceUrl(url),
				headers: {}
			}).then(function (data) {
				var arg = data.data.item;
				if (arg.hist) {
					console.log("ダウンロード成功しました。");
					refreshCurrent(arg.hist, scope);
					scope.timer = arg.timer;
					qCommon.timer = scope.timer;

					if (scope.timer['destination'] != null) {
						scope.timer['destination'] = new Date(scope.timer['destination']);
					}
					if (scope.timer['restTime'] != null) {
						scope.timer['restTime'] = new Date(scope.timer['restTime']);
					}
				}

				if (!viewMode() && browserMode()) {
					// 履歴を作成する
					createHist(scope);
				}
			}, function (err) {
				console.log("失敗しました。");
				console.log(err);
			});
		}

		function getStringImage(params) {
			var paramsKey = JSON.stringify(params);
			if (textImages[paramsKey]) {
				return textImages[paramsKey];
			}

			if (params === null || params === undefined) {
				params = {};
			}

			// 対象文字列を取得する
			var text = params.text;
			// 色を取得する
			var color = params.color;
			// 縦書きフラグを取得する
			var vertical = params.vertical;
			// 画像の高さを設定する
			var height = 280;
			// フォントサイズを指定する
			var fontHeight = 240;
			// フォントを設定する
			var font = 'bold ' + fontHeight + "px 'FG丸ｺﾞｼｯｸ体Ca-U'";
			// Canvasを初期化する
			const canvasArray = angular.element(document.createElement('canvas'));
			const canvas = canvasArray[0];
			const ctx = canvas.getContext("2d");

			//縦書きの場合
			if (vertical) {
				// 各文字の横幅
				var widthArray = [];

				// 各文字の幅を計測する
				for (let i = 0; i < text.length; i++) {
					let t = text.substr(i, 1);
					canvas.width = 10;
					canvas.height = height;
					ctx.font = font;
					var textMetrics = ctx.measureText(t);
					widthArray[i] = textMetrics.width;
					console.log(t, textMetrics.width);
				}
				// 描画する
				var maxWidth = Math.max.apply(null, widthArray);
				var maxHeight = fontHeight * text.length + height - fontHeight;

				canvas.width = maxWidth;
				canvas.height = maxWidth * 3;
				ctx.font = font;
				ctx.fillStyle = color;

				// 縦横比３：１になるよう圧縮
				console.log(maxWidth, maxHeight, (maxWidth / maxHeight) * 3);
				ctx.scale(1, (maxWidth / maxHeight) * 3);

				for (var i = 0; i < text.length; i++) {
					var t = text.substr(i, 1);
					if ("「」ー―⊂".indexOf(t) >= 0) {
						console.log("右90度回転:", t);
						ctx.save();
						ctx.translate((maxWidth - widthArray[i]) / 2, i * fontHeight);
						ctx.rotate((90 * Math.PI) / 180);
						ctx.fillText(t, (maxWidth - widthArray[i]) / 2 + 40, -40);
						ctx.restore();
					} else if ("。".indexOf(t) >= 0) {
						console.log("。");
						ctx.fillText(t, maxWidth / 2, i * fontHeight + fontHeight);
					} else {
						ctx.fillText(
							t,
							(maxWidth - widthArray[i]) / 2,
							i * fontHeight + fontHeight
						);
					}
			}

				// 横書きの場合
			} else {
				// 画像の幅を計測する
			canvas.width = 10;
				canvas.height = height;
			ctx.font = font;
				let textMetrics = ctx.measureText(text);

				// 描画する
				let maxHeight = height;
				let maxWidth = textMetrics.width;
				canvas.height = height;
				canvas.width = height * 3;
			ctx.font = font;
				ctx.fillStyle = color;

				// 縦横比１：３になるよう圧縮
				console.log(maxWidth, maxHeight, (maxHeight / maxWidth) * 3);
				ctx.scale((maxHeight / maxWidth) * 3, 1);

				ctx.fillText(text, 0, fontHeight);
			}

			// 画像データ(base64)を取得する
			var canvasBase64 = canvas.toDataURL();
			textImages[paramsKey] = canvasBase64;
			return canvasBase64;
		}

	}
]);