console.log("LOAD SCRIPT: player.js")


const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const PLAYER_STATE = {}
const playerStates = ["IDLE", "WALK", "JUMPREADY", "JUMP", "FALL", "FELL"]
playerStates.forEach(state => PLAYER_STATE[state] = state)

class Player {
    constructor(x, y, w, h, imageDir) {
        // physicals
        this.x = x
        this.y = y
        this.w = w
        this.h = h
        this.imageDir = imageDir
        this.image = {}
        this.loadImage()

        this.acc = 15
        this.jumpGauge = 0
        this.jumpGather = 1
        this.jumpSpeedX = null
        this.maxAcc = 30
        this.jumpSpeedXGather = 0.05

        this.sx = 0
        this.sy = 0

        this._shape = new Rectangle(this.x, this.y, this.w, this.h)

        this.controllable = true;

        this.state = PLAYER_STATE.JUMP

        // 마우스 드래그 관련 속성 추가
        this.dragStart = null;
        this.dragEnd = null;
        this.dragging = false;

    }

    get shape() {
        this._shape.x = this.x
        this._shape.y = this.y
        return this._shape
    }
    
    set shape(val) { this._shape = val }

    loadImage = () => {
        this.image['fall'] = new Image()
        this.image['fall'].src = this.imageDir + "/fall.png";
        this.image['fell'] = new Image()
        this.image['fell'].src = this.imageDir + "/fell.png";
    }

    // 마우스 드래그 시작
    startDrag(x, y) {
        this.dragStart = { x, y };
        this.dragging = true;
    }

    // 마우스 드래그 중
    updateDrag(x, y) {
        if (!this.dragging || !this.dragStart) return;
            
        // 위로 드래그했을 때는 점프가 발생하지 않도록 조건 추가
        if (y < this.dragStart.y) {
            return;
        }
    
        // 공중에 있는 동안에는 드래그가 발생하지 않도록 조건 추가
        if (this.y < 0) {
            return;
        }
    
        // 드래그 거리 계산으로 점프 게이지 설정 (예시)
        const dragDistance = Math.sqrt(Math.pow(x - this.dragStart.x, 2) + Math.pow(y - this.dragStart.y, 2));
        this.jumpGauge = Math.min(dragDistance / 4, 60);
    
        // 양쪽 방향의 최대 점프 속도를 동일하게 설정
        const maxJumpSpeedX = 20; // 최대 점프 속도
        this.jumpSpeedX = (this.dragStart.x - x) / 20; // 점프 속도 설정
    
        // 최대 점프 속도 범위 내에서 클램핑
        this.jumpSpeedX = Math.max(Math.min(this.jumpSpeedX, maxJumpSpeedX), -maxJumpSpeedX);
    }

    // 마우스 드래그 종료
    endDrag() {
        this.dragging = false;
    }

