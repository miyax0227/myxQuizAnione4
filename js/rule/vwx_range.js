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
      "key": "push",
      "value": true,
      "style": "boolean"
    },
    {
      "key": "nowSet",
      "value": 1,
      "style": "number"
    }
  ];

  /*****************************************************************************
   * items - ルール固有のアイテム
   ****************************************************************************/
  rule.items = [{
      "key": "pts",
      "value": 0,
      "style": "number"
    },
    {
      "key": "o",
      "value": 0,
      "style": "number"
    },
    {
      "key": "x",
      "value": 0,
      "style": "number"
    },
    {
      "key": "multipts",
      "value": 0,
      "style": "number"
    },
    {
      "key": "allx",
      "value": 0,
      "style": "number",
      "css": "x"
    },
    {
      "key": "o2x",
      "css": "o2"
    },
    {
      "key": "o3x",
      "css": "o2x"
    },
    {
      "key": "ptsInt",
      "css": "o"
    },
    {
      "key": "ptsFrac",
      "css": "oFrac"
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
    "o": "${handleName}◯　→${o}◯ ${x}×",
    "x": "${handleName}×　→${o}◯ ${x}×",
    "thru": "スルー"
  };

  /*****************************************************************************
   * lines - ルール固有のプレイヤー配置
   ****************************************************************************/
  rule.lines = {
    "line1": {
      "left": 0,
      "right": 1,
      "y": 0.55,
      "zoom": 1,
      "orderBy": "position"
    },
    "line2": {
      "left": 0,
      "right": 1,
      "y": 0.5,
      "zoom": 1,
      "orderBy": "priority"
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
        return (player.status == 'normal' && !header.playoff && header.push);
      },
      "action0": function(player, players, header, property) {
        player.o++;
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
        return (player.status == 'normal' && !header.playoff && header.push);
      },
      "action0": function(player, players, header, property) {
        player.x++;
        player.allx++;
        setMotion(player, 'o');
        addQCount(players, header, property);
      }
    },
    {
      "name": "+",
      "css": "action_plus",
      "button_css": "btn btn-primary",
      "keyArray": "k3",
      "enable0": function(player, players, header, property) {
        return (player.status == 'normal' && !header.playoff && !header.push);
      },
      "action0": function(player, players, header, property) {
        player.multipts++;
      }
    },
    {
      "name": "-",
      "button_css": "btn btn-danger",
      "css": "action_minus",
      "enable0": function(player, players, header, property) {
        return (player.status == 'normal' && !header.playoff && !header.push);
      },
      "action0": function(player, players, header, property) {
        player.multipts--;
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
      "enable0": function(players, header, property) {
        return true;
      },
      "action0": function(players, header, property) {
        // 早押しモード
        if (header.push) {
          qCommon.editTweet(header.tweets, property.tweet["thru"], header, true);
          addQCount(players, header, property);
          // 多答モード
        } else {
          players.map(function(p) {
            p.pts += Math.floor((p.o + 1) * (p.multipts + 1) / (p.x + 1) * 10 + 0.5) / 10;
          });
        }
      }
    },
    {
      "name": "push/multi",
      "button_css": "btn btn-default",
      "group": "rule",
      "keyboard": "z",
      "enable0": function(players, header, property) {
        return true;
      },
      "action0": function(players, header, property) {
        // 早押しモード
        if (header.push) {
          header.push = false;
          // 多答モード
        } else {
          header.push = true;
          players.map(function(p) {
            p.o = 0;
            p.x = 0;
            p.multipts = 0;
          });
          header.nowSet++;
        }
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

      /* lose条件 */
      if (player.allx >= property.losingPoint) {
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
      // pinch, chance
      player.chance = false;
      player.pinch = (player.allx + 1 >= property.losingPoint);

      if (header.push) {
        player.o2x = player.o + "-" + player.x;
        player.o3x = "";
      } else {
        player.o2x = "x" + (Math.floor((player.o + 1) / (player.x + 1) * 100 + 0.5) / 100);
        player.o3x = player.multipts + "+1";
      }

      player.pts10 = Math.floor(player.pts * 10 + 0.5);
      player.ptsInt = Math.floor(player.pts10 / 10);
      player.ptsFrac = ["", ".1", ".2", ".3", ".4", ".5", ".6", ".7", ".8", ".9"][player.pts10 - player.ptsInt * 10];


      // キーボード入力時の配列の紐付け ローリング等の特殊形式でない場合はこのままでOK\
      player.keyIndex = player.position;
      player.line = "line1";
    });
  }

  return rule;
}]);