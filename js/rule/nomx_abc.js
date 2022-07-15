'use strict';

var appName = "myxQuizMain";
var app = angular.module(appName);

/*******************************************************************************
 * rule - ラウンド特有のクイズのルール・画面操作の設定
 ******************************************************************************/
app.factory('rule', ['qCommon', function (qCommon) {

	var rule = {};
	var win = qCommon.win;
	var lose = qCommon.lose;
	var setMotion = qCommon.setMotion;
	var addQCount = qCommon.addQCount;

	rule.judgement = judgement;
	rule.calc = calc;

	/*****************************************************************************
	 * header - ルール固有のヘッダ
	 ****************************************************************************/
	rule.head = [{
		key: "mode",
		value: "position",
		style: "string"
	}];

	/*****************************************************************************
	 * items - ルール固有のアイテム
	 ****************************************************************************/
	rule.items = [{
		key: "o",
		value: 0,
		style: "number",
		css: "o"
	}, {
		key: "x",
		value: 0,
		style: "number",
		css: "x"
	}, {
		key: "x2",
		value: 0,
		style: "number",
		css: "x2",
		prefix: "(+",
		suffix: ")"
	}, {
		key: "priority",
		order: [{
			key: "status",
			order: "desc",
			alter: ["win", 1, 0]
		}, {
			key: "o",
			order: "desc"
		}, {
			key: "x",
			order: "asc"
		}]
	}];

	/*****************************************************************************
	 * tweet - ルール固有のツイートのひな型
	 ****************************************************************************/
	rule.tweet = {
		o: "${handleName}◯　→${o}◯ ${x}×",
		x: "${handleName}×　→${o}◯ ${x}× ${absent}休"
	};

	/*****************************************************************************
	 * lines - ルール固有のプレイヤー配置
	 ****************************************************************************/
	rule.lines = {
		"line1": {
			"left": 0,
			"right": 0.7,
			"y": 0.35,
			"zoom": 1,
			"orderBy": "position"
		}
	};

	/*****************************************************************************
	 * actions - プレイヤー毎に設定する操作の設定
	 ****************************************************************************/
	rule.actions = [
		/*****************************************************************************
		 * 正解時
		 ****************************************************************************/
		{
			name: "○",
			css: "action_o",
			button_css: "btn btn-primary btn-lg",
			keyArray: "k1",
			enable0: function (player, players, header, property) {
				return (player.status == "normal" && !header.playoff);
			},
			action0: function (player, players, header, property) {
				setMotion(player, "o");
				player.o++;
				if (property.xcombo) {
					player.combo = false;
				}
				addQCount(players, header, property);
			},
			tweet: "o"
		},
		/*****************************************************************************
		 * 誤答時
		 ****************************************************************************/
		{
			name: "×",
			css: "action_x",
			button_css: "btn btn-danger btn-lg",
			keyArray: "k2",
			enable0: function (player, players, header) {
				return (player.status == "normal" && !header.playoff);
			},
			action0: function (player, players, header, property) {
				setMotion(player, "x");
				player.x++;
				if (property.xcombo && player.combo) {
					player.x++;
				}
				player.combo = true;
				if (property.penalty > 0) {
					player.absent = property.penalty;
					player.status = "preabsent";
				}
				if (property.freeze) {
					player.absent = player.x;
					player.status = "preabsent";
				}
				if (property.swedish && Array.isArray(property.swedish)) {
					if (property.swedish.length > player.o) {
						player.x += (-1) + property.swedish[player.o];
					} else {
						player.x += (-1) + property.swedish[property.swedish.length - 1];
					}
				}
				addQCount(players, header, property);
			},
			tweet: "x"
		}];

	/*****************************************************************************
	 * global_actions - 全体に対する操作の設定
	 ****************************************************************************/
	rule.global_actions = [
		/*****************************************************************************
		 * スルー
		 ****************************************************************************/
		{
			name: "thru",
			button_css: "btn btn-default",
			group: "rule",
			keyboard: "Space",
			enable0: function (players, header) {
				return true;
			},
			action0: function (players, header, property) {
				addQCount(players, header, property);
			},
			tweet: "thru"
		}];

	/*****************************************************************************
	 * judgement - 操作終了時等の勝敗判定
	 * 
	 * @param {Array} players - players
	 * @param {Object} header - header
	 * @param {Object} property - property
	 ****************************************************************************/
	function judgement(players, header, property) {
		angular.forEach(players.filter(function (item) {
			/* rankがない人に限定 */
			return (item.rank == 0);
		}), function (player, i) {
			/* win条件 */
			if (player.o >= property.winningPoint) {

				win(player, players, header, property);
				qCommon.timerStop();
			}
			/* lose条件 */
			if (player.x >= property.losingPoint) {
				lose(player, players, header, property);
				qCommon.timerStop();
			}
		});
	}

	/*****************************************************************************
	 * calc - 従属変数の計算をする
	 * 
	 * @param {Array} players - players
	 * @param {Object} items - items
	 ****************************************************************************/
	function calc(players, header, items, property) {
		angular.forEach(players, function (player, index) {
			// キーボード入力時の配列の紐付け ローリング等の特殊形式でない場合はこのままでOK
			player.line = "line1";
			player.keyIndex = index;

			// xcomboがあるとき、表示用×増加数を設定する
			if (property.xcombo) {
				if (player.status == "normal") {
					if (player.combo) {
						player.x2 = 2;
					} else {
						player.x2 = 1;
					}
				} else {
					player.x2 = 0;
				}
			}

			if (property.swedish && Array.isArray(property.swedish)) {
				if (player.status == "normal") {
					if (property.swedish.length > player.o) {
						player.x2 = property.swedish[player.o];
					} else {
						player.x2 = property.swedish[property.swedish.length - 1];
					}
				} else {
					player.x2 = 0;
				}
			}
		});
	}

	return rule;
}]);
