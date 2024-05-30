const https = require('https');

exports.checkServerConnectivity= function(){
    return new Promise((resolve, reject) => {
        https.get('https://1c29-103-164-197-211.ngrok-free.app/api/users/ping', (res) => {
            resolve(true);
        }).on('error', (err) => {

            resolve(false);
        });
    });
}