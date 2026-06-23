/**
 * @class VoxGestoEngine
 * @description Mecanismo matemático de processamento de interface humano-computador por vetor e áudio.
 */
class VoxGestoEngine {
    constructor() {
        this.video = document.getElementById('video-source');
        this.canvas = document.getElementById('tracking-canvas');
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
        this.overlay = document.getElementById('status-overlay');
        
        // Elementos UI de Dados
        this.fpsMetric = document.getElementById('fps-metric');
        this.msMetric = document.getElementById('ms-metric');
        this.speechOutput = document.getElementById('speech-output');
        this.logStream = document.getElementById('log-stream');
        
        // Parâmetros de Áudio
        this.pitchController = document.getElementById('voice-pitch');
        this.rateController = document.getElementById('voice-rate');
        this.testAudioBtn = document.getElementById('test-audio-btn');

        // Estado do Core Interno
        this.lastFrameTime = performance.now();
        this.frameCount = 0;
        this.isCooldown = false;
        this.lastUtterance = "";

        this.initSpeechSynthesis();
        this.initListeners();
    }

    /**
     * Valida suporte nativo à síntese de voz no ecossistema do cliente
     */
    initSpeechSynthesis() {
        if ('speechSynthesis' in window) {
            this.synth = window.speechSynthesis;
            this.writeLog("Módulo de voz carregado com sucesso.", "system");
        } else {
            this.writeLog("Erro Crítico: API de voz não suportada neste browser.", "error");
        }
    }

    initListeners() {
        this.testAudioBtn.addEventListener('click', () => this.speak("Sistema VoxGesto operacional."));
    }

    writeLog(text, type = "normal") {
        const p = document.createElement('p');
        p.textContent = `[${new Date().toLocaleTimeString()}] ${text}`;
        if (type === "system") p.className = "system-log";
        this.logStream.appendChild(p);
        this.logStream.scrollTop = this.logStream.scrollHeight;
    }

    /**
     * Inicializa stream de captura óptica
     */
    async startCapture() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 360, frameRate: { ideal: 60 } },
                audio: false
            });
            this.video.srcObject = stream;
            this.video.addEventListener('loadedmetadata', () => {
                this.canvas.width = this.video.videoWidth;
                this.canvas.height = this.video.videoHeight;
                this.overlay.style.display = 'none';
                this.writeLog("Varredura óptica de vídeo iniciada.", "system");
                requestAnimationFrame(() => this.renderLoop());
            });
        } catch (err) {
            this.overlay.textContent = "Hardware de vídeo inacessível.";
            this.overlay.style.color = "#ef4444";
            this.writeLog("Falha ao invocar câmera do dispositivo.", "error");
        }
    }

    /**
     * Dispara a engine de voz com os parâmetros de pitch/rate controlados via DOM
     */
    speak(phrase) {
        if (!this.synth || this.isCooldown || this.lastUtterance === phrase) return;

        this.isCooldown = true;
        this.lastUtterance = phrase;
        this.speechOutput.textContent = phrase;
        this.writeLog(`Tradução fonética: "${phrase}"`);

        const utterance = new SpeechSynthesisUtterance(phrase);
        utterance.lang = 'pt-BR';
        utterance.pitch = parseFloat(this.pitchController.value);
        utterance.rate = parseFloat(this.rateController.value);

        // Remove cooldown assim que a fala termina para não sobrecarregar
        utterance.onend = () => {
            this.isCooldown = false;
        };

        this.synth.speak(utterance);

        // Reseta cache do último gesto após 3 segundos sem gestos
        setTimeout(() => { this.lastUtterance = ""; }, 3000);
    }

    /**
     * Ciclo Analítico Principal de Visão Computacional (DSP Vetorial)
     */
    renderLoop() {
        if (this.video.paused || this.video.ended) {
            requestAnimationFrame(() => this.renderLoop());
            return;
        }

        const t0 = performance.now();

        // Renderiza espelhado (Efeito Espelho - Melhor UX para feiras de tecnologia)
        this.ctx.save();
        this.ctx.translate(this.canvas.width, 0);
        this.ctx.scale(-1, 1);
        this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();

        // Algoritmo de Extração de Centróide por Luminosidade (Simula detecção de corpo/mão)
        const imgData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const pixels = imgData.data;
        
        let sumX = 0, sumY = 0, activePixels = 0;

        // Varredura de matriz com amostragem em blocos (Otimização de performance)
        for (let y = 0; y < this.canvas.height; y += 4) {
            for (let x = 0; x < this.canvas.width; x += 4) {
                const idx = (y * this.canvas.width + x) * 4;
                const r = pixels[idx];
                const g = pixels[idx+1];
                const b = pixels[idx+2];

                // Detecta áreas de alto contraste ou mudança brusca (Branco/Pele clara sob fundo escuro)
                const brightness = 0.2126 * r + 0.7152 * g + 0.0722 * b;
                if (brightness > 160) {
                    sumX += x;
                    sumY += y;
                    activePixels++;
                }
            }
        }

        // Se houver uma massa de controle detectada, calcula centro geométrico e renderiza HUD
        if (activePixels > 200) {
            const centerX = sumX / activePixels;
            const centerY = sumY / activePixels;

            // Renderiza indicador visual do ponto de rastreio (Target HUD)
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, 15, 0, 2 * Math.PI);
            this.ctx.strokeStyle = '#06b6d4';
            this.ctx.lineWidth = 3;
            this.ctx.stroke();

            this.ctx.fillStyle = '#10b981';
            this.ctx.fillRect(centerX - 4, centerY - 4, 8, 8);

            // Máquina de Estados Finita (FSM) para classificação do padrão espacial do gesto
            const boundsQuadrant = this.canvas.width / 3;

            if (centerX < boundsQuadrant && centerY < this.canvas.height / 2) {
                this.speak("Olá, preciso de auxílio.");
            } else if (centerX > boundsQuadrant * 2 && centerY < this.canvas.height / 2) {
                this.speak("Obrigado.");
            } else if (centerY > this.canvas.height * 0.7) {
                this.speak("Por favor, água.");
            }
        }

        const t1 = performance.now();
        this.msMetric.innerHTML = `${(t1 - t0).toFixed(1)} <span class="unit">ms</span>`;

        // Medidor de Ciclos Hz
        this.frameCount++;
        if (t1 > this.lastFrameTime + 1000) {
            this.fpsMetric.innerHTML = `${Math.round((this.frameCount * 1000) / (t1 - this.lastFrameTime))} <span class="unit">Hz</span>`;
            this.frameCount = 0;
            this.lastFrameTime = t1;
        }

        requestAnimationFrame(() => this.renderLoop());
    }
}

// Inicialização segura
document.addEventListener('DOMContentLoaded', () => {
    const engine = new VoxGestoEngine();
    engine.startCapture();
});
