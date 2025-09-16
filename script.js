let currentVcfData = '';

// Function to convert French characters to ASCII equivalents for QR code compatibility
function cleanFrenchChars(text) {
    if (!text) return text;
    
    const charMap = {
        'à': 'a', 'á': 'a', 'â': 'a', 'ã': 'a', 'ä': 'a',
        'À': 'A', 'Á': 'A', 'Â': 'A', 'Ã': 'A', 'Ä': 'A',
        'è': 'e', 'é': 'e', 'ê': 'e', 'ë': 'e',
        'È': 'E', 'É': 'E', 'Ê': 'E', 'Ë': 'E',
        'ì': 'i', 'í': 'i', 'î': 'i', 'ï': 'i',
        'Ì': 'I', 'Í': 'I', 'Î': 'I', 'Ï': 'I',
        'ò': 'o', 'ó': 'o', 'ô': 'o', 'õ': 'o', 'ö': 'o',
        'Ò': 'O', 'Ó': 'O', 'Ô': 'O', 'Õ': 'O', 'Ö': 'O',
        'ù': 'u', 'ú': 'u', 'û': 'u', 'ü': 'u',
        'Ù': 'U', 'Ú': 'U', 'Û': 'U', 'Ü': 'U',
        'ç': 'c', 'Ç': 'C',
        'ñ': 'n', 'Ñ': 'N',
        'ý': 'y', 'ÿ': 'y', 'Ý': 'Y'
    };
    
    return text.replace(/[àáâãäÀÁÂÃÄèéêëÈÉÊËìíîïÌÍÎÏòóôõöÒÓÔÕÖùúûüÙÚÛÜçÇñÑýÿÝ]/g, (match) => {
        return charMap[match] || match;
    });
}

document.addEventListener('DOMContentLoaded', function() {
    // Initialize event listeners
    document.getElementById('vcf-form').addEventListener('submit', function(e) {
        e.preventDefault();
        generateVCF();
    });
    
    // Add event listener for reset button
    document.getElementById('reset-btn').addEventListener('click', function() {
        resetForm();
    });
    
    // Add event listeners for QR modal
    document.getElementById('qr-modal-close').addEventListener('click', function() {
        closeQRModal();
    });
    
    document.getElementById('qr-modal-overlay').addEventListener('click', function() {
        closeQRModal();
    });
    
    // Add keyboard event listener for Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeQRModal();
        }
    });
    
    // Add event listeners for add buttons
    document.querySelectorAll('.add-btn').forEach(button => {
        button.addEventListener('click', function() {
            const type = this.getAttribute('data-type');
            addDynamicField(type);
        });
    });
    
    // Add event listeners for existing remove buttons
    document.querySelectorAll('.remove-btn').forEach(button => {
        button.addEventListener('click', function() {
            removeDynamicField(this);
        });
    });
    
    // Load sample data
    loadSampleData();
});

function addDynamicField(type) {
    const container = document.getElementById(`${type}-fields`);
    const newField = document.createElement('div');
    newField.className = 'form-group dynamic-field new-field';
    
    let defaultLabel = '';
    let placeholder = '';
    let inputType = 'text';
    
    switch(type) {
        case 'phone':
            defaultLabel = 'Mobile';
            placeholder = 'Numéro de téléphone';
            inputType = 'tel';
            break;
        case 'email':
            defaultLabel = 'Personnel';
            placeholder = 'Adresse e-mail';
            inputType = 'email';
            break;
        case 'website':
            defaultLabel = 'Personnel';
            placeholder = 'https://exemple.com';
            inputType = 'url';
            break;
        case 'custom':
            defaultLabel = 'Personnalisé';
            placeholder = 'Valeur personnalisée';
            inputType = 'text';
            break;
    }
    
    newField.innerHTML = `
        <div class="field-controls">
            <input type="text" class="field-type" placeholder="Étiquette" value="${defaultLabel}">
            <input type="${inputType}" placeholder="${placeholder}" class="field-input">
            <button type="button" class="remove-btn">×</button>
        </div>
    `;

    container.appendChild(newField);
    
    // Add event listener to the new remove button
    newField.querySelector('.remove-btn').addEventListener('click', function() {
        removeDynamicField(this);
    });
}

function removeDynamicField(button) {
    const field = button.closest('.dynamic-field');
    const container = field.parentElement;
    
    // Don't remove if it's the last field in the container
    if (container.children.length > 1) {
        field.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            field.remove();
        }, 300);
    }
}

