'use strict';

var appName = "myxQuizMain";
var app = angular.module(appName);

/*******************************************************************************
 * rule - ラウンド特有のクイズのルール・画面操作の設定
 ******************************************************************************/
app.factory('rule', ['qCommon', function(qCommon) {

  var rule = {};
  var win = qCommon.win;
  var lose = qCommon.lose;
  var rolling = qCommon.rolling;
  var timerStop = qCommon.timerStop;
  var setMotion = qCommon.setMotion;
  var addQCount = qCommon.addQCount;

  rule.judgement = judgement;
  rule.calc = calc;

  /*****************************************************************************
   * header - ルール固有のヘッダ
   ****************************************************************************/
  rule.head = [{
    "key": "variant",
    "value": 1,
    "style": "number"
  }];

  /*****************************************************************************
   * items - ルール固有のアイテム
   ****************************************************************************/
  rule.items = [{
      "key": "pts1",
      "value": 1,
      "style": "number",
      "css": "o3"
    },
    {
      "key": "pts2",
      "value": 1,
      "style": "number",
      "css": "o4"
    },
    {
      "key": "pts3",
      "value": 1,
      "style": "number",
      "css": "o5"
    },
    {
      "key": "pts4",
      "value": 1,
      "style": "number",
      "css": "o6"
    },
    {
      "key": "pts5",
      "value": 1,
      "style": "number",
      "css": "o7"
    },
    {
      "key": "x1",
      "value": 0,
      "style": "number"
    },
    {
      "key": "x2",
      "value": 0,
      "style": "number"
    },
    {
      "key": "x3",
      "value": 0,
      "style": "number"
    },
    {
      "key": "x4",
      "value": 0,
      "style": "number"
    },
    {
      "key": "x5",
      "value": 0,
      "style": "number"
    },
    {
      "key": "pts",
      "css": "o"
    },
    {
      "key": "priority",
      "order": [{
          "key": "status",
          "order": "desc",
          "alter": [
            "win",
            2,
            "lose",
            0,
            1
          ]
        },
        {
          "key": "pts",
          "order": "desc"
        },
        {
          "key": "x",
          "order": "asc"
        }
      ]
    }
  ];

  /*****************************************************************************
   * tweet - ルール固有のツイートのひな型
   ****************************************************************************/
  rule.tweet = {
    "o": "${handleName}◯　→${pts1}*${pts2}*${pts3}*${pts4}*${pts5}=${pts} ${x}× ${substatus}",
    "x": "${handleName}×　→${pts1}*${pts2}*${pts3}*${pts4}*${pts5}=${pts} ${x}× ${substatus}",
    "thru": "スルー"
  };

  /*****************************************************************************
   * lines - ルール固有のプレイヤー配置
   ****************************************************************************/
  rule.lines = {
    "line1": {
      "left": 0,
      "right": 1,
      "y": 0.6,
      "zoom": 1,
      "orderBy": "position"
    }
  };

  /*****************************************************************************
   * actions - プレイヤー毎に設定する操作の設定
   ****************************************************************************/
  rule.actions = [{
      "name": "○",
      "css": "action_o",
      "button_css": "btn btn-primary btn-lg",
      "keyArray": "k1",
      "tweet": "o",
      "enable0": function(player, players, header, property) {
        return (player.status == 'normal' && !header.playoff);
      },
      "action0": function(player, players, header, property) {
        player["pts" + header.variant]++;
        setMotion(player, 'o');
        addQCount(players, header, property);
      }
    },
    {
      "name": "×",
      "css": "action_x",
      "button_css": "btn btn-danger btn-lg",
      "keyArray": "k2",
      "tweet": "x",
      "enable0": function(player, players, header, property) {
        return (player.status == 'normal' && !header.playoff);
      },
      "action0": function(player, players, header, property) {
        player["x" + header.variant]++;
        setMotion(player, 'x');
        addQCount(players, header, property);
      }
    }
  ];

  /*****************************************************************************
   * global_actions - 全体に対する操作の設定
   ****************************************************************************/
  rule.global_actions = [{
      "name": "thru",
      "button_css": "btn btn-default",
      "group": "rule",
      "keyboard": "Space",
      "tweet": "thru",
      "enable0": function(players, header, property) {
        return true;
      },
      "action0": function(players, header, property) {
        addQCount(players, header, property);
      }
    },
    {
      "name": "α",
      "enable0": function(players, header, property) {
        return true;
      },
      "button_css": "btn btn-default",
      "group": "rule",
      "keyboard": "z",
      "tweet": "mode",
      "action0": function(players, header, property) {
        header.variant = 1;
        header.variantName = "α";
      }
    },
    {
      "name": "β",
      "enable0": function(players, header, property) {
        return true;
      },
      "button_css": "btn btn-default",
      "group": "rule",
      "tweet": "mode",
      "keyboard": "x",
      "action0": function(players, header, property) {
        header.variant = 2;
        header.variantName = "β";
      }
    },
    {
      "name": "γ",
      "enable0": function(players, header, property) {
        return true;
      },
      "button_css": "btn btn-default",
      "group": "rule",
      "tweet": "mode",
      "keyboard": "c",
      "action0": function(players, header, property) {
        header.variant = 3;
        header.variantName = "γ";
      }
    },
    {
      "name": "δ",
      "enable0": function(players, header, property) {
        return true;
      },
      "button_css": "btn btn-default",
      "group": "rule",
      "tweet": "mode",
      "keyboard": "v",
      "action0": function(players, header, property) {
        header.variant = 4;
        header.variantName = "δ";
      }
    },
    {
      "name": "ε",
      "enable0": function(players, header, property) {
        return true;
      },
      "button_css": "btn btn-default",
      "group": "rule",
      "tweet": "mode",
      "keyboard": "b",
      "action0": function(players, header, property) {
        header.variant = 5;
        header.variantName = "ε";
      }
    }
  ];

  /*****************************************************************************
   * judgement - 操作終了時等の勝敗判定
   * 
   * @param {Array} players - players
   * @param {Object} header - header
   * @param {Object} property - property
   ****************************************************************************/
  function judgement(players, header, property) {
    angular.forEach(players.filter(function(item) {
      /* rankがない人に限定 */
      return (item.rank === 0);
    }), function(player, i) {
      /* win条件 */
      if (player.pts >= property.winningPoint) {
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
    angular.forEach(players, function(player, index) {
      // pts
      player.pts = player.pts1 * player.pts2 * player.pts3 * player.pts4 * player.pts5;
      // x
      player.x = player.x1 + player.x2 + player.x3 + player.x4 + player.x5;
      // absent
      player.absent1 = (player.x1 >= 1);
      player.absent2 = (player.x2 >= 1);
      player.absent3 = (player.x3 >= 1);
      player.absent4 = (player.x4 >= 1);
      player.absent5 = (player.x5 >= 1);

      // status, select
      player.select1 = false;
      player.select2 = false;
      player.select3 = false;
      player.select4 = false;
      player.select5 = false;
      if (["normal", "absent"].indexOf(player.status) >= 0) {
        if (player["x" + header.variant] >= 1) {
          player.status = "absent";
          player.absent = 0;
        } else {
          player["select" + header.variant] = true;
          player.status = "normal";
          player.absent = 0;
        }
      }

      // pinch, chance
      player.chance1 = (["normal", "absent"].indexOf(player.status) >= 0) && (player.x1 === 0) && ((player.pts1 + 1) * player.pts2 * player.pts3 * player.pts4 * player.pts5 >= property.winningPoint);
      player.chance2 = (["normal", "absent"].indexOf(player.status) >= 0) && (player.x2 === 0) && ((player.pts2 + 1) * player.pts1 * player.pts3 * player.pts4 * player.pts5 >= property.winningPoint);
      player.chance3 = (["normal", "absent"].indexOf(player.status) >= 0) && (player.x3 === 0) && ((player.pts3 + 1) * player.pts1 * player.pts2 * player.pts4 * player.pts5 >= property.winningPoint);
      player.chance4 = (["normal", "absent"].indexOf(player.status) >= 0) && (player.x4 === 0) && ((player.pts4 + 1) * player.pts1 * player.pts2 * player.pts3 * player.pts5 >= property.winningPoint);
      player.chance5 = (["normal", "absent"].indexOf(player.status) >= 0) && (player.x5 === 0) && ((player.pts5 + 1) * player.pts1 * player.pts2 * player.pts3 * player.pts4 >= property.winningPoint);

      player.chance = player["chance" + header.variant];
      player.pinch = player.status == "normal" && (player.x + 1 >= property.losingPoint);
      player.substatus = (player.chance && player.pinch) ? "ダブリー" : player.chance ? "リーチ" : player.pinch ? "トビリー" : "";

      // キーボード入力時の配列の紐付け ローリング等の特殊形式でない場合はこのままでOK\
      player.keyIndex = player.position;
      player.line = "line1";
    });
  }

  return rule;
}]);