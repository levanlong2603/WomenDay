// SVG Path Animation
let rid = null; // request animation id
const SVG_NS = "http://www.w3.org/2000/svg";
const pathlength = shape.getTotalLength();

let t = 0; // at the beginning of the path
let lengthAtT = pathlength * t;

let d = shape.getAttribute("d");

// 1. build the d array
let n = d.match(/C/gi).length; // how many times

let pos = 0; // the position, used to find the indexOf the nth C

class subPath {
    constructor(d) {
        this.d = d;
        this.get_PointsRy();
        this.previous = subpaths.length > 0 ? subpaths[subpaths.length - 1] : null;
        this.measurePath();
        this.get_M_Point(); //lastPoint
        this.lastCubicBezier;
        this.get_lastCubicBezier();
    }

    get_PointsRy() {
        this.pointsRy = [];
        let temp = this.d.split(/[A-Z,a-z\s,]/).filter(v => v); // remove empty elements
        temp.map(item => {
            this.pointsRy.push(parseFloat(item));
        }); //this.pointsRy numbers not strings
    }

    measurePath() {
        let path = document.createElementNS(SVG_NS, "path");
        path.setAttributeNS(null, "d", this.d);
        // no need to append it to the SVG
        // the lengths of every path in dry
        this.pathLength = path.getTotalLength();
    }

    get_M_Point() {
        if (this.previous) {
            let p = this.previous.pointsRy;
            let l = p.length;
            this.M_point = [p[l - 2], p[l - 1]];
        } else {
            let p = this.pointsRy;
            this.M_point = [p[0], p[1]];
        }
    }

    get_lastCubicBezier() {
        let lastIndexOfC = this.d.lastIndexOf("C");
        let temp = this.d
            .substring(lastIndexOfC + 1)
            .split(/[\s,]/)
            .filter(v => v);
        let _temp = [];
        temp.map(item => {
            _temp.push(parseFloat(item));
        });
        this.lastCubicBezier = [this.M_point];
        for (let i = 0; i < _temp.length; i += 2) {
            this.lastCubicBezier.push(_temp.slice(i, i + 2));
        }
    }
}

let subpaths = [];

// create new subPaths
for (let i = 0; i < n; i++) {
    // finds the of nth C in d
    let newpos = d.indexOf("C", pos + 1);
    if (i > 0) {
        // if it's not the first C
        let sPath = new subPath(d.substring(0, newpos));
        subpaths.push(sPath);
    }
    //change the value of the position pos
    pos = newpos;
}
// at the end add d to the subpaths array
subpaths.push(new subPath(d));

// 2. get the index of the bezierLengths where the point at t is
let index;
for (index = 0; index < subpaths.length; index++) {
    if (subpaths[index].pathLength >= lengthAtT) {
        break;
    }
}

function get_T(t, index) {
    let T;
    lengthAtT = pathlength * t;
    if (index > 0) {
        T =
            (lengthAtT - subpaths[index].previous.pathLength) /
            (subpaths[index].pathLength - subpaths[index].previous.pathLength);
    } else {
        T = lengthAtT / subpaths[index].pathLength;
    }
    return T;
}

let T = get_T(t, index);

let newPoints = getBezierPoints(T, subpaths[index].lastCubicBezier);

drawCBezier(newPoints, partialPath, index);

function getBezierPoints(t, points) {
    let helperPoints = [];

    // helper points 0,1,2
    for (let i = 1; i < 4; i++) {
        //points.length must be 4 !!!
        let p = lerp(points[i - 1], points[i], t);
        helperPoints.push(p);
    }

    // helper points 3,4
    helperPoints.push(lerp(helperPoints[0], helperPoints[1], t));
    helperPoints.push(lerp(helperPoints[1], helperPoints[2], t));

    // helper point 5 is where the first Bézier ends and where the second Bézier begins
    helperPoints.push(lerp(helperPoints[3], helperPoints[4], t));

    // points for the dynamic bézier
    let firstBezier = [
        points[0],
        helperPoints[0],
        helperPoints[3],
        helperPoints[5]
    ];
    return firstBezier;
}

function lerp(A, B, t) {
    let ry = [
        (B[0] - A[0]) * t + A[0], //x
        (B[1] - A[1]) * t + A[1] //y
    ];
    return ry;
}

function drawCBezier(points, path, index) {
    let d;

    if (index > 0) {
        d = subpaths[index].previous.d;
    } else {
        d = `M${points[0][0]},${points[0][1]} C`;
    }

    // points.length == 4
    for (let i = 1; i < 4; i++) {
        d += ` ${points[i][0]},${points[i][1]} `;
    }
    partialPath.setAttributeNS(null, "d", d);
}

