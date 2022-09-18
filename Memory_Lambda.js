"use strict"

const ddb = require("ddb");
const resp = require("responses");
const parser = require("parser");

const name_regex = /^[\w#!\$%\?&\*\(\)@\-=_+,.~\{\}\[\]]{3,32}$/;
// a-z A-Z 0-9 # ! $ % ? & * ( ) @ - = _ + , . ~ { } [ ]

exports.handler = async (event) => {
    
    const ref = event.headers.origin;    
    if ((process.env.AWS_LAMBDA_FUNCTION_VERSION != "$LATEST") && // ie not in prod
        (ref != "https://m4nusky.com") && 
        (ref != "https://www.m4nusky.com")) return resp.unauth("Invalid Origin");
    
    const query = parser.getQuery(event);
    let status = "failed";
    let result = "unkown op";
    
    if (query.version != "4") return resp.object( { "op": query.op, "status": "failed", body: "Invalid version" } );

    switch (query.op) {

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
            
            result = data.timestamp;
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
            status = "failed";
        } catch (ex) { result = ex.message; status = "failed"; }
        break;
        
        case 'global': try {
            result = await ddb.getAllRows("Memory");
            status = "ok";
        } catch (ex) { result = ex.message; status = "failed"; }
        break;

        case 'user': try {
            /*let data = await ddb.selectRows("Memory", 
                                            { "#name": "name", "#date": "timestamp" },
                                            { ":name": query.name, ":last48h": (Date.now() - (1000 * 3600 * 48)) },
                                            "#name = :name AND #date >= :last48h");
            */
            result = await ddb.selectRows("Memory", "name", query.name);
            status = "ok";
        } catch (ex) { result = ex.message; status = "failed"; }
        break;

    }
    
    return resp.object( { "op": query.op, "status": status, body: result } );
};

function validateNum(num, min, max) {
    var res = Number(num);
    if (res < min) throw Error("Invalid Number");
    if (res > max) throw Error("Invalid Number");
    return res;
}