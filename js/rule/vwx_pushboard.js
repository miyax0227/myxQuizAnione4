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
    "key": "hpSet",
    "value": 0,
    "style": "boolean"
  }];

  /*****************************************************************************
   * items - ルール固有のアイテム
   ****************************************************************************/
  rule.items = [{
      "key": "hp",
      "value": 40,
      "style": "number",
      "css": "o"
    },
    {
      "key": "prevHp",
      "value": 40,
      "style": "number"
    },
    {
      "key": "pushed",
      "css": "pushed_img",
      "style": "boolean",
      "value": ""
    },
    {
      "key": "right",
      "value": 0,
      "style": "boolean",
      "css": "o2",
      "repeatChar": "◯,"
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
          "key": "hp",
          "order": "desc"
        },
        {
          "key": "prevHp",
          "order": "desc"
        }
      ]
    }
  ];

  /*****************************************************************************
   * tweet - ルール固有のツイートのひな型
   ****************************************************************************/
  rule.tweet = {
    "thru": "${rightAnswerPlayers}",
    "right": "解答権：${handleName}"
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
      "enable0": function(player, players, header, property) {
        return (player.status == 'normal' && !header.playoff);
      },
      "action0": function(player, players, header, property) {
        player.right = !player.right;
      }
    },
    {
      "name": "p",
      "css": "action_s",
      "button_css": "btn btn-info btn-lg",
      "keyArray": "k2",
      "tweet": "right",
      "enable0": function(player, players, header, property) {
        return (player.status == 'normal' && !header.playoff);
      },
      "action0": function(player, players, header, property) {
        players.map(function(p) {
          if (p == player) {
            p.pushed = !p.pushed;
          } else {
            p.pushed = false;
          }
        })
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
      // ボード正解/不正解/スルーボード判定
      var pushPattern;
      var pushPlayers = players.filter(function(p) {
        return p.pushed;
      });
      if (pushPlayers.length === 0) {
        // スルーボード
        pushPattern = 2;
      } else {
        if (pushPlayers[0].right) {
          pushPattern = 0;
        } else {
          pushPattern = 1;
        }
      }

      // 点数計算
      players.filter(function(p) {
        return p.status == "normal";
      }).map(function(p) {
        p.prevHp = p.hp;
        if (p.pushed) {
          if (p.right) {
            p.hp += property.hpDiv[0][0];
          } else {
            p.hp += property.hpDiv[0][1];
          }
        } else {
          if (p.right) {
            p.hp += property.hpDiv[1][pushPattern][0];
          } else {
            p.hp += property.hpDiv[1][pushPattern][1];
          }
        }
      });

      // Twitter表示用文字列
      header.rightAnswerPlayers = "";
      // 早押し結果
      switch (pushPattern) {
        case 0:
          header.rightAnswerPlayers += pushPlayers[0].handleName + ": 早押し正解"
          break;
        case 1:
          header.rightAnswerPlayers += pushPlayers[0].handleName + ": 早押し誤答"
          break;
        case 2:
          header.rightAnswerPlayers += "スルーボード";
          break;
      }
      // ボード正解者
      var boardRightAnswerPlayers = players.filter(function(p) {
        return !p.pushed && p.right;
      });
      if (boardRightAnswerPlayers.length === 0) {
        header.rightAnswerPlayers += "\nボード正解者なし"
      } else {
        header.rightAnswerPlayers += "\nボード正解者: " + boardRightAnswerPlayers.map(function(p) {
          return p.handleName;
        }).join(',');
      }

      // 初期化
      players.map(function(p) {
        p.pushed = false;
        p.right = false;
      });

      addQCount(players, header, property);
    }
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
    angular.forEach(players, function(player, index) {
      // pinch, chance
      player.pinch = false;
      player.chance = false;

      // hp初期値を設定
      if (!header.hpSet) {
        header.hpSet = true;
        // 最小pts
        var minPts = Math.min.apply(null, players.map(function(p) {
          return p.pts;
        }));
        // hp初期値を設定
        players.map(function(p) {
          console.log(p.pts, minPts, property.minHp);
          p.hp = p.pts - minPts + property.minHp;
        })
      }

      // キーボード入力時の配列の紐付け ローリング等の特殊形式でない場合はこのままでOK\
      player.keyIndex = player.position;
      player.line = "line1";

    });
  }

  return rule;
}]);