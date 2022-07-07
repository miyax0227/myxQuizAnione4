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
      "key": "mode",
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
      "style": "number",
      "css": "o"
    },
    {
      "key": "x",
      "value": 0,
      "style": "number",
      "css": "x",
      "repeatChar": "×"
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
        }
      ]
    }
  ];

  /*****************************************************************************
   * tweet - ルール固有のツイートのひな型
   ****************************************************************************/
  rule.tweet = {
    "o": "${handleName}◯　→${pts}p ${score}",
    "x": "${handleName}×　→${pts}p ${score}",
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
      "enable0": function(player, players, header, property) {
        return (player.status == 'normal' && !header.playoff);
      },
      "action0": function(player, players, header, property) {
        switch (header.mode) {
          case 1:
            // ptsを加算
            player.pts++;
            setMotion(player, 'o');
            addQCount(players, header, property);
            break;
          case 2:
          case 3:
            // 他のプレイヤーのptsを減算
            players.filter(function(p) {
              return p != player && p.status == "normal";
            }).map(function(p) {
              p.pts--;
            });
            setMotion(player, 'o');
            addQCount(players, header, property);
            // ×を消す
            players.map(function(p) {
              p.x = 0;
            });
            break;
        }
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
        switch (header.mode) {
          case 1:
            // 他のプレイヤーのptsを加算
            players.filter(function(p) {
              return p != player && p.status == "normal";
            }).map(function(p) {
              p.pts++;
            });
            setMotion(player, 'x');
            addQCount(players, header, property);
            break;
          case 2:
            // 自分のptsを減算
            player.pts--;
            setMotion(player, 'x');
            addQCount(players, header, property);
            break;
          case 3:
            // 自分に×をつける
            player.x = 1;
            setMotion(player, 'x');
            // 問題は進めない
            break;
        }
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
        // ×を解除
        players.map(function(p) {
          p.x = 0;
        });

      }
    },
    {
      "name": "pos",
      "button_css": "btn btn-default",
      "group": "rule",
      "enable0": function(players, header, property) {
        return true;
      },
      "action0": function(players, header, property) {
        header.pos = !header.pos;
      },
      "keyArray": ""
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
      /* win条件*/
      if (player.pts >= 1 && header.mode >= 2 &&
        players.filter(function(p) {
          return p.pts >= 1 && p != player;
        }).length === 0) {
        win(player, players, header, property);
      }
      /* lose条件 */
      if (player.pts <= 0 && header.mode >= 2) {
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
    // modeName
    if (header.mode == 1) {
      header.modeName = "前半";
    } else {
      header.modeName = "後半";
    }

    // mode 1->2
    if (header.mode == 1) {
      if (players.filter(function(p) {
          return p.pts >= property.roundTripPoint;
        }).length >= 1) {
        header.mode = 2;
      }
    }
    // mode 2->3
    if (header.mode == 2) {
      if (players.filter(function(p) {
          return p.pts <= 0;
        }).length >= 1) {
        header.mode = 3;
      }
    }

    if (players.filter(function(p) {
        return p.status == "normal" && p.x === 0
      }).length === 0) {
      players.map(function(p) {
        p.x = 0;
      });
      addQCount(players, header, property);
    }

    // score
    var score =
      players.map(function(p) {
        return p.name + ":" + p.pts + "p";
      }).join(" / ");
    players.map(function(p) {
      p.score = "\n" + score;
    });

    angular.forEach(players, function(player, index) {
      // pinch, chance
      player.pinch = false;
      player.chance = player.pts >= 1 && header.mode >= 2 &&
        players.filter(function(p) {
          return p.pts >= 2 && p != player;
        }).length === 0;

      // キーボード入力時の配列の紐付け ローリング等の特殊形式でない場合はこのままでOK\
      player.keyIndex = player.position;
      if (header.pos) {
        player.line = "line1";
      } else {
        player.line = "line2";
      }
    });
  }

  return rule;
}]);