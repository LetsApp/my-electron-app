const { app, BrowserWindow, screen, ipcMain} = require('electron/main')
const path = require('path');
const url = require('url');
const fs = require('fs');
const { exec } = require('child_process');
const https = require('https');
const getmac = require('getmac');
const rl = require ("readline-promise")
const readline = rl.default;
const os  = require('os');
const disk = require('diskusage');
const si = require('systeminformation');
const wmi = require('wmi-client');
const { contextBridge } = require('electron');
const process = require('process');
var connectionManager = require('./connectionManager')
var DeviceInfo = require('./deviceInfo')
var queryString = require('querystring')
// Check if CSV file exists
function checkCSVFile() {
    return fs.existsSync(path.join(__dirname, 'reg.csv'));
}

function createWindow() {
    // Create the browser window

    if(!checkCSVFile()){
   var devices = []
   var dept = ''
        
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    // Load the index.html file
    
        mainWindow.loadURL(url.format({
            pathname: path.join(__dirname, 'index.html'),
            protocol: 'file:',
            slashes: true
        }));
        // Send devices array to the renderer process
    mainWindow.webContents.on('did-finish-load', () => {
        getDevices().then(devicesResult=>{
            devices = devicesResult
            console.log(devicesResult)
            mainWindow.webContents.send('devices', devicesResult);
        }).catch(err=>{
            mainWindow.loadURL(url.format({
                pathname: path.join(__dirname, 'no-internet.html'),
                protocol: 'file:',
                slashes: true
            }));
            
            console.log(err)
        })
    });
     // Listen for selected option ID
     ipcMain.on('selected-option', (event, selectedId) => {
        console.log('Selected Option ID:', selectedId);
        // Handle the selected ID as needed
        dept = selectedId
    });

    ipcMain.on('submit',(event,id)=>{
        console.log(id)
        registerDevice(id).then(result=>{
               //create csv file
            createRegistrationCSVFile(id,result._id)
            mainWindow.loadURL(url.format({
                pathname: path.join(__dirname, 'device-registered.html'),
                protocol: 'file:',
                slashes: true
            }));
        })

    })
}else{
    checkInternetConnectivity()
}


}
// Event handler for when Electron has finished initialization
app.on('ready', createWindow);

// Quit when all windows are closed
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Activate the app on macOS when the dock icon is clicked
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

app.setLoginItemSettings({
    openAtLogin: true,
    openAsHidden:true
}
)

function createRegistrationCSVFile(dept,id) {
    const data = `${dept},${id}`;
    var filePath = path.join(__dirname, 'reg.csv')
    fs.writeFileSync(filePath, data, (err) => {
        if (err) throw err;
        console.log('CSV file created successfully.');
    });
}
function getDevices(){

    return new Promise((resolve, reject) => {
        https.get('https://234e-2401-4900-5293-a075-e5b8-8d9e-5e66-3b0f.ngrok-free.app/api/users', (res) => {
            res.setEncoding('utf8');
            var resBody = '';
            res.on('data', function (chunk) {
                resBody += chunk
            });
            res.on('end', function () {  
          
                try{
                   var jsonRes = JSON.parse(resBody);
                   console.log(jsonRes)
                  
                   resolve(jsonRes)
                }
                catch(err){

                }
            })
            
        }).on('error', (err) => {
            console.log(err)
            reject(err);
        });
    });
}

function registerDevice(id){

    return new Promise(async (resolve, reject) => {
        var cpu = await DeviceInfo.getOSInfo()
        var disk = await DeviceInfo.getDiskInfo()
        var mac = await DeviceInfo.getMacAddress()
        var userName = await DeviceInfo.getUserName()
        var systemManModel = await DeviceInfo.getSystemmanufacturerModel()
        var manufacturer = systemManModel.manufacturer
        var model = systemManModel.model
        var RAM = await DeviceInfo.getRAM()
        var graphicCrd = await DeviceInfo.getGraphicsCard()
        var battery = await DeviceInfo.getBattery()
        var firstUseDate = await DeviceInfo.getFirstUSeDate()
        console.log(cpu)
         console.log(disk)
    var data =  queryString.stringify({ 
        manufacturer: manufacturer,
        model:model,
        cpu:JSON.stringify(cpu),
        ram:JSON.stringify(RAM),
        disk:JSON.stringify(disk),
        mac_address:mac,
        username:userName,
        department:id,
        graphic_card:JSON.stringify(graphicCrd),
        battery:JSON.stringify(battery),
    });
  
    
       
        
        // Define request options
        const options = {           
            hostname: '234e-2401-4900-5293-a075-e5b8-8d9e-5e66-3b0f.ngrok-free.app',
            port: 443, // HTTPS default port
            path: '/api/computers',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(data)
            }
        };
        const req = https.request(options, (res) => {
            console.log(`Status code: ${res.statusCode}`);
            console.log('Headers:', res.headers);
            res.setEncoding('utf8');
            var resBody = '';
            res.on('data', function (chunk) {
                resBody += chunk
            });
            res.on('end', function () {  
                try{
                   var jsonRes = JSON.parse(resBody);
                   console.log(jsonRes)
                   resolve(jsonRes)
                }
                catch(err){
                    throw err
                }
            })
        });
        
        // Handle errors
        req.on('error', (error) => {
        console.error('Error:', error);
        });

        // Send the request body
        req.write(data);

        // End the request
        req.end();
       
    });
}






