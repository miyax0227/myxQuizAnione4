'use strict';
// 引数
const round = process.argv[2];
const date = process.argv[3];
// AWS設定
const aws = require('aws-sdk');
aws.config.update({
  region: 'ap-northeast-1'
});
// DynamoDB設定
var docClient = new aws.DynamoDB.DocumentClient({
  convertEmptyValues: true
});

async function getDynamodbLog() {
  var res = await docClient.query({
    TableName: "union",
    KeyConditionExpression: "#round = :round and #id > :id",
    ExpressionAttributeNames: {
      "#round": "round",
      "#id": "id"
    },
    ExpressionAttributeValues: {
      ":round": round,
      ":id": "status-" + date
    },
    ScanIndexForward: true
  }).promise();

  res.Items.map(item => {
    try {
      console.log(
        item.date.replace(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2}).+$/, "$1/$2/$3 $4:$5:$6") + "\t" +
        item.item.hist.header.qCount + "\t" +
        item.item.hist.header.tweet.replace(/\n/g, "")
      );
    } catch (e) {

    }
  })
}

getDynamodbLog();