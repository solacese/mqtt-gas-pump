const https = require("https");
    
exports.handler = async (event,context,callback) => {
   await sendRequest(event,callback);
};

var sendRequest = function(event,callback){
return new Promise(function(resolve, reject) {   
    var headers = event.headers;
    headers['Content-Length']=Buffer.byteLength(JSON.stringify(event.body));
        var options = {
            method: event.method,
            host: event.host_url,
            port: event.port_no,
            path: event.path,
            encoding: 'utf8',
            headers: headers
        };
    
    var req =  https.request(options,(res)=>{
        let data='';
        
        resolve(res.statusCode);
        res.on('data',chunk=>{
            data+=chunk;
        });
        
        res.on('end',()=>{
            callback(null, {
            statusCode: res.statusCode,
            headers: {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
            body: JSON.stringify(data)
        });
            console.log(data);
                        
        });
    
    }).on("error",(err)=>{
        console.log("Error: "+ err);
        reject(Error(err));
     
    });
    

    req.write(JSON.stringify(event.body));
    req.end();
});
    
    
}