    update = (dt) => {
        if (this.controllable){
            if (!this.dragging && this.jumpGauge > 0) {
                // 점프 실행
                this.sy = -this.jumpGauge; // 점프 강도에 따라 Y축 속도 설정
                this.sx = this.jumpSpeedX; // 드래그 방향에 따라 X축 속도 설정
                // 점프 후 초기화
                this.jumpGauge = 0;
                this.jumpSpeedX = 0;
                this.controllable = false; // 점프 동안 추가 조작 방지
            }
        }

        
        // scene move check
        if(this.y < -EPSILON) {
            NOW_WORLD.moveSceneTop()
            this.y = NOW_WORLD.nowScene.height - EPSILON
        }
        if(this.y > NOW_WORLD.nowScene.height + EPSILON) {
            NOW_WORLD.moveSceneBottom()
            this.y = EPSILON
        }
        if(this.x < -EPSILON) {
            NOW_WORLD.moveSceneLeft()
            this.x = NOW_WORLD.nowScene.width - this.w - EPSILON
        }
        if(this.x > NOW_WORLD.nowScene.width - this.w + EPSILON) {
            NOW_WORLD.moveSceneRight()
            this.x = EPSILON
        }
        
        // collision check
        let dp = smultVec([this.sx, this.sy], dt)
        const walls = NOW_WORLD.nowScene.physLayer.objects
        
        // x axis check
        this.x += dp[0]
        let xRectCollide = null
        let xRtriCollide = null

        // check rect collide then resolve
        walls.forEach(wall => {
            const nowShape = this.shape
            const intersections = Shape.polyCollide(nowShape, wall.shape)
            if(intersections.length == 0) return

            if(wall.shape.type == SHAPETYPE.RECT) {
                xRectCollide = true
                this.x = dp[0] > 0 ? wall.shape.x - this.w - EPSILON : wall.shape.x + wall.shape.w + EPSILON
            }
        })

        // check rtri collide then resolve
        walls.forEach(wall => {
            if(xRectCollide) return

            const nowShape = this.shape
            const intersections = Shape.polyCollide(nowShape, wall.shape)
            if(intersections.length == 0) return

            if(wall.shape.type == SHAPETYPE.RTRI) {
                if(wall.shape.rap == RAP.LT) {
                    if(dp[0] < 0 && (wall.shape.pointInside([nowShape.x, nowShape.y]) || nowShape.pointInside([wall.shape.x, wall.shape.y+wall.shape.h]))) {
                        xRtriCollide = RAP.LT
                        this.x = Math.max(intersections[0][0], intersections[1][0]) + EPSILON
                    }
                    else {
                        xRectCollide = true
                        this.x = dp[0] > 0 ? wall.x - this.w - EPSILON : wall.x + wall.w + EPSILON
                    }
                }
                else if(wall.shape.rap == RAP.RT) {
                    if(dp[0] > 0 && (wall.shape.pointInside([nowShape.x+nowShape.w, nowShape.y]) || nowShape.pointInside([wall.shape.x+wall.shape.w, wall.shape.y+wall.shape.h]))) {
                        xRtriCollide = RAP.RT
                        this.x = Math.min(intersections[0][0], intersections[1][0]) - this.w - EPSILON
                    }
                    else {
                        xRectCollide = true
                        this.x = dp[0] > 0 ? wall.x - this.w - EPSILON : wall.x + wall.w + EPSILON
                    }
                }
                else if(wall.shape.rap == RAP.RB) {
                    if(dp[0] > 0 && (wall.shape.pointInside([nowShape.x+nowShape.w, nowShape.y+nowShape.h]) || nowShape.pointInside([wall.shape.x+wall.shape.w, wall.shape.y]))) {
                        xRtriCollide = RAP.RB
                        this.x = Math.min(intersections[0][0], intersections[1][0]) - this.w - EPSILON
                        // console.log(Math.min(intersections[0][0], intersections[1][0]) - this.w - EPSILON, this.y)
                    }
                    else {
                        xRectCollide = true
                        this.x = dp[0] > 0 ? wall.x - this.w - EPSILON : wall.x + wall.w + EPSILON
                    }
                }
                else if(wall.shape.rap == RAP.LB) {
                    if(dp[0] < 0 && (wall.shape.pointInside([nowShape.x, nowShape.y+nowShape.w]) || nowShape.pointInside([wall.shape.x, wall.shape.y]))) {
                        xRtriCollide = RAP.LB
                        this.x = Math.max(intersections[0][0], intersections[1][0]) + EPSILON
                    }
                    else {
                        xRectCollide = true
                        this.x = dp[0] > 0 ? wall.x - this.w - EPSILON : wall.x + wall.w + EPSILON
                    }
                }
            }
        })


        // y axis check
        this.y += dp[1]
        let yRectCollide = null
        let yRtriCollide = null

        // check rect collide
        walls.forEach(wall => {
            const nowShape = this.shape
            const intersections = Shape.polyCollide(nowShape, wall.shape)
            if(intersections.length == 0) return

            if(wall.shape.type == SHAPETYPE.RECT) {
                yRectCollide = true
                this.y = dp[1] > 0 ? wall.shape.y - this.h - EPSILON : wall.shape.y + wall.shape.h + EPSILON
            }
        })

        // check rtri collide
        walls.forEach(wall => {
            if(yRectCollide) return
            
            const nowShape = this.shape
            const intersections = Shape.polyCollide(nowShape, wall.shape)
            if(intersections.length == 0) return

            if(wall.shape.type == SHAPETYPE.RTRI) {
                if(wall.shape.rap == RAP.LT) {
                    if(dp[1] < 0 && (wall.shape.pointInside([nowShape.x, nowShape.y]) || nowShape.pointInside([wall.shape.x+wall.shape.w, wall.shape.y]))) {
                        yRtriCollide = RAP.LT
                        this.y = Math.max(intersections[0][1], intersections[1][1]) + EPSILON
                    }
                    else {
                        yRectCollide = true
                        this.y = dp[1] > 0 ? wall.y - this.h - EPSILON : wall.y + wall.h + EPSILON
                    }
                }
                else if(wall.shape.rap == RAP.RT) {
                    if(dp[1] < 0 && (wall.shape.pointInside([nowShape.x+nowShape.w, nowShape.y] || nowShape.pointInside([wall.shape.x, wall.shape.y])))) {
                        yRtriCollide = RAP.RT
                        this.y = Math.max(intersections[0][1], intersections[1][1]) + EPSILON
                    }
                    else {
                        yRectCollide = true
                        this.y = dp[1] > 0 ? wall.y - this.h - EPSILON : wall.y + wall.h + EPSILON
                    }
                }
                else if(wall.shape.rap == RAP.RB) {
                    if(dp[1] > 0 && (wall.shape.pointInside([nowShape.x+nowShape.w, nowShape.y+nowShape.h]) || nowShape.pointInside([wall.shape.x, wall.shape.y+wall.shape.h]))) {
                        yRtriCollide = RAP.RB
                        this.y = Math.min(intersections[0][1], intersections[1][1]) - this.h - EPSILON
                    }
                    else {
                        yRectCollide = true
                        this.y = dp[1] > 0 ? wall.y - this.h - EPSILON : wall.y + wall.h + EPSILON
                    }
                }
                else if(wall.shape.rap == RAP.LB) {
                    if(dp[1] > 0 && (wall.shape.pointInside([nowShape.x, nowShape.y+nowShape.w]) || nowShape.pointInside([wall.shape.x+wall.shape.w, wall.shape.y+wall.shape.h]))) {
                        yRtriCollide = RAP.LB
                        this.y = Math.min(intersections[0][1], intersections[1][1]) - this.h - EPSILON
                    }
                    else {
                        yRectCollide = true
                        this.y = dp[1] > 0 ? wall.y - this.h - EPSILON : wall.y + wall.h + EPSILON
                    }
                }
            }
        })

        // speed resolve
        if(xRectCollide) {
            this.state = PLAYER_STATE.FALL
            this.sx = -this.sx
        }
        if(yRectCollide && dp[1] < 0) this.sy = -this.sy
        if(yRectCollide && dp[1] >= 0) {
            if(this.state == PLAYER_STATE.FALL) this.state = PLAYER_STATE.FELL
            else if(this.state != PLAYER_STATE.FELL && this.jumpSpeedX === null) this.state = PLAYER_STATE.IDLE
            this.sy = 0
            this.sx = 0
            this.controllable = true
        }
        else {
            this.controllable = false
        }
        if(!xRectCollide && !yRectCollide && xRtriCollide !== null) {
            this.state = PLAYER_STATE.FALL
            this.sy += 1
            if(xRtriCollide == RAP.LT) {
                const newSpeed = projectVec([1, -1], [this.sx, this.sy])
                this.sx = newSpeed[0]
                this.sy = newSpeed[1]
            }
            if(xRtriCollide == RAP.RT) {
                const newSpeed = projectVec([-1, -1], [this.sx, this.sy])
                this.sx = newSpeed[0]
                this.sy = newSpeed[1]
            }
            if(xRtriCollide == RAP.RB) {
                const newSpeed = projectVec([1, -1], [this.sx, this.sy])
                this.sx = newSpeed[0]
                this.sy = newSpeed[1]
            }
            if(xRtriCollide == RAP.LB) {
                const newSpeed = projectVec([-1, -1], [this.sx, this.sy])
                this.sx = newSpeed[0]
                this.sy = newSpeed[1]
            }
        }
        if(!xRectCollide && !yRectCollide && xRtriCollide === null && yRtriCollide !== null) {
            this.state = PLAYER_STATE.FALL
            this.sy += 1
            if(yRtriCollide == RAP.LT) {
                const newSpeed = projectVec([1, -1], [this.sx, this.sy])
                this.sx = newSpeed[0]
                this.sy = newSpeed[1]
            }
            if(yRtriCollide == RAP.RT) {
                const newSpeed = projectVec([-1, -1], [this.sx, this.sy])
                this.sx = newSpeed[0]
                this.sy = newSpeed[1]
            }
            if(yRtriCollide == RAP.RB) {
                const newSpeed = projectVec([1, -1], [this.sx, this.sy])
                this.sx = newSpeed[0]
                this.sy = newSpeed[1]
            }
            if(yRtriCollide == RAP.LB) {
                const newSpeed = projectVec([-1, -1], [this.sx, this.sy])
                this.sx = newSpeed[0]
                this.sy = newSpeed[1]
            }
        }

        // gravity
        const afterGravity = addVec([this.sx, this.sy], NOW_WORLD.nowScene.gravity)
        this.sx = afterGravity[0]
        this.sy = afterGravity[1]
        
        // speed limit
        if(Math.abs(this.sx) > this.maxSpeed) {
            [this.sx, this.sy] = smultVec([this.sx, this.sy], this.maxSpeed / normVec([this.sx, this.sy]))
        }
        
    }
    