// Main Animation Function
function Typing() {
    rid = window.requestAnimationFrame(Typing);
    if (t >= 1) {
        window.cancelAnimationFrame(rid);
        rid = null;
    } else {
        t += 0.0025;
    }

    lengthAtT = pathlength * t;
    for (index = 0; index < subpaths.length; index++) {
        if (subpaths[index].pathLength >= lengthAtT) {
            break;
        }
    }
    T = get_T(t, index);
    newPoints = getBezierPoints(T, subpaths[index].lastCubicBezier);
    drawCBezier(newPoints, partialPath, index);
}

// Dust Animation
const head = document.getElementsByTagName('head')[0];
let animationId = 1;

function CreateMagicDust(x1, x2, y1, y2, sizeRatio, fallingTime, animationDelay, node = 'main') {
    let dust = document.createElement('span');
    let animation = document.createElement('style');
    animation.innerHTML = '\
  @keyframes blink' + animationId + '{\
      0% {\
          top: ' + y1 + 'px;\
          left: ' + x1 + 'px;\
          width: ' + 2 * sizeRatio + 'px;\
          height: ' + 2 * sizeRatio + 'px;\
          opacity: .4\
      }\
      20% {\
          width: ' + 4 * sizeRatio + 'px;\
          height: ' + 4 * sizeRatio + 'px;\
          opacity: .8\
      }\
      35% {\
          width: ' + 2 * sizeRatio + 'px;\
          height: ' + 2 * sizeRatio + 'px;\
          opacity: .5\
      }\
      55% {\
          width: ' + 3 * sizeRatio + 'px;\
          height: ' + 3 * sizeRatio + 'px;\
          opacity: .7\
      }\
      80% {\
          width: ' + sizeRatio + 'px;\
          height: ' + sizeRatio + 'px;\
          opacity: .3\
      }\
      100% {\
          top: ' + y2 + 'px;\
          left: ' + x2 + 'px;\
          width: ' + 0 + 'px;\
          height: ' + 0 + 'px;\
          opacity: .1\
      }}';
    head.appendChild(animation);
    dust.classList.add('dustDef');
    dust.setAttribute('style', `animation: blink${animationId++} ${fallingTime}s cubic-bezier(.71, .11, .68, .83) infinite ${animationDelay}s`);
    document.getElementById(node).appendChild(dust);
}

// Letter Text Animation
let indexText = 0;
let textLetter = document.querySelector('.textLetter h2');
const textLetterH2 = "Gửi bạn Linh Lê yêu dấu 😆!";
let timoutTextLetter;

function textCharLetter() {
    if (indexText < textLetterH2.length) {
        textLetter.textContent += textLetterH2[indexText];
        indexText++;
        setTimeout(indexText, 100);
    }
    else {
        clearInterval(timoutTextLetter);
        setTimeout(() => {
            funcTimeoutLetterContent()
        }, 500)
    }
}

function funcTimeoutLetter() {
    indexText = 0; // Reset indexText
    textLetter.textContent = ''; // Clear current content
    clearInterval(timoutTextLetter);
    timoutTextLetter = setInterval(() => {
        textCharLetter();
    }, 200)
}

// Letter Content Animation
let indexTextContent = 0;
let textLetterContent = document.querySelector('.contentLetter');
const textLetterP = 
"Chúc cậu 20/10 thật nhiều niềm vui và những điều dễ thương nha 💖.\n" +
"Cậu cứ cười thật nhiều nhé, vì mỗi lần thấy cậu cười là tớ cũng vui theo rồi 😅.\n" +
"À… nếu hôm nay chưa có ai chúc cậu, thì coi như tớ là người đầu tiên nha 😆.";

let timoutTextLetterContent;

function textCharLetterContent() {
    if (indexTextContent < textLetterP.length) {
        textLetterContent.textContent += textLetterP[indexTextContent];
        indexTextContent++;
        setTimeout(indexTextContent, 1);
    }
    else {
        clearInterval(timoutTextLetterContent)
    }
}

function funcTimeoutLetterContent() {
    indexTextContent = 0; // Reset indexTextContent
    textLetterContent.textContent = ''; // Clear current content
    clearInterval(timoutTextLetterContent);
    timoutTextLetterContent = setInterval(() => {
        textCharLetterContent();
    }, 100)
}

// Rose Drawing Animation
var leafOne = document.querySelector('.leafOne');
var stickLine = document.querySelector('.stickLine');
var leafTwo = document.querySelector('.leafTwo');
var leafS1 = document.querySelector('.leafS1');
var rose1 = document.querySelector('.rose1');
var rose2 = document.querySelector('.rose2');
var rose3 = document.querySelector('.rose3');
var rose4 = document.querySelector('.rose4');

