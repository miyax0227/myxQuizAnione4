#!/bin/bash
aws --version
aws s3 sync ./css/ s3://myx-quiz-public/frk/css/
#aws s3 sync ./fonts/ s3://myx-quiz-public/frk/fonts/
#aws s3 sync ./img/ s3://myx-quiz-public/frk/img/
aws s3 sync ./js/ s3://myx-quiz-public/frk/js/
aws s3 sync ./json/ s3://myx-quiz-public/frk/json/
#aws s3 sync ./round/ s3://myx-quiz-public/frk/round/
aws s3 sync ./template/ s3://myx-quiz-public/frk/template/
#aws s3 cp ./history/current/nameList.json s3://myx-quiz-public/frk/history/current/nameList.json
aws s3 sync ./contents/ s3://myx-quiz-public/frk/contents/

aws cloudfront create-invalidation --distribution-id E242FNBAHQAURJ --paths "/*"