function generateVCF() {
    // Build VCF content with original French characters
    let vcf = 'BEGIN:VCARD\n';
    vcf += 'VERSION:3.0\n';
    
    // Basic information - Keep original French characters for VCF
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    if (firstName || lastName) {
        vcf += `FN:${firstName} ${lastName}\n`;
        vcf += `N:${lastName};${firstName};;;\n`;
    }
    
    const org = document.getElementById('organization').value;
    if (org) vcf += `ORG:${org}\n`;
    
    const title = document.getElementById('title').value;
    if (title) vcf += `TITLE:${title}\n`;
    
    const service = document.getElementById('service').value;
    if (service) vcf += `X-SERVICE:${service}\n`;
    
    // Handle multiple phone numbers
    const phoneFields = document.querySelectorAll('#phone-fields .dynamic-field');
    phoneFields.forEach(field => {
        const type = field.querySelector('.field-type').value || 'VOICE';
        const value = field.querySelector('.field-input').value;
        if (value.trim()) {
            vcf += `TEL;TYPE=VOICE;X-LABEL=${type}:${value}\n`;
        }
    });
    
    // Handle multiple emails
    const emailFields = document.querySelectorAll('#email-fields .dynamic-field');
    emailFields.forEach(field => {
        const type = field.querySelector('.field-type').value || 'OTHER';
        const value = field.querySelector('.field-input').value;
        if (value.trim()) {
            vcf += `EMAIL;X-LABEL=${type}:${value}\n`;
        }
    });
    
    // Handle multiple websites
    const websiteFields = document.querySelectorAll('#website-fields .dynamic-field');
    websiteFields.forEach(field => {
        const type = field.querySelector('.field-type').value || 'OTHER';
        const value = field.querySelector('.field-input').value;
        if (value.trim()) {
            vcf += `URL;X-LABEL=${type}:${value}\n`;
        }
    });
    
    // Handle custom fields
    const customFields = document.querySelectorAll('#custom-fields .dynamic-field');
    customFields.forEach(field => {
        const type = field.querySelector('.field-type').value || 'OTHER';
        const value = field.querySelector('.field-input').value;
        if (value.trim()) {
            vcf += `X-CUSTOM;X-LABEL=${type}:${value}\n`;
        }
    });
    
    const address = document.getElementById('address').value;
    if (address) {
        const addressParts = address.split(',').map(part => part.trim());
        vcf += `ADR;TYPE=WORK:;;${addressParts.join(';')}\n`;
    }
    
    const notes = document.getElementById('notes').value;
    if (notes) vcf += `NOTE:${notes}\n`;
    
    vcf += 'END:VCARD';
    
    currentVcfData = vcf;
    
    // Create a cleaned version for QR code generation
    const cleanVcfForQR = cleanFrenchChars(vcf);
    
    // Generate QR Code with cleaned data
    generateQRCode(cleanVcfForQR);
    
    // Show VCF preview with original French characters
    document.getElementById('vcf-content').textContent = vcf;
    
    // Show result section
    document.getElementById('result').style.display = 'block';
    document.getElementById('result').scrollIntoView({ behavior: 'smooth' });
    
    // Show QR modal
    showQRModal();
}

function generateQRCode(data) {
    const qr = qrcode(0, 'M');
    // Use the cleaned data directly without special encoding
    qr.addData(data);
    qr.make();
    
    const qrContainer = document.getElementById('qr-code');
    qrContainer.innerHTML = qr.createImgTag(2, 4); // Reduced size from 8,10 to 2,4
    
    // Setup download links
    setupDownloadLinks(qr, data);
}

