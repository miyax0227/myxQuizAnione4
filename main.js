'use strict';

// Electronのモジュール
const electron = require("electron");

// アプリケーションをコントロールするモジュール
const app = electron.app;

// gcを許可する
app.commandLine.appendSwitch('js-flags', '--expose-gc');

// ウィンドウを作成するモジュール
const BrowserWindow = electron.BrowserWindow;

/**
 * メニューバーからDeveloper Toolを起動するためのコード アプリ化時特有のバグ追跡時に使用すること const Menu =
 * electron.Menu; var menu = Menu.buildFromTemplate([ { label : 'Toggle
 * DevTools', accelerator : 'Alt+Command+I', click : function() {
 * BrowserWindow.getFocusedWindow().toggleDevTools(); } } ]);
 * Menu.setApplicationMenu(menu);
 */

// メインウィンドウはGCされないようにグローバル宣言
let mainWindow;

// controlWindow, viewWindowのリスト
var controlWindows = {};
var viewWindows = {};
var lastHists = {};

// 全てのウィンドウが閉じたら終了
app.on('window-all-closed', function () {
  if (process.platform != 'darwin') {
    app.quit();
  }
});

// Electronの初期化完了後に実行
app.on('ready', function () {
  // deprecation警告を出力しない
  process.noDeprecation = true;

  const fs = require('fs');
  const ipc = require('electron').ipcMain;
  const BrowserWindow = require('electron').BrowserWindow;
  var data = JSON.parse(fs.readFileSync(__dirname + '/json/window.json', 'utf-8'));

  //
  ipc.on('registWindow', function (event, arg) {
    if (arg.hasOwnProperty('viewMode') && arg.hasOwnProperty('roundName')) {
      if (arg.viewMode) {
        viewWindows[arg.roundName] = event.sender;
        console.log("registWindow", arg.roundName, "\r");
        if (lastHists[arg.roundName]) {
          viewWindows[arg.roundName].send("createHist", lastHists[arg.roundName]);
          lastHists[arg.aroundName] = undefined;
        }
      } else {
        controlWindows[arg.roundName] = event.sender;
      }
    }
  });

  ipc.on('createHist', function (event, arg) {
    console.log("createHist", arg.roundName, "\r");
    lastHists[arg.roundName] = arg;
    try {
      if (viewWindows[arg.roundName]) {
        viewWindows[arg.roundName].send("createHist", arg);
      }
    } catch (e) {
      if (e.message == "Object has been destroyed") {
        console.log("Object has been destroyed", arg.roundName, "\r");
        viewWindows[arg.roundName] = undefined;
      } else {
        console.log(e);
      }
    }
  });

  // メイン画面の表示。ウィンドウの幅、高さを指定できる
  mainWindow = new BrowserWindow({
    width: data[1].width,
    height: data[1].height,
    x: data[1].left,
    y: data[1].top,
    webPreferences: {
      nodeIntegration: true
    }
  });

  mainWindow.loadURL('file://' + __dirname + '/index.html?key=IntJPKDO1h4WI4ykU0mnu8Vk0wE5CF9i90BhCRi4');
  // ウィンドウが閉じられたらアプリも終了
  mainWindow.on('closed', function () {
    mainWindow = null;

  });

});