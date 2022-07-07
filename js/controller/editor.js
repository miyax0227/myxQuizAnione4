'use strict';
var appName = "myxQuizEditor";
var app = angular.module(appName, ["ui.bootstrap", "ngAnimate", "ui.sortable", "ui.ace",
	"angular-clipboard", "ngTwitter", "ngSanitize"
]);

/** エディタ用コントローラ */
app.controller('main', ['$scope', 'qeditor', '$interval', 'round', 'rule', 'css', '$sce',
	function ($scope, qeditor, $interval, round, rule, css, $sce) {
		const fs = require('fs');

		$scope.rounds = [];
		$scope.csses = [];
		$scope.rules = [];
		$scope.data = "";
		$scope.window = {};
		$scope.twitter = {};

		$scope.styles = ["number", "string", "boolean", "null"];
		$scope.orders = ["desc", "asc"];
		$scope.editing = false;
		refresh();

		$scope.closeAll = closeAll;
		$scope.refresh = refresh;
		$scope.openData = openData;
		$scope.saveData = saveData;
		$scope.addElement = addElement;
		$scope.deleteElement = deleteElement;
		$scope.openRound = openRound;
		$scope.copyRound = copyRound;
		$scope.deleteRound = deleteRound;
		$scope.openRule = openRule;
		$scope.copyRule = copyRule;
		$scope.deleteRule = deleteRule;
		$scope.openCss = openCss;
		$scope.copyCss = copyCss;
		$scope.deleteCss = deleteCss;
		$scope.aceLoaded = aceLoaded;
		$scope.aceLoadedCSS = aceLoadedCSS;

		/** ファイルリストをリフレッシュする
		 */
		function refresh() {
			$scope.rounds = qeditor.getFileList(__dirname + '/round', false);
			$scope.csses = qeditor.getFileList(__dirname + '/json/css', true, 'json');
			$scope.rules = qeditor.getFileList(__dirname + '/json/rule', true, 'json');

			// フローチャートの作成
			var flowchart = "";
			var flowchartObject = {
				"nameList": "origin"
			};
			var tmpId = 0;

			flowchart += "graph TB;\n";
			flowchart += "origin[nameList];\n";
			flowchart += "style origin fill:black,stroke:black;\n";
			mermaid.flowchartConfig = {
				width: "100%"
			}

			function getFilterString(filter) {
				if (angular.isString(filter)) {
					return "|" + filter + "|";
				} else if (angular.isObject(filter)) {
					if (filter.oper == "~") {
						return "|" + filter.crit + "<=" + filter.param + "<=" + filter.crit2 + "|";
					} else if (filter.oper == "in" && angular.isArray(filter.crit)) {
						return "|" + filter.param + " in " + filter.crit[0] + "..|";
					} else {
						return "|" + filter.param + filter.oper + filter.crit + "|";
					}
				}
				return "";
			}

			function toFlowchart(id, arr) {
				angular.forEach(arr, function (obj) {
					if (angular.isObject(obj) && obj.hasOwnProperty('source')) {
						// 文字列の場合
						if (angular.isString(obj.source)) {
							flowchart += flowchartObject[obj.source] + "-->" + getFilterString(obj.filter) + id + ";\n";

							// 配列の場合
						} else if (angular.isArray(obj.source)) {
							var currentTmpId = "tmp" + tmpId++;
							flowchart += currentTmpId + "(( ));\n";
							flowchart += "style " + currentTmpId + " fill:black,stroke:black;\n"
							flowchart += currentTmpId + "-->" + getFilterString(obj.filter) + id + ";\n";
							toFlowchart(currentTmpId, obj.source);

							// オブジェクトの場合
						} else if (angular.isObject(obj.source)) {
							var currentTmpId = "tmp" + tmpId++;
							flowchart += currentTmpId + "(( ));\n";
							flowchart += "style " + currentTmpId + " fill:black,stroke:black;\n"
							flowchart += currentTmpId + "-->" + getFilterString(obj.filter) + id + ";\n";
							toFlowchart(id, [obj.source]);

						}
					}
				});
			}

			angular.forEach($scope.rounds, function (round, index) {
				flowchartObject[round] = "id" + index;
				flowchart += flowchartObject[round] + "[" + round + "];\n";
				flowchart += "style " + flowchartObject[round] + " fill:black,stroke:black;\n"
			});

			angular.forEach($scope.rounds, function (round, index) {
				var filename = __dirname + '/round/' + round + "/entry.json";
				toFlowchart(flowchartObject[round], JSON.parse(fs.readFileSync(filename, 'utf-8')));
			});


			mermaid.render('flowchar', flowchart, function (svgGraph) {
				console.log(flowchart);
				console.log(svgGraph);
				$scope.flowchart = $sce.trustAsHtml(svgGraph);
			});
		}

		/** すべて閉じる
		 */
		function closeAll() {
			round.closeRound();
			rule.closeRule();
			css.closeCss();
			$scope.data = "";
		}

		/** 開く
		 * @param {string} name データの名前
		 */
		function openData(name) {
			closeAll();
			$scope.data = name;
			qeditor.loadData(name, $scope);
		}

		/** 要素を追加する
		 * @param {string} name データの名前
		 */
		function addElement(name) {
			qeditor.addElement(name, $scope);
		}

		/** 要素を削除する
		 * @param {string} name データの名前
		 * @param {number} index 削除対象要素の番号
		 */
		function deleteElement(name, index) {
			qeditor.deleteElement(name, index, $scope);
		}

		/** データを保存する
		 * @param {string} name データの名前
		 */
		function saveData(name) {
			qeditor.saveData(name, $scope);
		}

		/** ラウンドを開く
		 * @param {string} name ラウンドの名前
		 */
		function openRound(name) {
			closeAll();
			round.load(name);
		}

		/** ラウンドをコピーする
		 * @param {string} name ラウンドの名前
		 */
		function copyRound(name) {
			var oldRound = __dirname + '/round/' + name;
			var newRound = "";

			qeditor.inputBox("新しいラウンドの名前を入力してください。", function (result) {
				newRound = __dirname + '/round/' + result.inputString;

				fs.mkdirSync(newRound);
				qeditor.copyFile(oldRound + '/board.json', newRound + '/board.json');
				qeditor.copyFile(oldRound + '/board.html', newRound + '/board.html');
				qeditor.copyFile(oldRound + '/entry.json', newRound + '/entry.json');
				qeditor.copyFile(oldRound + '/property.json', newRound + '/property.json');

				// ファイルリストを読み込み直す
				refresh();
			});
		}

		/** ラウンドを削除する
		 * @param {string} name ラウンドの名前
		 */
		function deleteRound(name) {
			var oldRound = __dirname + '/round/' + name;

			qeditor.confirm("ラウンド" + name + "を削除します。\nよろしいですか？", function () {

				// ファイルを削除
				var targetRemoveFiles = fs.readdirSync(oldRound);
				for (var file in targetRemoveFiles) {
					fs.unlinkSync(oldRound + "/" + targetRemoveFiles[file]);
				}
				// フォルダを削除
				fs.rmdirSync(oldRound);

				// ファイルリストを読み込み直す
				refresh();
			});
		}

		/** ルールを開く
		 * @param {string} name ルールの名前
		 */
		function openRule(name) {
			closeAll();
			rule.load(name);
		}

		/** ルールをコピーする
		 * @param {string} name ルールの名前
		 */
		function copyRule(name) {
			var oldRuleJs = __dirname + '/js/rule/' + name + '.js';
			var oldRuleJson = __dirname + '/json/rule/' + name + '.json';

			qeditor.inputBox("新しいルールの名前を入力してください。", function (result) {
				var newRuleJs = __dirname + '/js/rule/' + result.inputString + '.js';
				var newRuleJson = __dirname + '/json/rule/' + result.inputString + '.json';

				qeditor.copyFile(oldRuleJs, newRuleJs);
				qeditor.copyFile(oldRuleJson, newRuleJson);

				// ファイルリストを読み込み直す
				refresh();

			});
		}

		/** ルールを削除する
		 * @param {string} name ルールの名前
		 */
		function deleteRule(name) {
			var oldRuleJs = __dirname + '/js/rule/' + name + '.js';
			var oldRuleJson = __dirname + '/json/rule/' + name + '.json';

			qeditor.confirm("ルール" + name + "を削除します。\nよろしいですか？", function () {
				// ファイル削除
				fs.unlinkSync(oldRuleJs);
				fs.unlinkSync(oldRuleJson);

				// ファイルリストを読み込み直す
				refresh();

			});
		}

		/** CSSを開く
		 * @param {string} name CSSの名前
		 */
		function openCss(name) {
			closeAll();
			css.load(name);
		}

		/** CSSをコピーする
		 * @param {string} name CSSの名前
		 */
		function copyCss(name) {
			// TODO:
		}

		/** CSSを削除する
		 * @param {string} name CSSの名前
		 */
		function deleteCss(name) {
			// TODO:
		}

		/** aceエディタ起動処理
		 * @param {object} _editor editorオブジェクト
		 */
		function aceLoaded(_editor) {
			_editor.commands.addCommand({
				Name: "beautify",
				bindKey: {
					win: "Ctrl-Shift-F",
					mac: "Ctrl-Shift-F"
				},
				exec: function (editor) {
					var session = editor.getSession();
					session.setValue(qeditor.beautify(session.getValue()));
				}
			});
		}

		/** aceエディタ起動処理(CSS用)
		 * @param {object} _editor editorオブジェクト
		 */
		function aceLoadedCSS(_editor) {
			_editor.commands.addCommand({
				Name: "beautify",
				bindKey: {
					win: "Ctrl-Shift-F",
					mac: "Ctrl-Shift-F"
				},
				exec: function (editor) {
					var session = editor.getSession();
					session.setValue(qeditor.beautifyCSS(session.getValue()));
				}
			});
		}

	}
]);

