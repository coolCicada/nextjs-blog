const canvas = document.querySelector('canvas')

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const ctx = canvas.getContext('2d');
/* 
ctx.fillStyle = 'red'
ctx.fillRect(100, 100, 50, 50)


ctx.strokeStyle = 'pink'
ctx.lineWidth = 20
ctx.strokeRect(
    100, 100,
    100, 100
)

ctx.clearRect(
    120, 120,
    50, 50
)

ctx.fillStyle='blue'


ctx.beginPath()
ctx.moveTo(250, 250)
ctx.lineTo(400, 500)
ctx.lineTo(400, 300)
ctx.closePath();
ctx.fill()
ctx.stroke();


ctx.beginPath()
// ctx.moveTo(200, 300)
ctx.arc(
    300, 400,
    200,
    0, Math.PI * 3 / 2
)
ctx.stroke();
ctx.beginPath()
ctx.arc(
    250, 150,
    200,
    0, Math.PI * 3 / 2
)
ctx.stroke(); */

/* // 二次贝塞尔曲线
ctx.beginPath()
ctx.moveTo(50, 50)
ctx.lineTo(400, 50)
ctx.lineTo(400, 300)
ctx.lineTo(700, 300)
ctx.stroke();

ctx.beginPath()
ctx.moveTo(50, 50)
ctx.quadraticCurveTo(
    400, 50,
    400, 300
)
ctx.stroke();
// 三次贝塞尔曲线
ctx.beginPath()
ctx.moveTo(50, 50)
ctx.bezierCurveTo(
    400, 50,
    400, 300,
    700, 300
)
ctx.stroke(); */


