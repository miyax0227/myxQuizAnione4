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
  rule.head = [];

  /*****************************************************************************
   * items - ルール固有のアイテム
   ****************************************************************************/
  rule.items = [{
      "key": "right",
      "value": 0,
      "style": "boolean"
    },
    {
      "key": "pts",
      "value": 0,
      "style": "number",
      "css": "pts"
    },
    {
      "key": "rightName",
      "css": "upper"
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
    "thru": "${rightAnswerPlayers}"
  };

  /*****************************************************************************
   * lines - ルール固有のプレイヤー配置
   ****************************************************************************/
  rule.lines = {
    "line1": {
      "left": 0,
      "right": 1,
      "y": 0.3,
      "zoom": 0.45,
      "orderBy": "position"
    },
    "line2": {
      "left": 0,
      "right": 1,
      "y": 0.6,
      "zoom": 0.45,
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
  }];

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
      // 正答者数からポイント計算
      var rightPts = 1;
      var rightCount = players.filter(function(p) {
        return p.right;
      }).length;

      if (angular.isArray(property.rightPts)) {
        var rightPtsSelect = property.rightPts.filter(function(rp) {
          console.log(rp.min, rp.max, rightCount);
          return rp.min <= rightCount && rightCount <= rp.max;
        });
        if (rightPtsSelect.length >= 1) {
          rightPts = rightPtsSelect[0].pts;
        }
      }
      // Twitter表示用文字列
      if (rightCount === 0) {
        header.rightAnswerPlayers = "正解者なし";
      } else if (rightCount == 1) {
        header.rightAnswerPlayers = "単独正解：" + players.filter(function(p) {
          return p.right;
        })[0].handleName;
      } else {
        header.rightAnswerPlayers = "正解：" + players.filter(function(p) {
          return p.right;
        }).map(function(p) {
          return p.handleName;
        }).join(',');
      }
      // ポイント加算
      players.filter(function(p) {
        return p.right;
      }).map(function(p) {
        p.pts += rightPts;
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

      // nameLatの設定
      player.nameLat = player.name;
      player.handleNameLat = player.handleName;

      //rightName
      if (player.right) {
        player.rightName = "○";
      } else {
        player.rightName = "";
      }

      // キーボード入力時の配列の紐付け ローリング等の特殊形式でない場合はこのままでOK\
      player.keyIndex = player.position;
      player.line = "line1";
      if (angular.isArray(property.lineArray)) {
        property.lineArray.map(function(la) {
          if (la.min <= index + 1 && index + 1 <= la.max) {
            player.line = la.line;
          }
        })
      }

    });
  }

  return rule;
}]);