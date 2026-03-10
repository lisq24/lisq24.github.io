const subjectName = localStorage.getItem("name");
const imageType = localStorage.getItem("imageType");
const singleImageCategory = localStorage.getItem("singleImageCategory");
const gender = localStorage.getItem("gender");
const age = localStorage.getItem("age");
const totalImages = 4; // 正式实验每阶段图片数
const practiceImages = 4; // 练习每阶段图片数

let results = [];        // 存储所有试次的数据（包含练习和正式实验）
let startTime;           // 每张图片出现的时间戳

// ---------- 辅助函数 ----------
function getImageFolderPath(aiAccuracy, type) {
    let folder = '';
    if (imageType === 'single') {
        folder = `classify/${singleImageCategory}`;
    } else if (imageType === 'multiple') {
        folder = `noclassify`;
    } else {
        folder = ''
    }
    return `${folder}/${aiAccuracy}/${type}`;
}

function randomizeArray(arr) {
    return arr.sort(() => Math.random() - 0.5);
}

function correctAnswer(index) {
    return index <= totalImages / 2 ? "违规" : "合规";
}

// ---------- 通用提示页面 ----------
function showStagePrompt(area, stageText, callback) {
    const prompt = document.createElement("div");
    prompt.innerHTML = `<h2>${stageText}</h2><button id="continueButton">继续</button>`;
    area.appendChild(prompt);
    document.getElementById("continueButton").onclick = function () {
        area.removeChild(prompt);
        callback();
    };
}

// ---------- 记录数据（通用） ----------
function recordResponse(choice, imageIndex, imagePath, stage) {
    const rt = (Date.now() - startTime) / 1000;
    let correct = '';
    let isCorrect = '';
    if (choice === '违规' || choice === '合规') {
        correct = correctAnswer(imageIndex);
        isCorrect = choice === correct ? 1 : 0;
    } else {
        correct = '';
        isCorrect = '';
    }
    results.push({
        // 图片序号: imageIndex,
        图片路径: imagePath,
        阶段: stage,
        选择: choice,
        正确答案: correct,
        是否正确: isCorrect,
        反应时: rt,
    });
}

// ---------- 练习阶段专用展示函数 ----------
function showPracticeSingleImage(area, imageFolder, imageIndex, onComplete) {
    // 1. 创建容器和象限（可提前渲染占位）
    const container = document.createElement("div");
    container.className = "quadrant-container";
    for (let i = 0; i < 4; i++) {
        const div = document.createElement("div");
        div.className = "quadrant";
        container.appendChild(div);
    }
    const randomPosition = Math.floor(Math.random() * 4);

    // 2. 创建图片并开始加载（但暂不显示按钮）
    const img = new Image(); // 等价于 document.createElement('img')
    img.src = `${imageFolder}/${imageIndex}.JPG`;

    // 可选：显示加载提示
    const loadingDiv = document.createElement("div");
    loadingDiv.textContent = "加载中...";
    container.children[randomPosition].appendChild(loadingDiv);
    area.innerHTML = ""; // 清空区域
    area.appendChild(container);

    // 3. 图片加载完成后替换内容并启动计时
    img.onload = function() {
        // 移除加载提示
        container.children[randomPosition].removeChild(loadingDiv);

        // 构建图片和按钮容器
        const imgContainer = document.createElement("div");
        imgContainer.style.display = "flex";
        imgContainer.style.flexDirection = "column";
        imgContainer.appendChild(img); // 此时 img 已加载完毕

        const btn1 = document.createElement("button");
        btn1.innerText = "违规";
        btn1.className = "violation";
        btn1.onclick = function() {
            clearTimeout(timer);
            this.classList.add("pressed");
            recordResponse("违规", imageIndex, `${imageFolder}/${imageIndex}.JPG`, "practiceSingle");
            onComplete();
        };

        const btn2 = document.createElement("button");
        btn2.innerText = "合规";
        btn2.className = "compliance";
        btn2.onclick = function() {
            clearTimeout(timer);
            this.classList.add("pressed");
            recordResponse("合规", imageIndex, `${imageFolder}/${imageIndex}.JPG`, "practiceSingle");
            onComplete();
        };

        const btnContainer = document.createElement("div");
        btnContainer.appendChild(btn1);
        btnContainer.appendChild(btn2);
        btnContainer.style.marginTop = "5px";
        imgContainer.appendChild(btnContainer);

        // 将最终内容放入象限
        container.children[randomPosition].appendChild(imgContainer);

        // 启动计时器（此时图片已显示）
        timer = setTimeout(() => {
            recordResponse("无反应", imageIndex, `${imageFolder}/${imageIndex}.JPG`, "practiceSingle");
            onComplete();
        }, 5000);
    };
}

