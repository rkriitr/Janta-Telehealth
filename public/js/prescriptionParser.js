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
    if(allFiles.length > 2) {  
        alert("You can only upload a maximum of 2 images (front and back of prescription).");
        return;
    }  
    // 1. Convert FileList to a standard array and append to master list       
    const newFiles = Array.from(files || []);            
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

/**
 * Node.js (Express): 100 KB default for raw/JSON bodies. 
 * Popular parsers like Multer must have a specific limit configured manually.
 * Needs to use either multer or file uploads
**/
async function analyzeImages(fileList) {
    if (!fileList || fileList.length === 0) {
        output.innerText = "Please select an image file first.";
        return;
    } else if (fileList.length > 2) {
        output.innerText = "Please select only one prescription at a time (front and back, max 2 images).";
        return;
    }

    try {
        submitBtn.disabled = true;
        output.innerText = "Analyzing image... Please wait...";

        const formData = new FormData();
        fileList.forEach((file) => {
            formData.append('images', file);
        });

        const response = await fetch('/api/parse-prescription', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || 'Failed to parse prescription.');
        }

        output.innerText = typeof result.data === 'string' ? result.data : JSON.stringify(result.data || result, null, 2);
    } catch (error) {
        output.innerText = "Error: " + error.message;
        console.error("Error calling Gemini API:", error);
    } finally {
        submitBtn.disabled = false;
    }
}