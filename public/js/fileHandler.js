document.addEventListener("DOMContentLoaded", () => {
    const fileInput = document.getElementById("fileInput");
    const uploadBtn = document.getElementById("uploadBtn");
    const generateButton = document.getElementById("generateButton");
    const extractedText = document.getElementById("extractedText");

    uploadBtn.disabled = true;

    // Track generation count for this session
    let generationCount = 0;

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

            generateButton.disabled = false;
            generationCount = 0; // Reset counter when new file is uploaded

        } catch (error) {
            console.error("❌ Error:", error);
            extractedText.textContent = "❌ Error processing file. Please try again.";
        }
    });

    document.getElementById('generateButton').addEventListener('click', async () => {
        const extractedText = document.getElementById('extractedText').textContent;
        const selectedPrompts = Array.from(document.querySelectorAll('input[name="promptType"]:checked'))
          .map(checkbox => checkbox.value);
      
        if (selectedPrompts.length === 0) {
          alert('Please select at least one prompt type.');
          return;
        }
      
        const aiOutput = document.getElementById('aiOutput');
        
        // Update button text and show loading message
        generationCount++;
        if (generationCount === 1) {
            aiOutput.innerHTML = 'Generating...';
            generateButton.textContent = 'Generating...';
        } else {
            aiOutput.innerHTML = `🔄 Generating new questions (Set #${generationCount})...`;
            generateButton.textContent = 'Generating New Questions...';
        }
      
        try {
          // Always use the same endpoint, but pass generation count
          const response = await fetch('/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                text: extractedText, 
                types: selectedPrompts,
                generationCount: generationCount // Tell backend this is a regeneration
            }),
          });
      
          if (!response.ok) {
            throw new Error('Server error');
          }
      
          const data = await response.json();
          console.log('API Response:', data);
      
          aiOutput.innerHTML = ''; 
      
          data.forEach((item) => {
            const promptType = item.type; 
            const resultDiv = document.createElement('div');

            // Show generation number for QCM
            if (promptType === 'qcm' && generationCount > 1) {
                resultDiv.innerHTML = `<strong>🔄 ${promptType.toUpperCase()} (Set #${generationCount}):</strong><br>`;
            } else {
                resultDiv.innerHTML = `<strong>${promptType.toUpperCase()}:</strong><br>`;
            }

            resultDiv.innerHTML += item.content + '<br><br>';
            aiOutput.appendChild(resultDiv);
          });

          // Reset button text after generation
          if (generationCount === 1) {
              generateButton.textContent = '🔄 Generate New Questions';
          } else {
              generateButton.textContent = '🔄 Generate Another Set';
          }
      
        } catch (error) {
          console.error('❌ Error:', error);
          aiOutput.innerHTML = `Error: ${error.message}`;
          generateButton.textContent = 'Try Again';
        }
      });
});