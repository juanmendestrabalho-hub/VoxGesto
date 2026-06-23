#  VoxGesto Pro - Sistema de Telemetria Óptica de Sinais

O **VoxGesto Pro** é um protótipo focado na área de Engenharia de Computação e Interação Humano-Computador (IHC). O software implementa um ecossistema nativo no cliente para identificação cinemática de padrões geométricos de massa por meio de streams ópticos, convertendo vetores dinâmicos em strings fonéticas usando síntese de voz artificial (*Web Speech API*).

##  Engenharia Aplicada e Algoritmos

### 1. Cálculo de Centróide de Luminância ($I(x,y)$)
Para capturar a movimentação do usuário sem bibliotecas externas pesadas, o motor faz a leitura dos componentes de brilho do canal YUV através da equação de luminância da ITU-R:

$$Y = 0.2126R + 0.7152G + 0.0722B$$

Os pixels que ultrapassam o limite crítico estabelecido alimentam o somatório de massa para determinar as coordenadas centrais $(\bar{x}, \bar{y})$ do objeto em movimento:

$$\bar{x} = \frac{\sum x_i}{N}, \quad \bar{y} = \frac{\sum y_i}{N}$$

### 2. Síntese Fonética Assíncrona
A aplicação gerencia concorrência e evita o enfileiramento de requisições de áudio através de uma flag de controle de estado de *cooldown*. Isso previne estouros de pilha de áudio no navegador (*audio buffer overflow*).

## 📊 Vantagens em Relação ao Projeto Anterior
- **Apelo Social Direto:** Foco em tecnologias assistivas e inclusão de pessoas não-verbais ou com limitações motoras.
- **Multimodalidade:** Trabalha com entrada de vídeo, análise matemática discreta, saída de áudio sintetizada e exibição em tempo real de métricas no dashboard.
