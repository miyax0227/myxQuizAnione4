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
	}, {
		key: "nowLot",
		value: 0,
		style: "number"
	}, {
		key: "nowMember",
		value: 1,
		style: "number"
	}];

	/*****************************************************************************
	 * items - ルール固有のアイテム
	 ****************************************************************************/
	rule.items = [{
			key: "nameLat",
			css: "nameLat",
			htrans: 4.1
		}, {
			key: "o",
			value: 0,
			style: "number",
			css: "o",
			chance: true
		}, {
			key: "x",
			value: 0,
			style: "number",
			css: "x",
			invisibleWhenZeroOrNull: true,
			repeatChar: "×",
			pinch: true
		}, {
			key: "oo1",
			css: "oo oo1",
			value: 0,
			invisibleWhenZeroOrNull: true,
			repeatChar: "○"
		}, {
			key: "oo2",
			css: "oo oo2",
			value: 0,
			invisibleWhenZeroOrNull: true,
			repeatChar: "○"
		}, {
			key: "oo3",
			css: "oo oo3",
			value: 0,
			invisibleWhenZeroOrNull: true,
			repeatChar: "○"
		}, {
			key: "oo4",
			css: "oo oo4",
			value: 0,
			invisibleWhenZeroOrNull: true,
			repeatChar: "○"
		}, {
			key: "oo5",
			css: "oo oo5",
			value: 0,
			invisibleWhenZeroOrNull: true,
			repeatChar: "○"
		},

		{
			key: "sl1",
			css_img: "sl sl1",
			css_img_file: {
				"1": "select.png"
			}
		}, {
			key: "sl2",
			css_img: "sl sl2",
			css_img_file: {
				"1": "select.png"
			}
		}, {
			key: "sl3",
			css_img: "sl sl3",
			css_img_file: {
				"1": "select.png"
			}
		}, {
			key: "sl4",
			css_img: "sl sl4",
			css_img_file: {
				"1": "select.png"
			}
		}, {
			key: "sl5",
			css_img: "sl sl5",
			css_img_file: {
				"1": "select.png"
			}
		}, {
			key: "priority",
			order: [{
				key: "status",
				order: "desc",
				alter: ["win", 1, "lose", -1, 0]
			}, {
				key: "o",
				order: "desc"
			}, {
				key: "x",
				order: "asc"
			}]
		}
	];

	/*****************************************************************************
	 * decor - 装飾用クラスリスト
	 ****************************************************************************/
	rule.decor = ["chance", "pinch"];

	/*****************************************************************************
	 * tweet - ルール固有のツイートのひな型
	 ****************************************************************************/
	rule.tweet = {
		o1: "${name} 1人目 ${name1}◯　→${o}◯ ${x}×",
		o2: "${name} 2人目 ${name2}◯　→${o}◯ ${x}×",
		o3: "${name} 3人目 ${name3}◯　→${o}◯ ${x}×",
		o4: "${name} 4人目 ${name4}◯　→${o}◯ ${x}×",
		o5: "${name} 5人目 ${name5}◯　→${o}◯ ${x}×",
		x: "${name}×　→${o}◯ ${x}×"
	};

	/*****************************************************************************
	 * actions - プレイヤー毎に設定する操作の設定
	 ****************************************************************************/
	rule.actions = [
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
				addQCount(players, header, property);
			},
			tweet: "x"
		},
		/*************************************************************************
		 * プレイヤー毎の正解
		 ************************************************************************/
		{
			name: "1",
			css: "action_sl1",
			button_css: "btn btn-info btn-lg",
			enable0: function (player) {
				return enable00(1, player);
			},
			action0: function (player, players, header, property) {
				action00(1, player, players, header, property);
			},
			tweet: "o1"
		}, {
			name: "2",
			css: "action_sl2",
			button_css: "btn btn-info btn-lg",
			enable0: function (player) {
				return enable00(2, player);
			},
			action0: function (player, players, header, property) {
				action00(2, player, players, header, property);
			},
			tweet: "o2"
		}, {
			name: "3",
			css: "action_sl3",
			button_css: "btn btn-info btn-lg",
			enable0: function (player) {
				return enable00(3, player);
			},
			action0: function (player, players, header, property) {
				action00(3, player, players, header, property);
			},
			tweet: "o3"
		}, {
			name: "4",
			css: "action_sl4",
			button_css: "btn btn-info btn-lg",
			enable0: function (player) {
				return enable00(4, player);
			},
			action0: function (player, players, header, property) {
				action00(4, player, players, header, property);
			},
			tweet: "o4"
		}, {
			name: "5",
			css: "action_sl5",
			button_css: "btn btn-info btn-lg",
			enable0: function (player) {
				return enable00(5, player);
			},
			action0: function (player, players, header, property) {
				action00(5, player, players, header, property);
			},
			tweet: "o5"
		}
	];

	function enable00(p, player) {
		return (player["sl" + p] == 1) && (player.status == "normal");
	}

	function action00(p, player, players, header, property) {
		player["oo" + p]++;
		setMotion(player, "o");
		addQCount(players, header, property);
	};



	/*****************************************************************************
	 * global_actions - 全体に対する操作の設定
	 ****************************************************************************/
	rule.global_actions = [
		/*****************************************************************************
		 * スルー
		 ****************************************************************************/
		{
			name: "スルー",
			button_css: "btn btn-default",
			group: "rule",
			keyboard: "Space",
			tooltip: "どのプレイヤーも解答権を得なかった場合押してください",
			enable0: function (players, header) {
				return true;
			},
			action0: function (players, header, property) {
				addQCount(players, header, property);
			},
			tweet: "thru"
		}
		/*****************************************************************************
		 * 次の区（メンバー）へ
		 ****************************************************************************/
		/*
		, {
			name: "",
			button_css: "btn btn-default",
			group: "rule",
			indexes0: function (players, header, property) {
				return property.lots;
			},
			enable1: function (index, players, header) {
				return true;
			},
			action1: function (index, players, header, property) {
				header.nowLot = index;
				header.nowMember = 1;
			}
		}
		*/
	];

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
			}
			/* lose条件 */
			if (player.x >= property.losingPoint) {
				lose(player, players, header, property);
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
		//nowLot初期設定
		if (header.nowLot == 0) {
			header.nowLot = property.nowLot;
		}

		var pos = 0;
		angular.forEach(players, function (player, index) {
			// nameLat
			player.nameLat = player.name;

			// 位置計算
			if (player.lot == header.nowLot) {
				player.line = null;
				player.keyIndex = pos;
				player.position = (pos++);
			} else if (player.lot > header.nowLot) {
				player.line = "left";
				player.keyIndex = 999;
				player.position = 0;
			} else {
				player.line = "right";
				player.keyIndex = 999;
				player.position = 0;
			}

			// chance・pinchの計算
			player.chance = (property.winningPoint - player.o == 1);
			player.pinch = (property.losingPoint - player.x == 1);

			// oの計算
			player.o = player.oo1 + player.oo2 + player.oo3 + player.oo4 + player.oo5;

			// unplayingの設定
			for (var i = 1; i <= 5; i++) {
				player["unplaying" + i] = (player.status == "lose");
			}

			// slの設定
			for (var i = 1; i <= 5; i++) {
				player["sl" + i] = (player.status == "normal" && player["oo" + i] < property.norma[i - 1] &&
					player.o >= property.seed[i - 1]) ? 1 : 0;
			}

			// キーボード入力時の配列の紐付け ローリング等の特殊形式でない場合はこのままでOK
			// player.keyIndex = index;

		});
	}

	return rule;
}]);