/** ラウンド編集用のコントローラ */
app.controller('roundCtrl', ['$scope', 'round', function ($scope, round) {
	$scope.round = round;
}]);

/** ルール編集用のコントローラ */
app.controller('ruleCtrl', ['$scope', 'rule', function ($scope, rule) {
	$scope.rule = rule;
}]);

/** CSS編集用のコントローラ */
app.controller('cssCtrl', ['$scope', 'css', function ($scope, css) {
	$scope.css = css;
}]);

/** モーダルウィンドウのコントローラ */
app.controller('modal', ['$scope', '$uibModalInstance', 'myMsg',
	function ($scope, $uibModalInstance, myMsg) {
		// メッセージ表示
		$scope.msg = myMsg.msg;
		$scope.isArray = myMsg.isArray;

		$scope.input = {};
		$scope.input.inputString = "";

		/* modalOK - OKボタン押下 */
		$scope.modalOK = function () {
			$uibModalInstance.close($scope.input);
		};

		/* modalCancel - Cancelボタン押下 */
		$scope.modalCancel = function () {
			$uibModalInstance.dismiss($scope.input);
		};
	}
]);

/* ディレクティブ */
app.directive('editorRoundBoard', function () {
	return {
		templateUrl: './template/editor-round-board.html'
	};
});

