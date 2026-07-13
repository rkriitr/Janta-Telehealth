/**
 * to send email via emailJS, public key is required
 */
emailjs.init({ publicKey: "zUivy_q6tTPURjGIq" });

/**
 * Orchestrates the active visual visibility maps across the vector network grid
 */
function switchPipeline(mode) {
    // Update Control UI Buttons
    const buttons = document.querySelectorAll('.btn-toggle');
    buttons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    // Select SVG Node Clusters
    const d2dFlow = document.getElementById('flow-d2d');
    const d2pFlow = document.getElementById('flow-d2p');
    const rmpNode = document.getElementById('node-rmp');
    const d2dImagesId = document.getElementById('d2d-images');

    if (mode === 'all') {
        d2dFlow.style.opacity = '1';
        d2pFlow.style.opacity = '1';
        rmpNode.style.opacity = '1';
        d2dImagesId .style.display= 'block';
    } else if (mode === 'd2d') {
        d2dFlow.style.opacity = '1';
        d2pFlow.style.opacity = '0.1';
        rmpNode.style.opacity = '1';
        d2dImagesId .style.display= 'block';
    } else if (mode === 'd2p') {
        d2dFlow.style.opacity = '0.1';
        d2pFlow.style.opacity = '1';
        rmpNode.style.opacity = '0.1';
        d2dImagesId .style.display= 'none';
    }
}

/**
 * Emails the request for pitchdeck
 */
document.getElementById('contactForm').addEventListener('submit', function(event) {
    // 1. Stop the page from reloading
    event.preventDefault(); 
    
    // 2. Automatically grab all text fields via FormData
    const formData = new FormData(event.target);

    // 3. Convert fields to a clean JavaScript object
    const data = Object.fromEntries(formData.entries());
    data.title = "Send me the Pitch deck";
    
    // Access individual inputs
    //console.log(data.name); 
    //console.log(data.company);
    //console.log(data.designation);
    //console.log(data.email);
    //console.log(data.title);
    //console.log(data.message);
    //console.log(data.call);
    //console.log(data.country);

    // form the message and change DOM based on success of email sending
    var contactFieldset = document.getElementById("contactFieldset");
    //var loader = document.createElement('div');
    var message;
    if(contactFieldset.nextElementSibling && contactFieldset.nextElementSibling.tagName === 'P'){
        contactFieldset.nextElementSibling.remove();
    }
    message = document.createElement('P');
    message.className = 'loader';
    contactFieldset.after(message);
    contactFieldset.disabled = true;
    //console.log(contactFieldset.nextElementSibling.outerHTML);
    
    // 4. Trigger your chosen email transmission method below
    emailjs.send("service_Pitchdeck", "template_i31q3j9", data).then(()=>{  message.classList.remove("loader"); message.textContent = 'Email sent successfully!'; message.style.color = 'green'; /*contactFieldset.after(message); console.log(message);*/}).catch((error)=> {message.classList.remove('loader'); message.textContent = 'Email could not be sent!'; message.style.color = 'red'; /*contactFieldset.after(message); console.error(message+" Failed to send:", error);*/});
});