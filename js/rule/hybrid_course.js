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
      "key": "course",
      "value": "",
      "style": "string"
    }
  ];

  /*****************************************************************************
   * items - ルール固有のアイテム
   ****************************************************************************/
  rule.items = [{
      "key": "blaff",
      "value": "",
      "style": "string",
      "css": "blaff"
    },
    {
      "key": "course",
      "value": "",
      "style": "string",
      "css": "course"
    },
    {
      "key": "priority",
      "order": [{
        "key": "rankPoint",
        "order": "desc"
      }]
    }
  ];

  /*****************************************************************************
   * tweet - ルール固有のツイートのひな型
   ****************************************************************************/
  rule.tweet = {};

  /*****************************************************************************
   * lines - ルール固有のプレイヤー配置
   ****************************************************************************/
  rule.lines = {
    "line1": {
      "x": 0.3,
      "top": 0.3,
      "bottom": 0.7,
      "zoom": 0.5,
      "orderBy": "rankPoint"
    },
    "line2": {
      "x": 0.5,
      "top": 0.3,
      "bottom": 0.7,
      "zoom": 0.5,
      "orderBy": "rankPoint"
    },
    "line3": {
      "x": 0.7,
      "top": 0.3,
      "bottom": 0.7,
      "zoom": 0.5,
      "orderBy": "rankPoint"
    },
    "line4": {
      "x": 0.9,
      "top": 0.3,
      "bottom": 0.7,
      "zoom": 0.5,
      "orderBy": "rankPoint"
    },
    "next": {
      "x": 0.6,
      "y": 0.2,
      "zoom": 1,
      "orderBy": "rankPoint"
    },
    "line0": {
      "x": 0.09,
      "top": 0.2,
      "bottom": 0.9,
      "zoom": 0.33,
      "orderBy": "rankPoint"
    }
  };

  /*****************************************************************************
   * actions - プレイヤー毎に設定する操作の設定
   ****************************************************************************/
  rule.actions = [];

  /*****************************************************************************
   * global_actions - 全体に対する操作の設定
   ****************************************************************************/
  rule.global_actions = [{
    "name": "",
    "indexes0": function(players, header, property) {
      return property.courseName;
    },
    "enable1": function(index, players, header, property) {
      return true;
    },
    "action1": function(index, players, header, property) {
      var nextPlayer;
      var nextPlayers = players.filter(function(p) {
        return p.next
      });

      if (nextPlayers.length >= 1) {
        nextPlayer = nextPlayers[0];
        nextPlayer.course = index;
        nextPlayer.blaff = "";
      }
    },
    "button_css": "btn btn-default",
    "group": "rule",
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
      // nameLatの設定
      player.nameLat = player.name;
      player.handleNameLat = player.handleName;
      player.keyIndex = 999;

      // rankPoint
      player.rankPoint = player.position;

      //course
      if (!angular.isDefined(player.course)) {
        player.course = "";
      }

    });

    var nextPlayer;
    var nextPlayers = players.filter(function(p) {
      return p.course === "";
    }).sort(function(a, b) {
      return (a.rankPoint < b.rankPoint) ? -1 : 1;
    });

    if (nextPlayers.length >= 1) {
      nextPlayer = nextPlayers[0];
    }

    // courseName
    if (angular.isObject(property.courseName) && angular.isDefined(property.courseName[header.course])) {
      header.courseName = property.courseName[header.course];
    } else {
      header.courseName = "";
    }

    angular.forEach(players, function(player, index) {
      if (header.course.length >= 1) {
        if (player == nextPlayer) {
          player.next = true;
          player.line = "left";

        } else if (player.course == header.course) {
          var rankInCourse = players.filter(function(p) {
            return p.course == header.course && p.rankPoint <= player.rankPoint;
          }).length;
          var countInCourse = players.filter(function(p) {
            return p.course == header.course;
          }).length;

          if (rankInCourse <= countInCourse / 2) {
            player.line = "linea";
          } else {
            player.line = "lineb"
          }

        } else {
          player.line = "left";

        }
      } else {
        // line
        if (player == nextPlayer) {
          player.next = true;
          player.line = "next";
        } else {
          player.next = false;
          switch (player.course) {
            case "":
              player.line = "line0";
              break;
            case "A":
              player.line = "line1";
              break;
            case "B":
              player.line = "line2";
              break;
            case "C":
              player.line = "line3";
              break;
            case "D":
              player.line = "line4";
              break;
            default:
              player.line = "left";
          }
        }
      }

    });
  }

  return rule;
}]);