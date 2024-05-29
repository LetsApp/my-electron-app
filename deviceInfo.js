const getmac = require('getmac');
const rl = require ("readline-promise")
const readline = rl.default;
const os  = require('os');
const disk = require('diskusage');
const si = require('systeminformation');
const wmi = require('wmi-client');
const { resolve } = require('path');
const machineId = require('node-machine-id');




function checkWindows() {
   

// Get the platform
const platform = os.platform();

// Check if the platform is Windows or macOS
if (platform === 'win32') {
   return true
} else if (platform === 'darwin') {
    return false
} else {
    console.log('The app is running on a different operating system.');
    return true
}
}

exports.getOSInfo = async function(){


    return new Promise( (resolve, reject) => {
const memoryUsage = process.memoryUsage();

const ramType = memoryUsage.type;

    // Get OS information
const osInfo = {
    platform: os.platform(),
    type: os.type(),
    release: os.release(),
    architecture: os.arch(),
    hostname: os.hostname(),
    total_memory: bytesToGB(os.totalmem()),
    free_memory: bytesToGB(os.freemem()),
    ram_type:ramType
};
// Get CPU information
const cpuInfo = {
    model: os.cpus()[0].model,
    speed: os.cpus()[0].speed,
    cores: os.cpus().length
};


    resolve({osInfo,cpuInfo})
    })
}

function bytesToGB(bytes) {
    return (bytes / Math.pow(1024, 3)).toFixed(2) + ' GB'; // Divide by 1024^3 (1024*1024*1024)
}

exports.getDiskInfo = async function(){
    // Get disk information
    return new Promise( (resolve, reject) => {
         disk.check('/', (err, info) => {
    if (err) {
        console.error(err);
        return;
    }
    const diskInfo = {
        total: bytesToGB(info.total),
        free: bytesToGB(info.free),
        used: bytesToGB(info.total - info.free)
    };

    resolve( diskInfo)

});
    })
}



function getBatteryInfoWindows() {
    const query = 'SELECT * FROM Win32_Battery';
    wmi.query(query, (err, result) => {
        if (err) {
            console.error('Error fetching battery information:', err);
            return;
        }
        return result
    });
}

async function getBatteryInfoMacOS() {
    try {
        const battery = await si.battery();
        return battery
    } catch (error) {
        console.error('Error fetching battery information:', error);
    }
}


async function getSystemInfo() {
    try {
        // Get MAC address
       

        // Get system UUID
        const systemInfo = await si.system();
        const systemUUID = systemInfo.uuid;


        console.log('System UUID:', systemUUID);

        // Return MAC address and system UUID if needed
        return { systemUUID };
    } catch (error) {
        console.error('Error getting system info:', error);
    }
}

function getGraphicsCardInfoWindows() {
    exec('wmic path win32_videocontroller get name', (err, stdout, stderr) => {
        if (err) {
            console.error('Error fetching graphics card information:', err);
            return;
        }
        return stdout.trim()
    });
}

// Function to fetch graphics card information on macOS
async function getGraphicsCardInfoMacOS() {
    try {
        const graphics = await si.graphics();
        return graphics
    } catch (error) {
        console.error('Error fetching graphics card information:', error);
    }
}


exports.getMacAddress = async function(){
  return await getmac.default();
}

exports.getUserName = async function(){
    return os.userInfo().username;
  }



  exports.getSystemmanufacturerModel = async function(){
    try {
        const system = await si.system();
        return {
            manufacturer: system.manufacturer,
            model: system.model
        };
    } catch (error) {
        console.error('Error getting system information:', error);
        throw error;
    }
  }

  exports.getRAM = async function(){
    try {
        const memData = await si.mem();
        const memTypeData = await si.memLayout();
        return {
            totalMemoryGB: (memData.total / (1024 ** 3)).toFixed(2) +' GB', // Convert bytes to GB
            type: memTypeData[0].type || 'Unknown'
        };
    } catch (error) {
        console.error('Error getting RAM details:', error);
        throw error;
    }
  }
  exports.getGraphicsCard = async function(){

    if(checkWindows()){
        return getGraphicsCardInfoWindows()
    }else{
        return getGraphicsCardInfoMacOS()
    }
  }


  exports.getBattery = async function(){

    if(checkWindows()){
        return getBatteryInfoWindows()
    }else{
        return getBatteryInfoMacOS()
    }
  }


  exports.getFirstUSeDate = async function(){
    const osInfo = await si.osInfo();
  const firstUseDate = osInfo.release
            ? new Date(osInfo.release * 1000).toLocaleString() // Convert seconds to milliseconds
            : 'Unknown';

return firstUseDate
  }