function showPracticeFourImages(area, imageFolder, imageIndices, onComplete) {
    const totalInBatch = imageIndices.length;
    let loadedCount = 0;
    const images = []; // 存储加载好的图片元素
    let timer; // 用于超时

    const loadingMsg = document.createElement("div");
    loadingMsg.textContent = "图片加载中，请稍候...";
    area.innerHTML = "";
    area.appendChild(loadingMsg);
    
    // 逐一加载图片
    imageIndices.forEach((idx, i) => {
        const img = new Image();
        img.src = `${imageFolder}/${idx}.JPG`;

        img.onload = function() {
            loadedCount++;
            images[i] = img; // 按原顺序保存

            if (loadedCount === totalInBatch) {
                // 所有图片加载完成，移除提示并构建界面
                area.innerHTML = "";

                const grid = document.createElement("div");
                grid.className = "grid4";
                let selectedCount = 0;
                const selectedStatus = new Array(totalInBatch).fill(false);

                function checkAllSelected() {
                    if (selectedCount === totalInBatch) {
                        clearTimeout(timer);
                        onComplete();
                    }
                }

                for (let j = 0; j < totalInBatch; j++) {
                    const div = document.createElement("div");
                    const imgElement = images[j]; // 已加载的图片

                    const btn1 = document.createElement("button");
                    btn1.innerText = "违规";
                    btn1.className = "violation";
                    btn1.onclick = function() {
                        if (selectedStatus[j]) return;
                        selectedStatus[j] = true;
                        this.classList.add("pressed");
                        recordResponse("违规", imageIndices[j], `${imageFolder}/${imageIndices[j]}.JPG`, "practiceFour");
                        selectedCount++;
                        checkAllSelected();
                    };

                    const btn2 = document.createElement("button");
                    btn2.innerText = "合规";
                    btn2.className = "compliance";
                    btn2.onclick = function() {
                        if (selectedStatus[j]) return;
                        selectedStatus[j] = true;
                        this.classList.add("pressed");
                        recordResponse("合规", imageIndices[j], `${imageFolder}/${imageIndices[j]}.JPG`, "practiceFour");
                        selectedCount++;
                        checkAllSelected();
                    };

                    div.appendChild(imgElement);
                    div.appendChild(document.createElement("br"));
                    div.appendChild(btn1);
                    div.appendChild(btn2);
                    grid.appendChild(div);
                }

                area.appendChild(grid);

                // 所有图片已显示，开始计时
                timer = setTimeout(() => {
                    for (let k = 0; k < totalInBatch; k++) {
                        if (!selectedStatus[k]) {
                            recordResponse("无反应", imageIndices[k], `${imageFolder}/${imageIndices[k]}.JPG`, "practiceFour");
                        }
                    }
                    onComplete();
                }, 20000);
            }
        };
    });
}

// ---------- 练习阶段控制 ----------
let hasShownSinglePrompt = false;
let hasShownFourPrompt = false;

function runPracticeSingle(area, callback) {
    if (!hasShownSinglePrompt) {
        showStagePrompt(area, "呈现单图", () => {
            hasShownSinglePrompt = true;
            startPracticeSingle(area, callback);
        });
    } else {
        startPracticeSingle(area, callback);
    }
}

function startPracticeSingle(area, callback) {
    const imageFolder = imageType === 'single'
        ? `classify/${singleImageCategory}/pilot`
        : `noclassify/pilot`;
    const practiceIndices = randomizeArray([...Array(practiceImages).keys()].map(i => i + 1));
    let idx = 0;

    function next() {
        if (idx >= practiceImages) {
            area.innerHTML = ""; // 清空区域，避免与提示重叠
            callback();
            return;
        }
        startTime = Date.now();
        showPracticeSingleImage(area, imageFolder, practiceIndices[idx], () => {
            idx++;
            next();
        });
    }
    next();
}

