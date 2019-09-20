const http = require('http');

exports.handler = function(input, context) {
    const zlib = require('zlib');

    var zippedInput = new Buffer.from(input.awslogs.data, 'base64');


    zlib.gunzip(zippedInput, function(error, buffer) {
        if (error) { context.fail(error); return; }

        // parse the input from JSON
        const postData = buffer.toString('utf8');
        const awslogsData = JSON.parse(postData);

        console.log(awslogsData);
        var log_group = awslogsData.logGroup;

        var tag_name1 = "";

        if (log_group == "arkwhale-rel-ap") {
            tag_name1 = "docker.ap";
        } else if (log_group == "arkwhale-rel-eventsvr") {
            tag_name1 = "docker.eventsvr";
        } else if (log_group == "arkwhale-rel-web") {
            tag_name1 = "docker.nginx";
        } else {
            tag_name1 = "docker.test";
        }

        console.log("~~~~~~~~~~~~~~~~~");
        console.log(tag_name1);
        console.log("~~~~~~~~~~~~~~~~~");

        const logs = awslogsData.logEvents;

        logs.forEach(function(item, index, array){
          console.log("============");
          item['log'] = item.message;
          if (item.log.indexOf("error") != -1) {
            item['source'] = "stderr";
          } else {
            item['source'] = "stdout";
          }
          delete item['message'];
          console.log(item);

          console.log("============");
          post_fluentd(JSON.stringify(item), tag_name1);
        });
    });
};

function post_fluentd(data, tag_name) {
    const options = {
        hostname: '10.2.0.97',
        port: 9880,
        path: '/' + tag_name,
        method: 'POST',
        headers:{
            'Content-Type':'application/json',
            'Content-Length': Buffer.byteLength(data)
        }
    };

    const req = http.request(options, function(res){
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
            console.log(`BODY: ${chunk}`);
        });

        res.on('end', () => {
            console.log('No more data in response.');
        });
    });

    req.write(data);
    req.end;
}

