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
		value: 0,
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
			invisibleWhenZeroOrNull: true
		}, {
			key: "oo2",
			css: "oo oo2",
			value: 0,
			invisibleWhenZeroOrNull: true
		}, {
			key: "oo3",
			css: "oo oo3",
			value: 0,
			invisibleWhenZeroOrNull: true
		}, {
			key: "oo4",
			css: "oo oo4",
			value: 0,
			invisibleWhenZeroOrNull: true
		}, {
			key: "oo5",
			css: "oo oo5",
			value: 0,
			invisibleWhenZeroOrNull: true
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
		o: "${name}◯　→${o}pts ${x}×",
		x: "${name}×　→${o}pts ${x}×",
		next: "${nowMember}人目に交代",
		prev: "${nowMember}人目に交代"
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
				player["oo" + header.nowMember]++;
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
				players.map(function (p) {
					if (p !== player && p.lot == header.nowLot && p.status == "normal") {
						p.o++;
					}
				})
				if (player.x >= 2 && !property.retireRule) {
					player.status = "wait";
					player.o = Math.floor(player.o / 2);
					player["unplaying" + header.nowMember] = true;
				}

				addQCount(players, header, property);
			},
			tweet: "x"
		}
	];

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
		, {
			name: "次の区",
			button_css: "btn btn-default",
			group: "rule",
			tooltip: "次の区のプレイヤーに切り替えます",
			enable0: function (players, header, property) {
				return true;
			},
			action0: function (players, header, property) {
				players.map(function (p) {
					if (p.status == "wait") {
						p.status = "normal";
					}
					if (!property.retireRule) {
						p.x = 0;
					}
				});
				header.nowMember++;
				if (header.nowMember >= 6) {
					header.nowMember = 1;
				}
			},
			tweet: "next"
		},
		/*****************************************************************************
		 * 前の区（メンバー）へ
		 ****************************************************************************/
		, {
			name: "前の区",
			button_css: "btn btn-default",
			group: "rule",
			tooltip: "前の区のプレイヤーに切り替えます",
			enable0: function (players, header, property) {
				return true;
			},
			action0: function (players, header, property) {
				players.map(function (p) {
					if (p.status == "wait") {
						p.status = "normal";
					}
					if (!property.retireRule) {
						p.x = 0;
					}
				});
				header.nowMember--;
				if (header.nowMember <= 0) {
					header.nowMember = 5;
				}
			},
			tweet: "next"
		}
		/*
		{
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
			/* lose条件 */
			if (property.retireRule && player.x >= property.losingPoint && (player.status == "normal" || player.status == "wait")) {
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

		//nowMember初期設定
		if (header.nowMember == 0) {
			if (property.nowMember) {
				header.nowMember = property.nowMember;
			} else {
				header.nowMember = 1;
			}
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
			player.chance = false;
			player.pinch = (property.losingPoint - player.x == 1);

			// slの設定
			for (var i = 1; i <= 5; i++) {
				player["sl" + i] = (i == header.nowMember && !player["unplaying" + i] && player.status == "normal") ? 1 : 0;
			}

			// キーボード入力時の配列の紐付け ローリング等の特殊形式でない場合はこのままでOK
			// player.keyIndex = index;

		});
	}

	return rule;
}]);