function runPracticeFour(area, callback) {
    if (!hasShownFourPrompt) {
        showStagePrompt(area, "呈现四图", () => {
            hasShownFourPrompt = true;
            startPracticeFour(area, callback);
        });
    } else {
        startPracticeFour(area, callback);
    }
}

function startPracticeFour(area, callback) {
    const imageFolder = imageType === 'single'
        ? `classify/${singleImageCategory}/pilot`
        : `noclassify/pilot`;
    const practiceIndices = randomizeArray([...Array(practiceImages).keys()].map(i => i + 1));
    let idx = 0;

    function next() {
        if (idx >= practiceImages) {
            area.innerHTML = ""; // 清空区域，避免与提示重叠
            callback();
            return;
        }
        const remaining = practiceImages - idx;
        const batchSize = Math.min(4, remaining);
        const batchIndices = practiceIndices.slice(idx, idx + batchSize);
        startTime = Date.now();
        showPracticeFourImages(area, imageFolder, batchIndices, () => {
            idx += batchSize;
            next();
        });
    }
    next();
}

function runPractice(area) {
    runPracticeSingle(area, () => {
        runPracticeFour(area, () => {
            // 练习全部结束，显示正式实验提示
            showStagePrompt(area, "正式实验", () => {
                startFormalExperiment(area);
            });
        });
    });
}

// ---------- 正式实验 ----------
function showFormalSingle(area, imageFolder, imageIndex, stage, onComplete) {
    const container = document.createElement("div");
    container.className = "quadrant-container";
    for (let i = 0; i < 4; i++) {
        const div = document.createElement("div");
        div.className = "quadrant";
        container.appendChild(div);
    }
    const randomPosition = Math.floor(Math.random() * 4);
    const imgContainer = document.createElement("div");
    imgContainer.style.display = "flex";
    imgContainer.style.flexDirection = "column";

    const img = document.createElement("img");
    img.src = `${imageFolder}/${imageIndex}.JPG`;
    imgContainer.appendChild(img);

    const btn1 = document.createElement("button");
    btn1.innerText = "违规";
    btn1.className = "violation";
    btn1.onclick = function () {
        clearTimeout(timer);
        this.classList.add("pressed");
        recordResponse("违规", imageIndex, `${imageFolder}/${imageIndex}.JPG`, stage);
        onComplete();
    };

    const btn2 = document.createElement("button");
    btn2.innerText = "合规";
    btn2.className = "compliance";
    btn2.onclick = function () {
        clearTimeout(timer);
        this.classList.add("pressed");
        recordResponse("合规", imageIndex, `${imageFolder}/${imageIndex}.JPG`, stage);
        onComplete();
    };

    const btnContainer = document.createElement("div");
    btnContainer.appendChild(btn1);
    btnContainer.appendChild(btn2);
    btnContainer.style.marginTop = "5px";
    imgContainer.appendChild(btnContainer);
    container.children[randomPosition].appendChild(imgContainer);
    area.innerHTML = "";
    area.appendChild(container);

    const timer = setTimeout(() => {
        recordResponse("无反应", imageIndex, `${imageFolder}/${imageIndex}.JPG`, stage);
        onComplete();
    }, 5000);
}

function showFormalFour(area, imageFolder, imageIndices, stage, onComplete) {
    const grid = document.createElement("div");
    grid.className = "grid4";
    let selectedCount = 0;
    const totalInBatch = imageIndices.length;
    const selectedStatus = new Array(totalInBatch).fill(false);

    function checkAllSelected() {
        if (selectedCount === totalInBatch) {
            clearTimeout(timer);
            onComplete();
        }
    }

    for (let i = 0; i < totalInBatch; i++) {
        const div = document.createElement("div");
        const img = document.createElement("img");
        img.src = `${imageFolder}/${imageIndices[i]}.JPG`;

        const btn1 = document.createElement("button");
        btn1.innerText = "违规";
        btn1.className = "violation";
        btn1.onclick = function () {
            if (selectedStatus[i]) return;
            selectedStatus[i] = true;
            this.classList.add("pressed");
            recordResponse("违规", imageIndices[i], `${imageFolder}/${imageIndices[i]}.JPG`, stage);
            selectedCount++;
            checkAllSelected();
        };

        const btn2 = document.createElement("button");
        btn2.innerText = "合规";
        btn2.className = "compliance";
        btn2.onclick = function () {
            if (selectedStatus[i]) return;
            selectedStatus[i] = true;
            this.classList.add("pressed");
            recordResponse("合规", imageIndices[i], `${imageFolder}/${imageIndices[i]}.JPG`, stage);
            selectedCount++;
            checkAllSelected();
        };

        div.appendChild(img);
        div.appendChild(document.createElement("br"));
        div.appendChild(btn1);
        div.appendChild(btn2);
        grid.appendChild(div);
    }

    area.innerHTML = "";
    area.appendChild(grid);

    const timer = setTimeout(() => {
        for (let i = 0; i < totalInBatch; i++) {
            if (!selectedStatus[i]) {
                recordResponse("无反应", imageIndices[i], `${imageFolder}/${imageIndices[i]}.JPG`, stage);
            }
        }
        onComplete();
    }, 20000);
}