var lineDrawing = anime({
    targets: [leafOne, stickLine, leafTwo, leafS1, rose1, rose2, rose3, rose4],
    strokeDashoffset: [anime.setDashoffset, 0],
    easing: 'easeInOutCubic',
    duration: 4000,
    begin: function (anim) {
        //Leaf One
        leafOne.setAttribute("stroke", "black");
        leafOne.setAttribute("fill", "none");
        // Leaf Two
        leafTwo.setAttribute("stroke", "black");
        leafTwo.setAttribute("fill", "none");
        //Stick
        stickLine.setAttribute("stroke", "black");
        stickLine.setAttribute("fill", "none");
        // Leaf S1
        leafS1.setAttribute("stroke", "black");
        leafS1.setAttribute("fill", "none");
        //Rose One
        rose1.setAttribute("stroke", "black");
        rose1.setAttribute("fill", "none");
        //Rose Two
        rose2.setAttribute("stroke", "black");
        rose2.setAttribute("fill", "none");
        //Rose Three
        rose3.setAttribute("stroke", "black");
        rose3.setAttribute("fill", "none");
        //Rose Three
        rose4.setAttribute("stroke", "black");
        rose4.setAttribute("fill", "none");
    },
    complete: function (anim) {
        //Leaf One
        leafOne.setAttribute("fill", "#9CDD05");
        leafOne.setAttribute("stroke", "none");
        //Leaf Two 
        leafTwo.setAttribute("fill", "#9CDD05");
        leafTwo.setAttribute("stroke", "none");
        //Stick
        stickLine.setAttribute("fill", "#83AA2E");
        stickLine.setAttribute("stroke", "none");
        // Leaf S1
        leafS1.setAttribute("fill", "#9CDD05");
        leafS1.setAttribute("stroke", "none");
        // Rose 1
        rose1.setAttribute("fill", "#F37D79");
        rose1.setAttribute("stroke", "none");
        // Rose 2
        rose2.setAttribute("fill", "#D86666");
        rose2.setAttribute("stroke", "none");
        // Rose 3
        rose3.setAttribute("fill", "#F37D79");
        rose3.setAttribute("stroke", "none");
        // Rose 3
        rose4.setAttribute("fill", "#D86666");
        rose4.setAttribute("stroke", "none");
    },
    autoplay: true,
});

// Document Ready
document.addEventListener('DOMContentLoaded', function() {
    // Show click text after 4 seconds
    setTimeout(() => {
        document.querySelector("#text-click").style.display = "inherit";
    }, 4000);
    
    // Rose click event
    document.querySelector("#rose-t").onclick = function () {
        document.querySelector("#rose-t").style.display = "none";
        document.querySelector("#castle").style.display = "flex";
        document.querySelector("#theSvg").style.display = "inherit";

        rid = window.requestAnimationFrame(Typing);
    }
    
    // Valentine card interactions
    $('.valentines').mouseenter(function () {
        $('.card').stop().animate({
            top: '-90px'
        }, 'slow');
    }).mouseleave(function () {
        $('.card').stop().animate({
            top: 0
        }, 'slow');
    });

    $('.card').click(function () {
        $(".wrapperLetterForm").fadeIn();
        funcTimeoutLetter();
    });

    $('.fa-xmark').click(function () {
        $('.wrapperLetterForm').css('display', 'none');
    });
    
    // Create dust animations
    [[130, 132, 150, 152, .15, 2.5, .1, 'sub'],
    [65, 63, 300, 299, .5, 2, .2, 'sub'],
    [70, 70, 150, 150, .45, 2, .5],
    [75, 78, 160, 170, .6, 2, 1],
    [80, 82, 160, 180, .6, 1, .4],
    [85, 100, 160, 170, .5, 2, .5],
    [125, 110, 170, 180, .25, 3, 1.5],
    [90, 90, 115, 115, .4, 2, 2],
    [93, 95, 200, 200, .4, 3, 1.5],
    [100, 100, 145, 155, .45, 1, .5],
    [100, 90, 170, 230, .35, 2, .75],
    [100, 102, 115, 112, .35, 3, .25],
    [100, 95, 170, 200, .55, 1.5, .75],
    [100, 97, 150, 190, .7, 2, 1.5],
    [105, 100, 160, 180, .5, 1.5, .725],
    [125, 125, 180, 190, .25, 1, .725],
    [130, 130, 135, 135, .45, 3, 1.5],
    [135, 132, 170, 190, .25, 2.5, .75],
    [135, 132, 320, 315, .2, 5, .3, 'sub']
    ].forEach((o) => CreateMagicDust(...o));
});