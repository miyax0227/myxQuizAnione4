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
      "key": "nowSet",
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
      "css": "o"
    },
    {
      "key": "x",
      "value": 0,
      "style": "number",
      "css": "x"
    },
    {
      "key": "combo",
      "value": 0,
      "style": "number",
      "css": "combo"
    },
    {
      "key": "order",
      "value": -1,
      "style": "number"
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
        }
      ]
    }
  ];

  /*****************************************************************************
   * tweet - ルール固有のツイートのひな型
   ****************************************************************************/
  rule.tweet = {
    "o": "${handleName}◯　(${o}◯)",
    "x": "${handleName}×",
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
        // コンボ状態なら勝抜
        if (player.combo == 1) {
          player.combo = 0;
          player.winningSet = header.nowSet;
          win(player, players, header, property);
        }
        // コンボ管理
        players.map(function (p) {
          p.combo = 0;
        });
        if (player.status == "normal") {
          player.combo = 1;
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
        // コンボ管理
        player.combo = 0;

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
      "name": "next",
      "button_css": "btn btn-default",
      "group": "rule",
      "enable0": function (players, header, property) {
        return true;
      },
      "action0": function (players, header, property) {
        header.nowSet++;
        header.qCount = 1;

        var nextOrder = 1 + Math.max.apply(null, players.map(function (p) {
          return p.order
        }));

        angular.forEach(players.slice().sort(function (a, b) {
          return a.order - b.order;
        }), function (player) {
          if (player.present) {
            switch (player.status) {
              case "win":
              case "lose":
                player.order = -2;
                break;
              default:
                if (!property.hasOwnProperty('remainingPoint') ||
                  player.o < property.remainingPoint) {
                  player.order = (nextOrder++);
                }
                player.o = 0;
                player.x = 0;
            }
          }
        });

        nextOrder = 0;
        angular.forEach(players.filter(function (player) {
          return player.order >= 0;
        }).slice().sort(function (a, b) {
          return a.order - b.order;
        }), function (player) {
          player.order = (nextOrder++);
        });
      },
      "keyArray": "",
      "keyboard": "z"
    }
    /*
    ,
    {
      "name": "reserve",
      "button_css": "btn btn-default",
      "group": "rule",
      "enable0": function (players, header, property) {
        return true;
      },
      "action0": function (players, header, property) {
        var nextOrder = property.maxCount;
        angular.forEach(players.slice().sort(function (a, b) {
          return a.order - b.order;
        }), function (player) {
          if (player.present) {
            switch (player.status) {
              case "win":
              case "lose":
                var reserveOrder = (nextOrder++);
                var reserve = players.filter(function (p) {
                  return p.order == reserveOrder;
                });

                if (reserve.length == 1) {
                  reserve[0].order = player.order;
                }
                player.order = -1;
                break;
            }
          }
        });

        nextOrder = property.maxCount;
        angular.forEach(players.filter(function (player) {
          return player.order >= property.maxCount;
        }).slice().sort(function (a, b) {
          return a.order - b.order;
        }), function (player) {
          player.order = (nextOrder++);
        });
      },
      "keyArray": "",
      "keyboard": "x"
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
      return (item.rank === 0);
    }), function (player, i) {
      /* lose条件 */
      if (player.x >= property.losingPoint) {
        lose(player, players, header, property);
        player.x = property.losingPoint;
        player.combo = 0;
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
    // 最大勝抜人数を設定
    header.maxRankDisplay = property.maxRanks[header.nowSet];
    // 残り勝抜人数を設定
    header.rest = header.maxRankDisplay - players.filter(function (p) {
      return (p.status == "win") && (p.winningSet == header.nowSet);
    }).length;
    // 待ち順の最大値を取得
    var nextOrder = 1 + Math.max.apply(null, players.map(function (p) {
      return p.order
    }));

    angular.forEach(players, function (player, index) {
      // pinch, chance
      player.pinch = false;
      player.chance = (player.combo == 1) && (player.status == 'normal');

      if (angular.isUndefined(player.order) || player.order == -1) {
        player.order = (nextOrder++);
      }

      // キーボード入力時の配列の紐付け ローリング等の特殊形式でない場合はこのままでOK\
      var key = 0;
      if (0 <= player.order && player.order < property.maxCount) {
        player.present = true;
        player.keyIndex = player.order;
        player.line = (key++);

      } else {
        player.present = false;
        player.keyIndex = 999;
        player.line = "left";
      }

    });
  }

  return rule;
}]);