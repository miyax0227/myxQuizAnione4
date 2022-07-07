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
      "key": "div",
      "css": "div"
    },
    {
      "key": "pinch",
      "css": "pinch_img"
    },
    {
      "key": "chance",
      "css": "chance_img"
    },
    {
      "key": "star",
      "css": "star_img"
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
            0
          ]
        },
        {
          "key": "o",
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
    "x": "${handleName}×　→${o}◯ ${x}× ${absent}休",
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
        // ○を加算
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
        return (player.status == 'normal' && !header.playoff);
      },
      "action0": function(player, players, header, property) {
        // ×を加算
        player.x++;
        // 休み処理
        player.status = "preabsent";
        player.absent = players.filter(function(p) {
          return p.status != "win" && p.status != "lose";
        }).length - 1;

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
    // 所定回数以上の×は失格
    players.filter(function(p) {
      return p.status != "win" && p.status != "lose" && p.x >= property.losingPoint;
    }).map(function(p) {
      lose(p, players, header, property);
    });

    function withoutWin(p) {
      return p.status != "win";
    }

    var maxPoint = Math.max.apply(null, players.filter(withoutWin).map(function(p) {
      return p.o;
    }));
    var minPoint = Math.min.apply(null, players.filter(withoutWin).map(function(p) {
      return p.o;
    }));
    var changedPlayer = [];

    var nowGap = 0;
    var gapPtsArray = [];

    gapFor: for (var pts = maxPoint; pts >= minPoint; pts--) {
      if (players.filter(function(p) {
          return p.o == pts && p.status != "win";
        }).length > 0) {
        nowGap = 0;
      } else {
        nowGap++;
        if (nowGap >= property.gap - 1) {
          gapPtsArray.push(pts);
          //break gapFor;
        }
      }
    }

    angular.forEach(gapPtsArray, function(gapPts) {
      // 既に勝抜している人数＋ラインより上の人数
      console.log(gapPts, players.filter(function(p) {
        return p.status == "win";
      }).length, players.filter(function(p) {
        return p.o > gapPts && p.status != "win" && p.status != "lose";
      }).length);

      var nextWinnerCount = players.filter(function(p) {
        return p.status == "win";
      }).length + players.filter(function(p) {
        return p.o > gapPts && p.status != "win" && p.status != "lose";
      }).length;

      // 勝抜人数以下の場合、ラインより上のプレイヤーは勝抜
      if (nextWinnerCount <= property.maxRankDisplay) {
        players.filter(function(p) {
          return p.o > gapPts && p.status != "win" && p.status != "lose";
        }).map(function(p) {
          win(p, players, header, property);
          changedPlayer.push(p);
        });
      }
      // 勝抜人数以上の場合、ラインより下のプレイヤーは失格
      if (nextWinnerCount >= property.maxRankDisplay) {
        players.filter(function(p) {
          return p.o < gapPts && p.status != "win" && p.status != "lose";
        }).map(function(p) {
          lose(p, players, header, property);
          changedPlayer.push(p);
        });
      }

    });

    return changedPlayer;
  }

  /*****************************************************************************
   * calc - 従属変数の計算をする
   * 
   * @param {Array} players - players
   * @param {Object} items - items
   ****************************************************************************/
  function calc(players, header, items, property) {
    function getPlayer(ps, p) {
      var pp = ps.filter(function(np) {
        return np.entryNo == p.entryNo
      });
      if (pp.length > 0) {
        return pp[0];
      } else {
        return undefined;
      }
    }

    // div
    var prevPlayer;
    if (header.pos) {
      players.map(function(p) {
        p.div = 0;
      });
    } else {
      players.slice().sort(function(a, b) {
        return a.priority - b.priority;
      }).filter(function(p) {
        return players.filter(function(pp) {
          return pp.priority >= p.priority && pp.status != "win" && pp.status != "lose"
        }).length > 0;
      }).map(function(p) {
        if (prevPlayer) {
          if (prevPlayer.status != "win") {
            prevPlayer.div = prevPlayer.o - p.o;
          } else {
            prevPlayer.div = 0;
          }
        }
        prevPlayer = p;
        p.div = 0;
      });
    }

    // pinch, chance, star
    players.map(function(p) {
      p.pinch = false;
      p.chance = false;
      p.star = false;
    });

    players.filter(function(p) {
      return p.status == "normal";
    }).map(function(p) {
      var nextPlayers = angular.copy(players);
      getPlayer(nextPlayers, p).o++;
      var judge = judgement(nextPlayers, angular.copy(header), property);
      if (judge.length > 0) {
        p.star = true;
        judge.map(function(np) {
          if (np.status == "win") {
            getPlayer(players, np).chance = true;
          } else if (np.status == "lose") {
            getPlayer(players, np).pinch = true;
          }
        })
      }
    });


    angular.forEach(players, function(player, index) {

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