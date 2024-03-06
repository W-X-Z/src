// Import JS files in need

const loadScriptFile = (filename, callback) => {
    if(!filename) return;
    
    const bodyElement = document.getElementsByTagName("body")[0];
    const scriptElement = document.createElement("script");
    scriptElement.setAttribute("type", "text/javascript");
    scriptElement.setAttribute("src", filename);
    scriptElement.onload = callback; // 스크립트 로드 완료 후 콜백 함수 호출
    bodyElement.appendChild(scriptElement);
};

const scriptsToLoad = [
    "jumpman/scripts/init.js",
    "jumpman/scripts/setting.js",
    "jumpman/scripts/physics.js",
    "jumpman/scripts/world.js",
    "jumpman/scripts/player.js",
    "jumpman/scripts/maps.js",
    "jumpman/scripts/loader.js",
];

let loadIndex = 0;

// 모든 스크립트가 로드된 후 실행될 함수
const allScriptsLoaded = () => {
    console.log("All scripts loaded.");
    initJumpChart(); // 차트 초기화
};

function initJumpChart() {
    const ctx = document.getElementById('jumpChart').getContext('2d');
    window.jumpChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: '자산',
                data: [],
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.5,
                pointRadius:0
            }]
        },
        options: {
            scales: {
                x: {
                    display: false // X축 레이블 숨김
                },
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// 차트 데이터 업데이트 함수
function updateJumpData(jumpCount, jumpHeight) {
    if (window.jumpChart) {
        // 데이터 추가
        window.jumpChart.data.labels.push('');
        window.jumpChart.data.datasets.forEach((dataset) => {
            dataset.data.push(jumpHeight);
        });
        
        // 최대 데이터 개수를 30개로 제한
        const maxDataPoints = 30;
        if (window.jumpChart.data.labels.length > maxDataPoints) {
            window.jumpChart.data.labels.shift();
            window.jumpChart.data.datasets.forEach((dataset) => {
                dataset.data.shift();
            });
        }
        // 차트 업데이트
        window.jumpChart.update();
    }
}



// 스크립트 로드를 순차적으로 진행하는 함수
const loadNextScript = () => {
    if (loadIndex < scriptsToLoad.length) {
        loadScriptFile(scriptsToLoad[loadIndex], () => {
            loadIndex++;
            loadNextScript(); // 다음 스크립트 로드
        });
    } else {
        allScriptsLoaded(); // 모든 스크립트 로드 완료
    }
};

loadNextScript(); // 첫 번째 스크립트 로드를 시작함으로써, 스크립트 로드 프로세스 시작