    render = (cam) => {
        const [tx, ty] = roundVec(cam([this.x, this.y]))
        const [tw, th] = subVec(roundVec(cam([this.w, this.h])), cam([0, 0]))


        if(this.state == PLAYER_STATE.FALL) CTX.drawImage(this.image.fall, tx, ty, tw, th)
        if(this.state == PLAYER_STATE.FELL) CTX.drawImage(this.image.fell, tx, ty, tw, th)

        if (this.dragging) {
            // 점프 방향과 강도에 따른 화살표 그리기
            const jumpPowerScale = 2; // 점프 파워 스케일링 계수
            const jumpGauge = this.jumpGauge * jumpPowerScale; // 화살표 길이에 점프 게이지를 사용
            const jumpSpeedX = this.jumpSpeedX;
        
            // 화살표의 실제 길이를 계산할 때 X축과 Y축 변화량을 모두 고려합니다.
            // 여기서는 Y 축 변화량을 점프 게이지의 3분의 1로 고정합니다.
            const arrowLength = Math.sqrt(Math.pow(jumpGauge / 3, 2) + Math.pow(jumpSpeedX, 2));
        
            // 각도 계산
            let angle = Math.atan2(jumpGauge / 3, jumpSpeedX);
        
            // 화살표 끝점 계산
            const arrowEndX = tx + tw/2+ Math.cos(angle) * arrowLength;
            const arrowEndY = ty - Math.sin(angle) * arrowLength;
        
            // 화살표 그리기
            CTX.beginPath();
            CTX.moveTo(tx + tw/2, ty);
            CTX.lineTo(arrowEndX, arrowEndY);
            CTX.strokeStyle = 'red';
            CTX.stroke();
        }
    }
}

// sequential importer
loadScriptFile(scriptsToLoad[++loadIndex])

