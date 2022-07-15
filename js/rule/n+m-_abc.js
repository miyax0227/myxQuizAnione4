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
    "key": "plus",
    "value": 1,
    "style": "number"
  },
  {
    "key": "minus",
    "value": 1,
    "style": "number"
  },
  {
    "key": "hidepts",
    "value": 0,
    "style": "boolean"
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
  }, {
    "key": "person",
    "css": "person"
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
    "o": "${handleName}◯　→${pts} p",
    "x": "${handleName}×　→${pts} p",
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
      // ptsを加算
      player.pts += header.plus;
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
      // ptsを減算
      player.pts -= header.minus;
      setMotion(player, 'x');
      addQCount(players, header, property);
    }
  },
  {
    "name": "!",
    "css": "action_introduce",
    "button_css": "btn btn-warn btn-lg",
    "enable0": function (player, players, header, property) {
      return true;
    },
    "action0": function (player, players, header, property) {
      setTimeout(() => {
        players.map(player => player.close = true);
        header.introduce = undefined;
        setTimeout(() => {
          header.introduce = player;
        }, 200)
      }, 200);
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
    "name": "pts-hide",
    "enable0": function (players, header, property) {
      return true;
    },
    "action0": function (players, header, property) {
      header.hidepts = !header.hidepts;
    },
    "keyArray": "",
    "button_css": "btn btn-default",
    "group": "rule"
  },
  {
    "name": "player-show",
    "enable0": function (players, header, property) {
      return true;
    },
    "action0": function (players, header, property) {
      setTimeout(function () {
        header.introduce = undefined;
        players.map(player => {
          player.close = true;
        });
        var timing = [8, 6, 4, 2, 10, 3, 5, 7, 9];
        setTimeout(() => { players[0].close = false; }, timing[0] * 800);
        setTimeout(() => { players[1].close = false; }, timing[1] * 800);
        setTimeout(() => { players[2].close = false; }, timing[2] * 800);
        setTimeout(() => { players[3].close = false; }, timing[3] * 800);
        setTimeout(() => { players[4].close = false; }, timing[4] * 800);
        setTimeout(() => { players[5].close = false; }, timing[5] * 800);
        setTimeout(() => { players[6].close = false; }, timing[6] * 800);
        setTimeout(() => { players[7].close = false; }, timing[7] * 800);
        setTimeout(() => { players[8].close = false; }, timing[8] * 800);
      }, 1000);
    },
    "keyArray": "",
    "button_css": "btn btn-default",
    "group": "rule"
  },
  {
    "name": "",
    "button_css": "btn btn-default",
    "group": "rule",
    "indexes0": function (players, header, property) {
      return property.ptsrule.map(rule => rule.name);
    },
    "enable1": function (index, players, header, property) {
      return true;
    },
    "action1": function (index, players, header, property) {
      var i = property.ptsrule.map(rule => rule.name).indexOf(index);
      header.rulename = property.ptsrule[i].name;
      header.plus = property.ptsrule[i].plus;
      header.minus = property.ptsrule[i].minus;
      header.qCount = 1;
      header.nowSet = i + 1;

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

  }

  /*****************************************************************************
   * calc - 従属変数の計算をする
   * 
   * @param {Array} players - players
   * @param {Object} items - items
   ****************************************************************************/
  function calc(players, header, items, property) {
    angular.forEach(players, function (player, index) {
      // pinch, chance
      player.pinch = false;
      player.chance = false;
      player.hidepts = header.hidepts;

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