function readAndLogCSV() {
    const fileStream = fs.createReadStream(path.join(__dirname, 'reg.csv'));
    const rl = readline.createInterface({
        input: fileStream
    });
    let lastLine = '';
    rl.on('line', (line) => {
        console.log(line); // Log each line of the CSV file
        lastLine = line; 
    });
    rl.on('close', () => {
        var log = lastLine.split(',')
        var dept = log[0]
        var computerId = log[1]
        updateDevice(dept,computerId)
        console.log('File has been read completely.');
    });
}


function updateDevice(id,computerId){

    return new Promise(async (resolve, reject) => {
        var cpu = await DeviceInfo.getOSInfo()
        var disk = await DeviceInfo.getDiskInfo()
        var mac = await DeviceInfo.getMacAddress()
        var userName = await DeviceInfo.getUserName()
        var systemManModel = await DeviceInfo.getSystemmanufacturerModel()
        var manufacturer = systemManModel.manufacturer
        var model = systemManModel.model
        var RAM = await DeviceInfo.getRAM()
        var graphicCrd = await DeviceInfo.getGraphicsCard()
        var battery = await DeviceInfo.getBattery()
        var firstUseDate = await DeviceInfo.getFirstUSeDate()
        console.log(cpu)
         console.log(disk)
    var data =  queryString.stringify({ 
        manufacturer: manufacturer,
        model:model,
        cpu:JSON.stringify(cpu),
        ram:JSON.stringify(RAM),
        disk:JSON.stringify(disk),
        mac_address:mac,
        username:userName,
        department:id,
        graphic_card:JSON.stringify(graphicCrd),
        battery:JSON.stringify(battery),
        last_active:new Date()
    });
  
    
       
        
        // Define request options
        const options = {           
            hostname: '234e-2401-4900-5293-a075-e5b8-8d9e-5e66-3b0f.ngrok-free.app',
            port: 443, // HTTPS default port
            path: '/api/computers/'+computerId,
            method: 'PUT',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(data)
            }
        };
        const req = https.request(options, (res) => {
            console.log(`Status code: ${res.statusCode}`);
            console.log('Headers:', res.headers);
            res.setEncoding('utf8');
            var resBody = '';
            res.on('data', function (chunk) {
                resBody += chunk
            });
            res.on('end', function () {  
                try{
                   var jsonRes = JSON.parse(resBody);
                   console.log(jsonRes)
                   resolve(jsonRes)
                }
                catch(err){
                    throw err
                }
            })
        });
        
        // Handle errors
        req.on('error', (error) => {
        console.error('Error:', error);
        });

        // Send the request body
        req.write(data);

        // End the request
        req.end();
       
    });
}


function checkInternetConnectivity(retries = 10, delay = 120000) {
    let attempts = 0;
    let isConnected = false;

    function checkConnectivity() {
        attempts++;
        fetch('https://234e-2401-4900-5293-a075-e5b8-8d9e-5e66-3b0f.ngrok-free.app/api/users/ping', { mode: 'no-cors' })
            .then(() => {
                isConnected = true;
                console.log('Internet connectivity is available.');
                readAndLogCSV()
            })
            .catch(() => {
                if (attempts < retries && !isConnected) {
                    console.log(`No internet connectivity. Retrying in 2 minutes... (Attempt ${attempts} of ${retries})`);
                    setTimeout(checkConnectivity, delay);
                } else if (!isConnected) {
                    console.log('No internet connectivity after 10 attempts. Stopping retries.');
                }
            });
    }

    checkConnectivity();
}