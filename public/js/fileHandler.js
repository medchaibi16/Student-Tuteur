document.addEventListener("DOMContentLoaded", () => {
    const fileInput = document.getElementById("fileInput");
    const uploadBtn = document.getElementById("uploadBtn");
    const generateButton = document.getElementById("generateButton");
    const extractedText = document.getElementById("extractedText");
    const aiOutput = document.getElementById("aiOutput");

    uploadBtn.disabled = true;

    fileInput.addEventListener("change", () => {
        uploadBtn.disabled = !fileInput.files.length;
    });

    uploadBtn.addEventListener("click", async () => {
        if (!fileInput.files.length) {
            console.error("No file selected");
            return;
        }

        const file = fileInput.files[0];
        const formData = new FormData();
        formData.append("file", file);
        extractedText.innerHTML = 'loading...'; 
        try {
            const response = await fetch("/upload", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            extractedText.textContent = data.text || "No text extracted";

            // Enable the Generate button after successful upload
            generateButton.disabled = false;

        } catch (error) {
            console.error("❌ Error:", error);
            extractedText.textContent = "❌ Error processing file. Please try again.";
        }
    });

    // Generate AI response when button is clicked
    document.getElementById('generateButton').addEventListener('click', async () => {
        const extractedText = document.getElementById('extractedText').textContent;
        const selectedPrompts = Array.from(document.querySelectorAll('input[name="promptType"]:checked'))
          .map(checkbox => checkbox.value);
      
        if (selectedPrompts.length === 0) {
          alert('Please select at least one prompt type.');
          return;
        }
      
        const aiOutput = document.getElementById('aiOutput');
        aiOutput.innerHTML = 'Generating...'; 
      
        try {
          const response = await fetch('/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: extractedText, types: selectedPrompts }),
          });
      
          if (!response.ok) {
            throw new Error('Server error');
          }
      
          const data = await response.json();
          console.log('API Response:', data); // Log the response
      
          aiOutput.innerHTML = ''; 
      
          // Display the results
          data.forEach((item) => {
            const promptType = item.type; 
            const resultDiv = document.createElement('div');

            // Display the type as a heading
            resultDiv.innerHTML = `<strong>${promptType.toUpperCase()}:</strong><br>`;

            resultDiv.innerHTML += item.content + '<br><br>';

            aiOutput.appendChild(resultDiv);
          });

      
        } catch (error) {
          console.error('❌ Error:', error);
          aiOutput.innerHTML = `Error: ${error.message}`;
        }
      });
});
