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

const serverDomains = './Entities/Domains/';
if (!fs.existsSync(serverDomains)) {
    fs.mkdirSync(serverDomains);
}
var DomainsJson = [];
fs.exists(path.join(process.cwd() + "/Entities/Domains/Domains.json"), function (exists) {
    if (!exists) {
        fs.writeFile('Entities/Domains/Domains.json', JSON.stringify(DomainsJson, null, 2), function (err) {
            if (err) return console.log(err);
        });
    } else {
        var rawdata = fs.readFileSync('Entities/Domains/Domains.json');
        DomainsJson = JSON.parse(rawdata);
    }
});

function runServer() {
    port = process.argv[2] || serverPort;
    var fs = require('fs');
    var domainsJsonChanged = false;
    const serverFolder = './Entities/Domain/';
    if (!fs.existsSync(serverFolder)) {
        fs.mkdirSync(serverFolder);
    }
    http.createServer(function (request, response) {
        if (request.method == "GET") {
            var uri = url.parse(request.url).pathname;
            if (uri == "/" || uri == "/domains.json") {
                pageData = [];
                var rawdata = fs.readFileSync('Entities/Domains/Domains.json');
                DomainsJson = JSON.parse(rawdata);
                fs.readdir(serverFolder, (err, files) => {
                    if (files.length === 0) {
                        sendPage(JSON.stringify(pageData));
                    } else {
                        files.forEach(file => {
                            var rawServerInformationdata = fs.readFileSync("Entities/Domain/" + file);
                            serverInformation = JSON.parse(rawServerInformationdata);
                            var currentDay = new Date();
                            var oldDay = new Date(serverInformation.TimeOfLastHeartbeat);
                            var DomainName = serverInformation.PlaceName;
                            if (currentDay.getTime() - oldDay.getTime() <= 30000) {
                                var domainExists = false;
                                for (let i = 0; i < DomainsJson.length; i++) {
                                    if (serverInformation.DomainID == DomainsJson[i].DomainID) {
                                        domainExists = true;
                                        if (DomainsJson[i].DomainName != "") {
                                            DomainName = DomainsJson[i].DomainName;
                                        }
                                    }
                                }
                                if (!domainExists) {
                                    domainsJsonChanged = true;
                                    var domainJson = {
                                        "DomainID": serverInformation.DomainID,
                                        "DomainName": ""
                                    };
                                    DomainsJson.push(domainJson);
                                }
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
                                        "Domain Name": DomainName,
                                        "Owner": serverOwner,
                                        "Visit": "hifi://" + serverInformation.DomainID,
                                        "People": serverInformation.TotalUsers
                                    };
                                    pageData.push(domain);
                                }
                            }
                        });
                        if (domainsJsonChanged) {
                            fs.writeFile('Entities/Domains/Domains.json', JSON.stringify(DomainsJson, null, 2), function (err) {
                                if (err) return console.log(err);
                            });
                            domainsJsonChanged = false;
                        }
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
        } else if (request.method == "POST") {
            let data = '';
            request.on('data', chunk => {
                data += chunk;
            })
            request.on('end', () => {
                var pushedDomainId = JSON.parse(data).domainId;
                var pushedDomainDomainName = JSON.parse(data).domainName;
                fs.exists(path.join(process.cwd() + "/Entities/Domain/" + pushedDomainId + ".json"), function (exists) {
                    if (exists) {
                        var rawServerInformationdata = fs.readFileSync("Entities/Domain/" + pushedDomainId + ".json");
                        serverInformation = JSON.parse(rawServerInformationdata);
                        if (serverInformation.LastSenderKey.split(":")[0] == response.connection.remoteAddress.split(":")[3]) {
                            var rawdata = fs.readFileSync('Entities/Domains/Domains.json');
                            DomainsJson = JSON.parse(rawdata);
                            for (let i = 0; i < DomainsJson.length; i++) {
                                if (DomainsJson[i].DomainID == pushedDomainId) {
                                    DomainsJson[i].DomainName = pushedDomainDomainName;
                                }
                            }
                            fs.writeFile('Entities/Domains/Domains.json', JSON.stringify(DomainsJson, null, 2), function (err) {
                                if (err) return console.log(err);
                            });
                        }
                    }
                });
            })
        }
    }).listen(parseInt(port, 10));

    console.log("Project Apollo Companion Server Up");

}
