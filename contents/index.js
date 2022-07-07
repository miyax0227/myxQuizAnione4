/**
 * アップロード画面用スクリプト
 */
var appName = "union";
var app = angular.module(appName, ["ngAnimate", "ngResource"]);

app.config(["$locationProvider", function ($locationProvider) {
  $locationProvider.html5Mode(true);
}])

app.controller('main', ['$scope', '$resource', '$http', '$sce', '$timeout', '$interval', '$window', '$location',
  function ($scope, $resource, $http, $sce, $timeout, $interval, $window, $location) {
    /**
     * メッセージを表示する
     * @param {string} message message
     * @param {integer} wait wait[ms]
     * @returns null
     */
    async function showMessage(message, wait) {
      $scope.message = undefined;
      $timeout(function () {
        $scope.message = message;
        $timeout(function () {
          $scope.message = undefined;
        }, wait);
      });
    }

    // 定数定義
    const getUrl = "https://a2v4fab6o7.execute-api.ap-northeast-1.amazonaws.com/default/union-get?id=status&round=01_1R-A,01_1R-B,01_1R-C,01_1R-D,01_1R-E,01_1R-F,02_PO-A,02_PO-B,02_PO-C,02_PO-D,02_PO-E,02_PO-F,03_2R-A,03_2R-B,03_2R-C,03_2R-D,03_2R-E,03_2R-F";
    $scope.round1r = ["01_1R-A", "01_1R-B", "01_1R-C", "01_1R-D", "01_1R-E", "01_1R-F"];
    $scope.roundpo = ["02_PO-A", "02_PO-B", "02_PO-C", "02_PO-D", "02_PO-E", "02_PO-F"];
    $scope.round2r = ["03_2R-A", "03_2R-B", "03_2R-C", "03_2R-D", "03_2R-E", "03_2R-F"];
    $scope.roundqf = ["04_QF", "05_SF", "06_F"];
    $scope.heatName = ["A部屋", "B部屋", "C部屋", "D部屋", "E部屋", "F部屋"];
    $scope.autoreloadend = "2020-12-28";

    // 変数設定
    $scope.message = undefined;
    var body = {};

    function unionGetRound() {
      $http({
        method: 'GET',
        url: $sce.trustAsResourceUrl(getUrl),
        headers: {}
      }).then(function (data) {
        console.log(data);
        if (data.status == 200) {
          console.log(data.data);
          $scope.data = data.data;
          for (var roundName in $scope.data) {
            var round = $scope.data[roundName];
            if (round.item && round.item.hist && round.item.hist.players) {
              round.item.hist.players.sort(function (a, b) {
                return a.priority - b.priority;
              })
            }
          }

        } else {
          showMessage("エラーが発生しました。", 1000);
        }
      }, function (err) {
        showMessage("エラーが発生しました。", 1000);
        console.log(err);
      });
    }

    function jump() {
      $timeout(function () {
        $window.location.reload();
      });
    }

    var t = $interval(function () {
      if ($scope.autoreloadend && $scope.autoreloadend > new Date().toISOString()) {
        unionGetRound();
      }
    }, 30000);
    unionGetRound();

    $scope.jump = jump;
    $scope.unionGetRound = unionGetRound;

    $scope.repeatChar = function (char, count) {
      return char.repeat(count);
    }
  }
]);