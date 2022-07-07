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

    // パラメータストリングから取得
    var round = $location.search()["round"];
    var history = $location.search()["history"];
    var key = $location.search()["key"];

    if (!history) {
      history = 20;
    }
    $scope.round = round;

    // 定数定義
    const getUrl = "https://a2v4fab6o7.execute-api.ap-northeast-1.amazonaws.com/default/union-get?id=status&history=" + history + "&round=" + round;
    const putUrl = "https://a2v4fab6o7.execute-api.ap-northeast-1.amazonaws.com/default/union-put";

    // 変数設定
    $scope.message = undefined;
    var body = {};

    function unionGetHistory() {
      $http({
        method: 'GET',
        url: $sce.trustAsResourceUrl(getUrl),
        headers: {}
      }).then(function (data) {
        console.log(data);
        if (data.status == 200) {
          console.log(data.data);
          $scope.data = data.data;

        } else {
          showMessage("エラーが発生しました。", 1000);
        }
      }, function (err) {
        showMessage("エラーが発生しました。", 1000);
        console.log(err);
      });
    }

    function unionPutHistory(index) {
      $http({
        method: 'POST',
        url: $sce.trustAsResourceUrl(putUrl),
        headers: {
          'x-api-key': key
        },
        data: {
          "round": round,
          "id": "status",
          "item": $scope.data[index].item
        }
      }).then(function (data) {
        showMessage("書き換えが成功しました。", 1000);

      }, function (err) {
        showMessage("エラーが発生しました。", 1000);
        console.log(err);
      });
    }

    function unionInitialize() {
      $http({
        method: 'POST',
        url: $sce.trustAsResourceUrl(putUrl),
        headers: {
          'x-api-key': key
        },
        data: {
          "round": round,
          "id": "status",
          "item": {}
        }
      }).then(function (data) {
        showMessage("初期化に成功しました。", 1000);

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

    function dateFormat(dateString) {
      return dateString.substring(0, 4) + "/" +
        dateString.substring(4, 6) + "/" +
        dateString.substring(6, 8) + " " +
        dateString.substring(8, 10) + ":" +
        dateString.substring(10, 12) + ":" +
        dateString.substring(12, 14);
    }

    unionGetHistory();

    $scope.unionPutHistory = unionPutHistory;
    $scope.unionInitialize = unionInitialize;
    $scope.dateFormat = dateFormat;
    $scope.jump = jump;
  }
]);