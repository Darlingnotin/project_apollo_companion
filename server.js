fs = require("fs")
var serverPort;
var http = require("http"),
    url = require("url"),
    path = require("path"),
    fs = require("fs")
var configJson = {
    "httpServerPort": "9401",
};
fs.exists(path.join(process.cwd() + "/serverConfig.json"), function (exists) {
    if (!exists) {
        fs.writeFile('serverConfig.json', JSON.stringify(configJson, null, 2), function (err) {
            if (err) return console.log(err);
        });
        serverPort = configJson.httpServerPort;
        runServer();
    } else {
        var rawdata = fs.readFileSync('serverConfig.json');
        configJson = JSON.parse(rawdata);
        serverPort = configJson.httpServerPort;
        runServer();
    }
});

function runServer() {
    port = process.argv[2] || serverPort;
    var fs = require('fs');
    const serverFolder = './Entities/Domain/';
    if (!fs.existsSync(serverFolder)) {
        fs.mkdirSync(serverFolder);
    }
    http.createServer(function (request, response) {
        var uri = url.parse(request.url).pathname;
        if (uri == "/" || uri == "/domains.json") {
            pageData = [];
            fs.readdir(serverFolder, (err, files) => {
                if (files.length === 0) {
                    sendPage(JSON.stringify(pageData));
                } else {
                    // JSON.stringify(new Date)
                    files.forEach(file => {
                        var rawServerInformationdata = fs.readFileSync("Entities/Domain/" + file);
                        serverInformation = JSON.parse(rawServerInformationdata);
                        var currentDay = new Date();
                        var oldDay = new Date(serverInformation.TimeOfLastHeartbeat);
                        if (currentDay.getTime() - oldDay.getTime() <= 30000) {
                            var serverOwner;
                            if (serverInformation.SponserAccountID != null) {
                                var rawServerOwnerInformationdata = fs.readFileSync("Entities/Account/" + serverInformation.SponserAccountID + ".json");
                                serverOwnerInformation = JSON.parse(rawServerOwnerInformationdata);
                                serverOwner = serverOwnerInformation.Username
                            } else {
                                serverOwner = "Unregistered";
                            }
                            if (serverInformation.Restriction == "open") {
                                var domain = {
                                    "Domain Name": serverInformation.PlaceName,
                                    "Owner": serverOwner,
                                    "Visit": "hifi://" + serverInformation.DomainID,
                                    "People": serverInformation.TotalUsers
                                };
                                pageData.push(domain);
                            }
                        }
                    });
                    sendPage(JSON.stringify(pageData));
                }
            });
            return;
        }
        function sendPage(pageData) {
            response.writeHead(200, { "Content-Type": "text/html" });
            response.write(pageData);
            response.end();
        }
    }).listen(parseInt(port, 10));

    console.log("Project Apollo Companion Server Up");

}
