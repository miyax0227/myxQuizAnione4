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
    "o": "${handleName}◯　→${o}◯ ${x}× ${substatus}",
    "x": "${handleName}×　→${o}◯ ${x}× ${absent}休み",
    "thru": "スルー",
    "win": "${handleName}優勝！！"
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
        player.x++;
        // 休み
        player.status = "preabsent";
        // 休み回数
        player.absent = 1;
        if (angular.isNumber(property.penalty)) {
          player.absent = property.penalty;
        } else if (angular.isArray(property.penalty)) {
          player.absent = property.penalty[0] + property.penalty[1] * player.x;
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
    "enable0": function(players, header, property) {
      return true;
    },
    "action0": function(players, header, property) {
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
      if (player.o >= property.winningPoint) {

        win(player, players, header, property);
        player.o = property.winningPoint;
        timerStop();
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
    angular.forEach(players, function(player, index) {
      // pinch, chance
      player.pinch = false;
      player.chance = (player.o + 1 >= property.winningPoint) && (player.status == 'normal');
      player.substatus = (player.chance && player.pinch) ? "ダブリー" : player.chance ? "リーチ" : player.pinch ? "トビリー" : "";

      // キーボード入力時の配列の紐付け ローリング等の特殊形式でない場合はこのままでOK\
      player.keyIndex = player.position;
      player.line = "line1";
    });
  }

  return rule;
}]);