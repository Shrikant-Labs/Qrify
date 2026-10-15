
const qrForm = document.getElementById("qrForm");
const urlInput = document.getElementById("urlInput");
const qrPreview = document.getElementById("qrPreview");
const downloadBtn = document.getElementById("downloadBtn");
const fileName = document.getElementById("fileName");
const message = document.getElementById("message");
const generateBtn = document.getElementById("generateBtn");

let qrImageURL = null;

qrForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const url = urlInput.value.trim();

    // Basic frontend validation
    let parsedURL;

    try {
        parsedURL = new URL(url);
    } catch {
        message.textContent = "Please enter a valid website URL.";
        return;
    }

    if (!["http:", "https:"].includes(parsedURL.protocol)) {
        message.textContent = "Please enter an HTTP or HTTPS URL.";
        return;
    }

    message.textContent = "";
    generateBtn.disabled = true;
    generateBtn.textContent = "Generating...";
    downloadBtn.disabled = true;

    try {
        // Send the URL to the Python Flask backend
        const response = await fetch("/api/qr", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ url: url })
        });

        // Handle backend errors
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "QR generation failed.");
        }

        // Receive the PNG image from Python
        const imageBlob = await response.blob();

        // Release the previous preview URL
        if (qrImageURL) {
            URL.revokeObjectURL(qrImageURL);
        }

        qrImageURL = URL.createObjectURL(imageBlob);

        // Display the generated QR code
        qrPreview.innerHTML = "";

        const qrImage = document.createElement("img");
        qrImage.src = qrImageURL;
        qrImage.alt = "Generated QR code";

        qrPreview.appendChild(qrImage);

        fileName.textContent = "qrify-code.png";
        downloadBtn.disabled = false;

    } catch (error) {
        message.textContent = error.message ||
            "Something went wrong. Please try again.";
    } finally {
        generateBtn.disabled = false;
        generateBtn.textContent = "Generate QR Code →";
    }
});

// Download the PNG returned by Python
downloadBtn.addEventListener("click", function () {
    if (!qrImageURL) return;

    const link = document.createElement("a");
    link.href = qrImageURL;
    link.download = "qrify-code.png";

    document.body.appendChild(link);
    link.click();
    link.remove();
});
