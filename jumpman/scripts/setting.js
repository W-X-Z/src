console.log("LOAD SCRIPT: setting.js")

/*
// 디바이스가 모바일인지 확인하는 함수
const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}
*/

// 게임 설정 객체
const SETTING = {
    //fps: isMobileDevice() ? 30 : 60,  // 모바일 디바이스일 경우 fps를 30으로, 그렇지 않을 경우 60으로 설정
    fps: 30,
    letterbox: "#000000",
    debugging: true,
    grid: 5
}

let GRID = SETTING.grid

// sequential importer
loadScriptFile(scriptsToLoad[++loadIndex])
