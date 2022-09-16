const ddb = require("./ddb2.js");
const resp = require("responses");
const parser = require("parser");

const name_regex = /^[\w#!\$%\?&\*\(\)@\-=_+,.~\{\}\[\]]{3,32}$/;
// a-z A-Z 0-9 # ! $ % ? & * ( ) @ - = _ + , . ~ { } [ ]

exports.handler = async (event) => {
    const query = parser.getQuery(event);
    let status = "failed";
    let result = "unkown op";
    
    switch (query.op) {

        // TODO remove
        case 'get': try {
            result = await ddb.getRow("Memory", "timestamp", Number(query.key));
            status = "ok";
        } catch (ex) { result = ex.message; status = "failed"; }
        break;

        // TODO remove
        case 'random': try {
            let max = (query.max) ? Number(query.max) : 1;
            for (var x = 0; x < max; ++x) {
                let data = {
                    "timestamp": Date.now(),
                    "name": "Example" + randText(4 + randInt(2)),
                    "score": randInt(1024),
                    "level": randInt(20),
                    "step": randInt(4),
                    "SQTY": 2 + randInt(2),
                    "CSM": randInt(5),
                    "SSM": randInt(2)
                    };
                await ddb.setRow("Memory", data);
            }
            
            result = await ddb.getSingleColumn("Memory", "score");
            status = "ok";
        } catch (ex) { result = ex.message; status = "failed"; }
        break;
        
        case 'add': try {
            if (!(name_regex.test(query.name))) throw Error("Invalid Name: " + query.name);

            let data = {
                "timestamp": Date.now(),
                "name": query.name,
                "score": validateNum(query.score, 0, Infinity),
                "level": validateNum(query.level, 1, Infinity),
                "step": validateNum(query.step, 0, Number(query.level)),
                "SQTY": validateNum(query.SQTY, 2, 4),
                "CSM": validateNum(query.CSM, 0, 5),
                "SSM": validateNum(query.SSM, 0, 2)
                };
            await ddb.setRow("Memory", data);
            
            result = await ddb.selectRows("Memory", "name", query.name);
            //result = data.sort( (a, b) => (Number(b.score) - Number(a.score)) );
            status = "ok";
        } catch (ex) { result = ex.message; status = "failed"; }
        break;

        case 'describe': try {
            result = await ddb.describe("Memory");
            status = "ok";
        } catch (ex) { result = ex.message; status = "failed"; }
        break;

        case 'cleanup': try {
            result = "////UNIMPLEMENTED////";
            // clean by user+date (delete each user's oldest scores)
            // clean by user+num (delete each user's lowest scores)
            //status = "ok";
        } catch (ex) { result = ex.message; status = "failed"; }
        break;
        
        case 'global': try {
            result = await ddb.getAllRows("Memory");
            //result = data.sort( (a, b) => (Number(b.score) - Number(a.score)) );
            status = "ok";
        } catch (ex) { result = ex.message; status = "failed"; }
        break;

        case 'user': try {
            /*let data = await ddb.selectRows("Memory", 
                                            { "#name": "name", "#date": "timestamp" },
                                            { ":name": query.name, ":last48h": (Date.now() - (1000 * 3600 * 48)) },
                                            "#name = :name AND #date >= :last48h");
            */
            let data = await ddb.selectRows("Memory", "name", query.name);
            result = data.sort( (a, b) => (Number(b.score) - Number(a.score)) );
            status = "ok";
        } catch (ex) { result = ex.message; status = "failed"; }
        break;

    }
    
    return /*resp.object*/ object2( { "op": query.op, "status": status, body: result } );
};

function object2(Content, Format = false, Indent = 2) {
    let bodyContent = (Format) ? JSON.stringify(Content, null, Indent) : JSON.stringify(Content);
    return {
        statusCode: 200,
        body: bodyContent
    };
}

function randInt(max) {
    return Math.floor(Math.random() * max);
}

const alph = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_-0123456789";
function randText(len) {
    let res = "";
    for (var i = 0; i < len; ++i) res += alph[randInt(alph.length)];
    return res;
}

function validateNum(num, min, max) {
    var res = Number(num);
    if (res < min) throw Error("Invalid Number");
    if (res > max) throw Error("Invalid Number");
    return res;
}