document.addEventListener("DOMContentLoaded", function() {
    const progressBar = document.getElementById("progressBar");

    // Assuming the file URL is /file-to-download (change to your actual file URL)
    const fileURL = "/my-download-file.pdf";
    const chunks = [];
    
    fetch(fileURL).then(response => {
        const reader = response.body.getReader();
        const contentLength = +response.headers.get("Content-Length");
        let receivedLength = 0;

        function processChunk({ done, value }) {
            if (done) {
                // All chunks received, create a Blob and save it
                const blob = new Blob(chunks);
                const downloadLink = document.createElement('a');
                downloadLink.href = URL.createObjectURL(blob);

                // Set a filename for the download
                downloadLink.download = 'download.pdf'; // Replace 'filename.ext' with the desired filename and extension

                // Trigger the download by simulating a click on the link
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
		document.getElementById("downloadStatus").textContent = "Download complete";
                console.log("Download finished!");
                return;
            }

            chunks.push(value);
            receivedLength += value.length;
            const percentComplete = (receivedLength / contentLength) * 100;
            progressBar.value = percentComplete;
	    document.getElementById("progressText").textContent = `${Math.round(percentComplete)}%`;	

            console.log(`Received ${receivedLength} of ${contentLength}`);

            // Read the next chunk
            return reader.read().then(processChunk);
        }

        return reader.read().then(processChunk);

    }).catch(error => {
        console.error("Error downloading the file:", error);
    });
});
