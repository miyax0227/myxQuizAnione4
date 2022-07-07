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
    "key": "pos",
    "value": true,
    "style": "boolean"
  }];

  /*****************************************************************************
   * items - ルール固有のアイテム
   ****************************************************************************/
  rule.items = [{
      "key": "o",
      "value": 0,
      "style": "number",
      "css": "o"
    },
    {
      "key": "x",
      "value": 0,
      "style": "number",
      "css": "x"
    },
    {
      "key": "penalty",
      "value": 0,
      "style": "number",
      "css": "penalty"
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
          "key": "o",
          "order": "desc"
        },
        {
          "key": "x",
          "order": "asc"
        },
        {
          "key": "paperRank",
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
      "y": 0.8,
      "zoom": 0.4,
      "orderBy": "col"
    },
    "line2": {
      "left": 0.2,
      "right": 1,
      "y": 0.6,
      "zoom": 0.4,
      "orderBy": "col"
    },
    "line3": {
      "left": 0.4,
      "right": 1,
      "y": 0.4,
      "zoom": 0.4,
      "orderBy": "col"
    },
    "line4": {
      "left": 0.6,
      "right": 1,
      "y": 0.2,
      "zoom": 0.4,
      "orderBy": "col"
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
        return (player.status == 'selected' && !header.playoff);
      },
      "action0": function(player, players, header, property) {
        player.o++;
        setMotion(player, 'o');
        // 自分以外の列をローリング
        for (var col = 0; col <= header.maxCol; col++) {
          if (col != player.col) {
            rolling(players, col);
          }
        }
        addQCount(players, header, property);
      },
      "nowait": false
    },
    {
      "name": "×",
      "css": "action_x",
      "button_css": "btn btn-danger btn-lg",
      "keyArray": "k2",
      "tweet": "x",
      "enable0": function(player, players, header, property) {
        return (player.status == 'selected' && !header.playoff);
      },
      "action0": function(player, players, header, property) {
        player.x++;
        setMotion(player, 'x');
        // 自分の列をローリング
        rolling(players, player.col);
        addQCount(players, header, property);
      },
      "nowait": false
    },
    {
      "name": "S",
      "css": "action_s",
      "button_css": "btn btn-info btn-lg",
      "keyArray": "k3",
      "enable0": function(player, players, header, property) {
        return (player.status == 'normal' && !header.playoff);
      },
      "action0": function(player, players, header, property) {
        // 解答権を自分にする
        players.filter(function(p) {
          return (p.col === player.col) && (p.status == "selected");
        }).map(function(p) {
          p.status = "normal";
        });
        player.status = "selected";

      },
      "nowait": true
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
      // すべての列をローリング
      for (var col = 0; col <= header.maxCol; col++) {
        rolling(players, col);
      }
      addQCount(players, header, property);
    },
    "nowait": false
  }];

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
      if (player.o >= property.winningPoint) {
        // ボタンについていた場合はローリング
        if (player.status == "selected") {
          rolling(players, player.col);
        }

        win(player, players, header, property);
        timerStop();

      }
      /* lose条件 */
      if (player.x + player.penalty >= property.losingPoint) {
        // ボタンについていた場合はローリング
        if (player.status == "selected") {
          rolling(players, player.col);
        }

        lose(player, players, header, property);
        timerStop();
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
    header.maxCol = 0;
    angular.forEach(players, function(player, index) {
      // pinch, chance
      player.pinch = false;
      player.chance = false;

      // nameLatの設定
      player.nameLat = player.name;
      player.handleNameLat = player.handleName;
      player.keyIndex = 999;

      // maxColの設定
      if (header.maxCol < player.col) {
        header.maxCol = player.col;
      }

      // 残りプレイヤー
      header.playerCount = players.filter(function(p) {
        return p.status == "normal" || p.status == "selected";
      }).length;

      // 残り枠
      header.spot = property.maxRankDisplay - players.filter(function(p) {
        return p.status == "win";
      }).length;

      // キーボード入力時の配列の紐付け
      if (player.status == "selected") {
        player.keyIndex = player.col - 1;
      } else {
        player.keyIndex = 999;
      }
      player.line = "line" + player.row;
    });
  }

  return rule;
}]);