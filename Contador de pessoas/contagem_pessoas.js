document.getElementById('inputFile').addEventListener('change', handleFile);

let video; // Adicionamos uma variável para armazenar a referência ao vídeo

async function handleFile(event) {
    const file = event.target.files[0];

    if (file.type.startsWith('image')) {
        handleImage(file);
    } else if (file.type.startsWith('video')) {
        handleVideo(file);
    }
}

async function handleImage(imageFile) {
    const image = new Image();
    image.onload = () => {
        countPeople(image);
    };
    image.src = URL.createObjectURL(imageFile);
}

async function handleVideo(videoFile) {
    if (video) {
        // Se houver um vídeo anterior, removemos o evento de 'ended'
        video.removeEventListener('ended', handleVideoEnded);
    }

    video = document.getElementById('inputVideo');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    video.style.display = 'block';
    video.src = URL.createObjectURL(videoFile);

    video.addEventListener('loadedmetadata', async () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const model = await cocoSsd.load();

        video.play();

        // Adicionamos o canvas à página
        video.parentElement.appendChild(canvas);

        // Adicionamos um evento para detectar quando o vídeo termina
        video.addEventListener('ended', handleVideoEnded);

        // Processamos cada quadro do vídeo
        const processFrames = async () => {
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const tensor = tf.browser.fromPixels(imageData);

            const predictions = await model.detect(tensor);
            const peoplePredictions = predictions.filter(prediction => prediction.class === 'person');

            // Desenhamos retângulos diretamente no vídeo
            peoplePredictions.forEach(person => {
                context.beginPath();
                context.rect(person.bbox[0], person.bbox[1], person.bbox[2], person.bbox[3]);
                context.lineWidth = 2;
                context.strokeStyle = 'red';
                context.fillStyle = 'red';
                context.stroke();
            });

            const peopleCount = peoplePredictions.length;
            document.getElementById('peopleCount').innerText = `Número de Pessoas: ${peopleCount}`;

            requestAnimationFrame(processFrames);
        };

        processFrames();
    });
}

function handleVideoEnded() {
    // Quando o vídeo termina, podemos reiniciar a reprodução ou executar outras ações desejadas
    video.currentTime = 0; // Reinicia o vídeo para o início
    video.play();
}
