async function analyzeImages(fileList) {
    if (fileList==null && fileList.length==0) {
        output.innerText = "Please select an image file first.";
        return;
    }

    try {
        submitBtn.disabled = true;
        output.innerText = "Analyzing image... Please wait...";

        // Convert file to base64 structure
        const imagePromises = fileList.map(fileToGenerativePart);
        const imageParts = await Promise.all(imagePromises);
        const textPrompt = {			
            text: "Extract information from uploaded medical prescriptions. Return a JSON object with the following schema: {doctorName: string, patientName: string, date: string, medications: [{name: string, dosage: string, frequency: string, duration: string}]}"
        };

        // 3. Assemble everything into a single, flat contents parts array
        const payloadParts = [textPrompt, ...imageParts];

        const url = 'https://analyseimages-108214119816.asia-south1.run.app';
        //var accessToken = "ya29.a0ARGnu0aYAHiU8uroiJ9wdpwtk8IC9wtkQg9QlVzaJds7H_GmB6XGfbg2sbMxc0nG3oMyWmyQvVArF55uqhticaRCHiNj-4O58k0y-a3QutEMTL81db4KnLlPntjZWGn4dD4VaXtUDQNBcZIDBSc6ticZXo3MKN9AABTzZ6WmgzntrnELwnbcKRk7baanNr3_eG4RHcwaCgYKAXwSARESFQHGX2MiHq1K2b5cDYpwQEF8ISBGVw0206"
        //GetAccessTokenForRequestAsync();
        
        // Configuration
        const CLIENT_ID = '108214119816-d6p8gaodsu3bcan7efnctd7v6rmpet7i.apps.googleusercontent.com';         
        let tokenClient;
        let idToken = null;

        // Initialize Google Identity Services
        window.onload = function () {
            tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: CLIENT_ID,
                scope: 'openid https://googleapis.com', 
                callback: (tokenResponse) => {
                    // Note: For Cloud Functions, we specifically need an ID Token.
                    // Google's initTokenClient returns an Access Token by default.
                    // To fetch a valid OIDC ID Token from the browser, we use the identity picker or standard flow.
                    if(tokenResponse && tokenResponse.access_token) {
                        idToken = tokenResponse.credential;
                    }
                }
            });

            // Alternative: Use the Sign-In with Google One Tap / Button for ID Tokens
            // google.accounts.id.initialize({
            //     client_id: CLIENT_ID,
            //     callback: handleCredentialResponse
            // });

            // google.accounts.id.renderButton(
            //     document.getElementById("loginBtn"),
            //     { theme: "outline", size: "large" }
            // );
        };

        // The browser handles standard CORS because the server permits it.
        const response = await fetch(url, {
            method: 'POST', 			
            headers: {
                //'Authorization': `Bearer ${idToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ payloadParts: payloadParts })		
        });

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        const data = await response;
        output.innerText = JSON.stringify(data);
        // Display response text
        //output.innerText = response.output_text; 
    } catch (error) {
        output.innerText = "Error: " + error.message;
        console.error("Error calling Gemini API:", error);
    } finally {
        submitBtn.disabled = false;
    } 
}

function fileToGenerativePart(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            // Extract the base64 data string by splitting off the data URL prefix 
            const base64Data = reader.result.split(',')[1];
            resolve({
                inlineData: {
                    data: base64Data,
                    mimeType: file.type
                },
            });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 *	File upload
**/
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const fileListDisplay = document.getElementById('file-list');

const submitBtn = document.getElementById('txtfyButton');
        
const output = document.getElementById('output');

// Click to trigger file browse or mobile camera menu
dropZone.addEventListener('click', () => fileInput.click());

// Visual highlight on drag events
['dragenter', 'dragover'].forEach(eventName => {    
    dropZone.addEventListener(eventName, (e) => {        
        e.preventDefault();        
        dropZone.classList.add('dragover');
    }, false);
});

['dragleave', 'drop'].forEach(eventName => {    
    dropZone.addEventListener(eventName, (e) => {        
        e.preventDefault();                
        dropZone.classList.remove('dragover');
    }, false);
});

// Handle dropped files
dropZone.addEventListener('drop', (e) => {    
    const dt = e.dataTransfer;    
    const files = dt.files;    
    console.log(files.length);  
    handleFiles(files);
});

// Master array to preserve accumulated files        
let allFiles = [];       

fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
});

function handleFiles(files){
    // 1. Convert FileList to a standard array and append to master list            
    const newFiles = Array.from(event.target.files);            
    allFiles = allFiles.concat(newFiles);          
    
    // 2. Rebuild the file input's internal FileList using DataTransfer            
    const dataTransfer = new DataTransfer();            
    allFiles.forEach(file => dataTransfer.items.add(file));            

    // 3. Overwrite input files with the freshly bundled cumulative list            
    fileInput.files = dataTransfer.files;            

    // 4. Refresh display UI            
    updateDisplay();
}

function updateDisplay() {            
    fileListDisplay.innerHTML = '';            
    allFiles.forEach((file, index) => {                
        var li = document.createElement('li');

        var imgElement = document.createElement("img");        
        imgElement.src = URL.createObjectURL(file); 
        imgElement.style.dispay = 'block'; 
        imgElement.style.maxWidth = '5%';
        imgElement.style.height = 'auto';
                
        var textElement = document.createTextNode(`${file.name} (${(file.size / 1024).toFixed(1)} KB) `);               
                
        li.appendChild(imgElement);
        li.appendChild(textElement);
    
        // Optional: Provide a removal action                
        var removeBtn = document.createElement('button');                
        removeBtn.textContent = 'Remove';                
        removeBtn.onclick = () => removeFile(index);
        li.appendChild(removeBtn);
                
        fileListDisplay.appendChild(li);            
    });        
}


function removeFile(indexToRemove) {            
    // Remove from global array tracker            
    allFiles.splice(indexToRemove, 1);
    
    // Re-sync the HTML Input FileList collection            
    var dataTransfer = new DataTransfer();            
    allFiles.forEach(file => dataTransfer.items.add(file));            
    fileInput.files = dataTransfer.files;
         
    updateDisplay();        
}

// Reference the button element
const btn = document.getElementById("txtfyButton");

// Attach a click event listener to run the google ai function
btn.addEventListener("click", async () => {
    await analyzeImages(allFiles);
});