function startFormalExperiment(area) {
    // 两个准确率
    const accuracies = ['70', '90'];
    // 随机打乱准确率顺序
    const shuffledAccuracies = randomizeArray(accuracies);
    
    // 准备文件夹数字1-4
    let availableFolders = ['1', '2', '3', '4'];
    
    let accIndex = 0;

    function runNextAccuracy() {
        if (accIndex >= shuffledAccuracies.length) {
            saveData(area);
            return;
        }
        const accuracy = shuffledAccuracies[accIndex];
        
        // 为当前准确率的两个类型随机分配两个不同的文件夹
        const foldersForThisAccuracy = [];
        for (let i = 0; i < 2; i++) {
            const randomIndex = Math.floor(Math.random() * availableFolders.length);
            foldersForThisAccuracy.push(availableFolders[randomIndex]);
            availableFolders.splice(randomIndex, 1);
        }
        
        // 随机决定该准确率内部两个类型的顺序
        const types = randomizeArray(['single', 'four']);
        
        let typeIndex = 0;

        function runNextType() {
            if (typeIndex >= types.length) {
                accIndex++;
                runNextAccuracy();
                return;
            }
            const currentType = types[typeIndex];
            const folderNum = foldersForThisAccuracy[typeIndex];
            const typeText = currentType === 'single' ? '单图' : '四图';
            const baseFolder = getImageFolderPath(accuracy, folderNum);
            const stage = `${accuracy}%-${currentType}`;  // 阶段字符串

            area.innerHTML = "";
            showStagePrompt(area, `${accuracy}% AI准确率 - ${typeText}`, () => {
                const images = randomizeArray([...Array(totalImages).keys()].map(i => i + 1));
                let imageIndex = 0;

                if (currentType === 'single') {
                    function showNextSingle() {
                        if (imageIndex >= images.length) {
                            typeIndex++;
                            runNextType();
                            return;
                        }
                        startTime = Date.now();
                        showFormalSingle(area, baseFolder, images[imageIndex], stage, () => {
                            imageIndex++;
                            showNextSingle();
                        });
                    }
                    showNextSingle();
                } else {
                    function showNextFour() {
                        if (imageIndex >= images.length) {
                            typeIndex++;
                            runNextType();
                            return;
                        }
                        const remaining = images.length - imageIndex;
                        const batchSize = Math.min(4, remaining);
                        const batchIndices = images.slice(imageIndex, imageIndex + batchSize);
                        startTime = Date.now();
                        showFormalFour(area, baseFolder, batchIndices, stage, () => {
                            imageIndex += batchSize;
                            showNextFour();
                        });
                    }
                    showNextFour();
                }
            });
        }
        runNextType();
    }
    runNextAccuracy();
}

// ---------- 数据保存 ----------
function saveData(area) {
    // 构建文件名：姓名_性别_年龄_图片类型_具体类别.xlsx
    const fileNameParts = [
        subjectName || '未知',
        gender || '未知',
        age || '未知',
        imageType || '未知',
        singleImageCategory || '无'
    ];
    const fileName = fileNameParts.join('_') + '.xlsx';
    
    const ws = XLSX.utils.json_to_sheet(results);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "data");
    XLSX.writeFile(wb, fileName);
    area.innerHTML = "<h2>实验结束，数据已下载，请上传至网络学堂</h2>";
}

// ---------- 启动实验 ----------
function startExperiment() {
    const area = document.getElementById("experimentArea");
    showStagePrompt(area, "练习", () => {
        runPractice(area);
    });
}

window.onload = startExperiment;