app.directive('editorRoundEntry', function () {
	return {
		templateUrl: './template/editor-round-entry.html'
	};
});

app.directive('editorRoundProperty', function () {
	return {
		templateUrl: './template/editor-round-property.html'
	};
});

app.directive('editorRoundExplain', function () {
	return {
		templateUrl: './template/editor-round-explain.html'
	};
});

app.directive('editorRuleHeader', function () {
	return {
		templateUrl: './template/editor-rule-header.html'
	};
});

app.directive('editorRuleItems', function () {
	return {
		templateUrl: './template/editor-rule-items.html'
	};
});

app.directive('editorRulePriority', function () {
	return {
		templateUrl: './template/editor-rule-priority.html'
	};
});

app.directive('editorRuleTweet', function () {
	return {
		templateUrl: './template/editor-rule-tweet.html'
	};
});

app.directive('editorRuleActions', function () {
	return {
		templateUrl: './template/editor-rule-actions.html'
	};
});

app.directive('editorRuleJudgement', function () {
	return {
		templateUrl: './template/editor-rule-judgement.html'
	};
});

app.directive('editorRuleCalc', function () {
	return {
		templateUrl: './template/editor-rule-calc.html'
	};
});

app.directive('editorRuleLines', function () {
	return {
		templateUrl: './template/editor-rule-lines.html'
	};
});

app.directive('editorCssIncludes', function () {
	return {
		templateUrl: './template/editor-css-includes.html'
	};
});

app.directive('editorCssVariables', function () {
	return {
		templateUrl: './template/editor-css-variables.html'
	};
});

app.directive('editorCssLines', function () {
	return {
		templateUrl: './template/editor-css-lines.html'
	};
});

app.directive('editorCssItems', function () {
	return {
		templateUrl: './template/editor-css-items.html'
	};
});

app.directive('editorCssImages', function () {
	return {
		templateUrl: './template/editor-css-images.html'
	};
});

app.directive('editorCssButtons', function () {
	return {
		templateUrl: './template/editor-css-buttons.html'
	};
});

app.directive('editorTwitter', function () {
	return {
		templateUrl: './template/editor-twitter.html'
	};
});

app.directive('uiClipboard', function () {
	return {
		templateUrl: './template/clipboard.html',
		scope: {
			"words": "="
		}
	};
});