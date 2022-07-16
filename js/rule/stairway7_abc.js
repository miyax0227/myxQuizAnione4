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
  var timerStop = qCommon.timerStop;
  var setMotion = qCommon.setMotion;
  var addQCount = qCommon.addQCount;

  rule.judgement = judgement;
  rule.calc = calc;

  /*****************************************************************************
   * header - ルール固有のヘッダ
   ****************************************************************************/
  rule.head = [{
    "key": "pos",
    "value": true,
    "style": "boolean"
  },
  {
    "key": "set",
    "value": 1,
    "style": "number"
  }
  ];

  /*****************************************************************************
   * items - ルール固有のアイテム
   ****************************************************************************/
  rule.items = [{
    "key": "o",
    "value": 0,
    "style": "number",
    "css": "o",
    "suffix": "　"
  },
  {
    "key": "x",
    "value": 0,
    "style": "number",
    "css": "x",
    "repeatChar": "×",
    "blankChar": "・・・"
  }, {
    "key": "person",
    "css": "person"
  },
  {
    "key": "win",
    "value": 0,
    "style": "number",
    "css": "o2",
    "repeatChar": "★"
  },
  {
    "key": "norma",
    "value": 0,
    "style": "number",
    "css": "o3",
    "prefix": "/"
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
      "key": "win",
      "order": "desc"
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
      "y": 0.5,
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
    "enable0": function (player, players, header, property) {
      return (player.status == 'normal' && !header.playoff);
    },
    "action0": function (player, players, header, property) {
      // ○を加算
      player.o++;
      // 勝利判定
      if (player.o >= player.norma) {
        // 勝利ポイントを加算
        player.win++;
        player.setWin = true;
      }
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
    "enable0": function (player, players, header, property) {
      return (player.status == 'normal' && !header.playoff);
    },
    "action0": function (player, players, header, property) {
      // ×を加算
      player.x++;
      // 待機判定
      if (player.x >= property.losingPoint) {
        // 待機
        player.status = "wait";
      }
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
    "enable0": function (players, header, property) {
      return true;
    },
    "action0": function (players, header, property) {
      addQCount(players, header, property);
    }
  },
  {
    "name": "pos",
    "button_css": "btn btn-default",
    "group": "rule",
    "enable0": function (players, header, property) {
      return true;
    },
    "action0": function (players, header, property) {
      header.pos = !header.pos;
    },
    "keyArray": ""
  },
  {
    "name": "set",
    "button_css": "btn btn-default",
    "group": "rule",
    "enable0": function (players, header, property) {
      return true;
    },
    "action0": function (players, header, property) {
      header.set++;
      header.qCount = 1;
      angular.forEach(players, function (p) {
        p.o = 0;
        p.x = 0;
        p.status = "normal";
        p.setWin = false;
      });

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
    angular.forEach(players.filter(function (item) {
      /* rankがない人に限定 */
      return (item.rank === 0);
    }), function (player, i) {
      /* win条件 */
      if (player.win >= property.winningMatchPoint) {
        win(player, players, header, property);
        header.introduce = player;
        players.map(p=>p.hide=true);
      }
      /* lose条件 */
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
      // キーボード入力時の配列の紐付け ローリング等の特殊形式でない場合はこのままでOK\
      player.keyIndex = player.position;
      if (header.pos) {
        player.line = "line1";
      } else {
        player.line = "line2";
      }

      // ノルマ設定
      if (player.setWin) {
        player.norma = property.winningSetPoint[player.win - 1];
      } else {
        player.norma = property.winningSetPoint[player.win];
      }

      // 他二人がwaitになった場合、セット勝利
      if (players.filter(p => p.status == "wait").length == players.length - 1 &&
        player.status == "normal" &&
        player.setWin == false
      ) {
        player.win++;
        player.setWin = true;
      }

    });
  }

  return rule;
}]);