function showQRModal() {
    const modal = document.getElementById('qr-modal');
    modal.classList.add('show');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

function closeQRModal() {
    const modal = document.getElementById('qr-modal');
    modal.classList.remove('show');
    document.body.style.overflow = ''; // Restore scrolling
}

function setupDownloadLinks(qr, cleanVcfData) {
    // PNG Download - use the cleaned QR code
    const pngBtn = document.getElementById('download-png');
    pngBtn.onclick = function(e) {
        e.preventDefault();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = function() {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            const link = document.createElement('a');
            link.download = 'contact-qr-code.png';
            link.href = canvas.toDataURL();
            link.click();
        };
        
        img.src = qr.createDataURL(8, 10);
    };
    
    // VCF Download - use the original VCF data with French characters
    const vcfBtn = document.getElementById('download-vcf');
    vcfBtn.onclick = function(e) {
        e.preventDefault();
        const blob = new Blob([currentVcfData], { type: 'text/vcard' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = 'contact.vcf';
        link.href = url;
        link.click();
        window.URL.revokeObjectURL(url);
    };
}

function resetForm() {
    // Clear basic information fields
    document.getElementById('firstName').value = '';
    document.getElementById('lastName').value = '';
    document.getElementById('organization').value = '';
    document.getElementById('title').value = '';
    document.getElementById('service').value = '';
    document.getElementById('address').value = '';
    document.getElementById('notes').value = '';
    
    // Reset dynamic fields to one empty field each
    resetDynamicSection('phone');
    resetDynamicSection('email');
    resetDynamicSection('website');
    resetDynamicSection('custom');
    
    // Hide and clear results section
    const resultSection = document.getElementById('result');
    resultSection.style.display = 'none';
    
    // Close QR modal if open
    closeQRModal();
    
    // Clear QR code and VCF content
    document.getElementById('qr-code').innerHTML = '';
    document.getElementById('vcf-content').textContent = '';
    
    // Clear current VCF data
    currentVcfData = '';
    
    // Scroll back to top of form
    document.querySelector('.container').scrollIntoView({ behavior: 'smooth' });
}

function resetDynamicSection(type) {
    const container = document.getElementById(`${type}-fields`);
    
    // Remove all existing fields
    container.innerHTML = '';
    
    // Add one empty field
    let defaultLabel = '';
    let placeholder = '';
    let inputType = 'text';
    
    switch(type) {
        case 'phone':
            defaultLabel = 'Travail';
            placeholder = 'Numéro de téléphone';
            inputType = 'tel';
            break;
        case 'email':
            defaultLabel = 'Travail';
            placeholder = 'Adresse e-mail';
            inputType = 'email';
            break;
        case 'website':
            defaultLabel = 'Travail';
            placeholder = 'https://exemple.com';
            inputType = 'url';
            break;
        case 'custom':
            defaultLabel = 'Personnalisé';
            placeholder = 'Valeur personnalisée';
            inputType = 'text';
            break;
    }
    
    const newField = document.createElement('div');
    newField.className = 'form-group dynamic-field';
    newField.innerHTML = `
        <div class="field-controls">
            <input type="text" class="field-type" placeholder="Étiquette" value="${defaultLabel}">
            <input type="${inputType}" placeholder="${placeholder}" class="field-input">
            <button type="button" class="remove-btn">×</button>
        </div>
    `;
    
    container.appendChild(newField);
    
    // Add event listener to the new remove button
    newField.querySelector('.remove-btn').addEventListener('click', function() {
        removeDynamicField(this);
    });
}

function loadSampleData() {
    // Basic information - simplified defaults
    document.getElementById('firstName').value = 'Charles-Lévi';
    document.getElementById('lastName').value = 'BRI';
    document.getElementById('organization').value = 'Tech Corp';
    document.getElementById('title').value = 'Développeur Logiciel';
    document.getElementById('service').value = 'Informatique';
    document.getElementById('address').value = '123 Rue de la Tech, Silicon Valley, CA, 94000, USA';
    document.getElementById('notes').value = 'Disponible pour du travail de conseil';
    
    // Only one phone number
    const phoneFields = document.querySelectorAll('#phone-fields .dynamic-field');
    if (phoneFields.length > 0) {
        phoneFields[0].querySelector('.field-input').value = '+1-555-123-4567';
        phoneFields[0].querySelector('.field-type').value = 'Travail';
    }
    
    // Only one email address
    const emailFields = document.querySelectorAll('#email-fields .dynamic-field');
    if (emailFields.length > 0) {
        emailFields[0].querySelector('.field-input').value = 'charles-levi.bri@techcorp.com';
        emailFields[0].querySelector('.field-type').value = 'Travail';
    }
    
    // No websites by default - leave empty
    const websiteFields = document.querySelectorAll('#website-fields .dynamic-field');
    if (websiteFields.length > 0) {
        websiteFields[0].querySelector('.field-input').value = '';
        websiteFields[0].querySelector('.field-type').value = 'Travail';
    }
}