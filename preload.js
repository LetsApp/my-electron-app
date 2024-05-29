// preload.js

const { ipcRenderer } = require('electron');

// Listen for devices event from the main process


    // Populate the dropdown with options
    ipcRenderer.on('devices', (event, data) => {
        const deviceSelect = document.getElementById('deviceSelect');
        const registerButton = document.getElementById('registerButton');
        var selectedId = ''
        data.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option._id;
            optionElement.textContent = option.name;
            deviceSelect.appendChild(optionElement);
        });
  

    deviceSelect.addEventListener('change', (event) => {
        selectedId = event.target.value;
        ipcRenderer.send('selected-option', selectedId);
    });
    registerButton.addEventListener('click', () => {
        // Invoke the function from index.js
        if(selectedId!=''){
            ipcRenderer.send('submit',selectedId );
        }else{

        }
        
    });
  
});
