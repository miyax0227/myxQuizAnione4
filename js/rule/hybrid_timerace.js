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
    },
    {
      "key": "set",
      "value": 1,
      "style": "number"
    },
    {
      "key": "oPts",
      "value": 1,
      "style": "number"
    },
    {
      "key": "xPts",
      "value": 1,
      "style": "number"
    },
    {
      "key": "rule0",
      "value": 0,
      "style": "number"
    },
    {
      "key": "rule1",
      "value": 0,
      "style": "number"
    },
    {
      "key": "rule2",
      "value": 0,
      "style": "number"
    },
    {
      "key": "question0",
      "value": 0,
      "style": "number"
    },
    {
      "key": "question1",
      "value": 0,
      "style": "number"
    },
    {
      "key": "question2",
      "value": 0,
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
      "key": "setCount",
      "value": 0,
      "style": "number",
      "css": "o2"
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
    "o": "${handleName}◯　→${o}◯ ${x}×",
    "x": "${handleName}×　→${o}◯ ${x}×",
    "thru": "スルー"
  };

  /*****************************************************************************
   * lines - ルール固有のプレイヤー配置
   ****************************************************************************/
  rule.lines = {
    "line1": {
      "left": 0.2,
      "right": 0.8,
      "y": 0.5,
      "zoom": 1,
      "orderBy": "position"
    },
    "line2": {
      "left": 0.2,
      "right": 0.8,
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
        // ptsを加算
        player.pts += header.oPts;
        setMotion(player, 'o');
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
        return (player.status == 'normal' && !header.playoff);
      },
      "action0": function(player, players, header, property) {
        // ptsを加算
        player.pts -= header.xPts;
        setMotion(player, 'x');
        addQCount(players, header, property);
      },
      "nowait": false
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
      },
      "nowait": false
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
      "keyArray": "",
      "nowait": false
    },
    {
      "name": "reset",
      "button_css": "btn btn-danger",
      "group": "rule",
      "keyboard": "z",
      "enable0": function(players, header, property) {
        return true;
      },
      "action0": function(players, header, property) {
        var maxPts = Math.max.apply(null, players.map(function(p) {
          return p.pts;
        }));

        players.map(function(p) {
          if (p.pts == maxPts) {
            p.setCount++;
          }
          p.pts = 0;
        });
        header.set++;
        header.qCount = 1;
      },
      "nowait": false
    },
    {
      "name": "",
      "button_css": "btn btn-default",
      "group": "rule",
      "indexes0": function(players, header, property) {
        return property.ruleName;
      },
      "enable1": function(index, players, header, property) {
        return true;
      },
      "action1": function(index, players, header, property) {
        var i = property.ruleName.indexOf(index);
        header.ruleName = index;
        header.oPts = property.ruleConfig[i].oPts;
        header.xPts = property.ruleConfig[i].xPts;
        header["rule" + i]++;
      },
      "nowait": false
    },
    {
      "name": "",
      "action1": function(index, players, header, property) {
        var i = property.questionName.indexOf(index);
        header["question" + i]++;
      },
      "enable1": function(index, players, header, property) {
        return true;
      },
      "indexes0": function(players, header, property) {
        return property.questionName;
      },
      "button_css": "btn btn-info",
      "group": "rule",
      "nowait": false
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
      if (player.setCount >= property.winningPoint) {
        win(player, players, header, property);
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