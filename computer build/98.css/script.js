/* ゲーム状態・グローバル変数 */
let gameState = {
  playerName: "",
  storeName: "",
  money: 100000,
  currentDay: 1,
  currentDate: new Date(),
  ordersCompleted: -1,
  selectedParts: {},
  inventory: {},
  doubleRewardRemaining: 0,
  specialDay: null,
  specialDayPart: null
};

let currentOrder = {};
let activePartType = "";
let firstOrderGenerated = true;

/* 職業データ */
const occupations = [
  { name: "高校生", ageMin: 15, ageMax: 17, allowedPurposes: ["ゲーム", "文書作成"] },
  { name: "大学生", ageMin: 18, ageMax: 24, allowedPurposes: ["ゲーム", "インターネット放送", "文書作成", "動画編集", "研究"] },
  { name: "社会人", ageMin: 21, ageMax: 65, allowedPurposes: ["ゲーム", "インターネット放送", "文書作成", "研究", "動画編集", "デザイン"] },
  { name: "フリーター", ageMin: 21, ageMax: 65, allowedPurposes: ["ゲーム", "文書作成", "動画編集"] },
  { name: "研究者", ageMin: 25, ageMax: 50, allowedPurposes: ["ゲーム", "研究", "文書作成"] },
  { name: "公務員", ageMin: 23, ageMax: 65, allowedPurposes: ["ゲーム", "文書作成", "研究"] },
  { name: "専業主婦", ageMin: 25, ageMax: 50, allowedPurposes: ["ゲーム", "文書作成", "動画編集", "インターネット放送"] },
  { name: "経営者", ageMin: 30, ageMax: 75, allowedPurposes: ["ゲーム", "文書作成", "デザイン", "動画編集"] },
  { name: "年金もらってる人", ageMin: 65, ageMax: 90, allowedPurposes: ["ゲーム", "文書作成", "研究"] },
  { name: "無職ニート", ageMin: 18, ageMax: 45, allowedPurposes: ["ゲーム", "インターネット放送"] },
  { name: "デザイナー", ageMin: 18, ageMax: 45, allowedPurposes: ["ゲーム", "インターネット放送", "研究", "デザイン"] }
];

const specialOccupations = [
  { name: "アイドル", ageMin: 16, ageMax: 30, allowedPurposes: ["ゲーム", "文書作成", "インターネット放送"] },
  { name: "ユーチューバー", ageMin: 18, ageMax: 35, allowedPurposes: ["動画編集", "インターネット放送", "ゲーム"] }
];

/* 要素の取得 */
const playerScreen = document.getElementById("playerScreen");
const playerForm = document.getElementById("playerForm");
const storeScreen = document.getElementById("storeScreen");
const storeForm = document.getElementById("storeForm");
const gameScreen = document.getElementById("gameScreen");

const storeTitle = document.getElementById("storeTitle");
const playerInfo = document.getElementById("playerInfo");
const moneyDisplay = document.getElementById("moneyDisplay");
const dayDisplay = document.getElementById("dayDisplay");

const nextOrderBtn = document.getElementById("nextOrderBtn");
const assembleBtn = document.getElementById("assembleBtn");
const orderDisplay = document.getElementById("orderDisplay");
const selectedPartsList = document.getElementById("selectedPartsList");
const totalPriceDisplay = document.getElementById("totalPrice");
const resetPartsBtn = document.getElementById("resetPartsBtn");
const deleteDataBtn = document.getElementById("deleteDataBtn");

/* 在庫初期化 */
function initializeInventory() {
  gameState.inventory = {};
  for (let partType in ComponentsDB) {
    gameState.inventory[partType] = {};
    ComponentsDB[partType].forEach(part => {
      gameState.inventory[partType][part.id] = 3;
    });
  }
}

/* 週の初めに在庫リセット */
function resetInventory() {
  for (let partType in ComponentsDB) {
    ComponentsDB[partType].forEach(part => {
      gameState.inventory[partType][part.id] = 3;
    });
  }
}

/* プレイヤー名入力ページ */
playerForm.addEventListener("submit", function(e) {
  e.preventDefault();
  const playerNameInput = document.getElementById("playerName").value;
  if (!playerNameInput) {
    alert("プレイヤー名は必須です！");
    return;
  }
  gameState.playerName = playerNameInput;
  playerScreen.style.display = "none";
  storeScreen.style.display = "flex";
});

/* 店舗名入力ページ */
storeForm.addEventListener("submit", function(e) {
  e.preventDefault();
  const storeNameInput = document.getElementById("storeName").value;
  if (!storeNameInput) {
    alert("店舗名は必須です！");
    return;
  }
  gameState.storeName = storeNameInput;
  if (!gameState.inventory || Object.keys(gameState.inventory).length === 0) {
    initializeInventory();
  }
  storeScreen.style.display = "none";
  gameScreen.style.display = "block";
  updateHeader();
  generateOrder();
  initPartsSelection();
});

/* 次の注文生成 */
nextOrderBtn.addEventListener("click", function() {
  gameState.money -= 10000;
  updateHeader();
  if (gameState.money <= 0) {
    handleBankruptcy();
    return;
  }
  generateOrder();
});

/* 組み立てボタン */
assembleBtn.addEventListener("click", assemblePC);

/* 選択パーツ初期化 */
resetPartsBtn.addEventListener("click", function() {
  gameState.selectedParts = {};
  updateSelectedParts();
});

/* 価格表示 */
function formatPrice(value) {
  return value.toLocaleString("ja-JP") + "円";
}

/* ヘッダー更新 */
function updateHeader() {
  storeTitle.textContent = gameState.storeName;
  playerInfo.textContent = "PLAYER: " + gameState.playerName;
  moneyDisplay.textContent = "MONEY: " + formatPrice(gameState.money);
  let startDate = new Date(gameState.currentDate);
  startDate.setDate(startDate.getDate() + gameState.currentDay - 1);
  let formattedDate = startDate.getFullYear() + "." + (startDate.getMonth() + 1) + "." + startDate.getDate();
  dayDisplay.textContent = formattedDate + " Day " + gameState.currentDay;
}

/* 顧客注文生成 */
function generateOrder() {
  if (!firstOrderGenerated) {
    firstOrderGenerated = true;
    return;
  }
  let budgetOptions = [];
  for (let i = 5; i <= 100; i += 5) {
    budgetOptions.push(i * 10000);
  }
  let budget = budgetOptions[Math.floor(Math.random() * budgetOptions.length)];
  
  let age = Math.floor(Math.random() * 50) + 10;
  const genders = ["男性", "女性"];
  let gender = genders[Math.floor(Math.random() * genders.length)];
  
  let possibleJobs = occupations.filter(job => age >= job.ageMin && age <= job.ageMax);
  possibleJobs = possibleJobs.concat(specialOccupations.filter(job => age >= job.ageMin && age <= job.ageMax));
  let chosenJobObj = possibleJobs[Math.floor(Math.random() * possibleJobs.length)] || {name:"無職", allowedPurposes: ["ゲーム", "文書作成"]};
  let job = chosenJobObj.name;
  let purpose = chosenJobObj.allowedPurposes[Math.floor(Math.random() * chosenJobObj.allowedPurposes.length)];
  
  let ageGroup = "";
  if (age < 20) { ageGroup = "10s"; }
  else if (age < 30) { ageGroup = "20s"; }
  else if (age < 40) { ageGroup = "30s"; }
  else if (age < 50) { ageGroup = "40s"; }
  else { ageGroup = "50s"; }
  
  let genderPrefix = (gender === "男性") ? "m_" : "f_";
  let typeNum = (ageGroup === "30s") ? Math.floor(Math.random() * 6) + 1 : Math.floor(Math.random() * 12) + 1;
  let imgFileName = genderPrefix + ageGroup + "_" + typeNum + ".png";
  
  currentOrder = { gender, age, job, purpose, budget, img: "img/" + imgFileName };
  
  orderDisplay.innerHTML = `
    <div class="orderInfo">
      <p>性別 : ${gender}</p>
      <p>年齢 : ${age}</p>
      <p>職業 : ${job}</p>
      <p>用途 : ${purpose}</p>
      <p>予算 : ${formatPrice(budget)}</p>
    </div>
    <div class="orderImage">
      <img src="${currentOrder.img}" alt="顧客画像">
    </div>
  `;
  
  gameState.ordersCompleted++;
  if (gameState.ordersCompleted >= 2) {
    gameState.currentDay++;
    gameState.ordersCompleted = 0;
    
    // 特別な日の判定（50%の確率）
    if (Math.random() < 0.5) {
      const effects = [
        { type: "priceDouble", description: "の価格が2倍" },
        { type: "rewardDouble", description: "報酬が2倍" },
        { type: "stockIncrease", description: "の在庫が+3" },
        { type: "budgetIncrease", description: "顧客の予算が1.5倍" },
        { type: "penaltyReduction", description: "ペナルティが半分" }
      ];
      gameState.specialDay = effects[Math.floor(Math.random() * effects.length)];
      
      // 部品に関連する効果の場合、ランダムに部品を選択
      const partTypes = ["cpu", "gpu", "ram", "psu", "case", "storage", "cooler", "motherboard"];
      if (gameState.specialDay.type === "priceDouble" || gameState.specialDay.type === "stockIncrease") {
        gameState.specialDayPart = partTypes[Math.floor(Math.random() * partTypes.length)];
        // 在庫増加効果を即座に適用
        if (gameState.specialDay.type === "stockIncrease") {
          ComponentsDB[gameState.specialDayPart].forEach(part => {
            gameState.inventory[gameState.specialDayPart][part.id] += 3;
          });
        }
      }
      
      // 顧客の予算増加を適用
      if (gameState.specialDay.type === "budgetIncrease") {
        currentOrder.budget = Math.floor(currentOrder.budget * 1.5);
        orderDisplay.querySelector(".orderInfo p:nth-child(5)").textContent = `予算 : ${formatPrice(currentOrder.budget)}`;
      }
    } else {
      gameState.specialDay = null;
      gameState.specialDayPart = null;
    }
    
    if (gameState.currentDay > 1 && gameState.currentDay % 7 === 1) {
      resetInventory();
    }
    updateHeader();
    updateSpecialDayDisplay();
    gameState.selectedParts = {};
    updateSelectedParts();
    // 現在の部品リストを更新して価格反映
    if (activePartType) {
      displayParts(ComponentsDB[activePartType], activePartType);
    }
  }
}

/* 特別な日表示更新 */
function updateSpecialDayDisplay() {
  const specialDayDisplay = document.getElementById("specialDayDisplay");
  const specialDayEffect = document.getElementById("specialDayEffect");
  
  if (gameState.specialDay) {
    let effectText = gameState.specialDay.description;
    if (gameState.specialDayPart) {
      effectText = gameState.specialDayPart.toUpperCase() + effectText;
    }
    specialDayEffect.textContent = effectText;
    specialDayDisplay.style.display = "block";
  } else {
    specialDayDisplay.style.display = "none";
  }
}

/* パーツ選択初期化 */
function initPartsSelection() {
  const tabs = document.querySelectorAll(".partTab");
  tabs.forEach(tab => {
    tab.addEventListener("click", function() {
      tabs.forEach(t => t.classList.remove("active"));
      this.classList.add("active");
      const partType = this.getAttribute("data-part");
      activePartType = partType;
      displayParts(ComponentsDB[partType], partType);
    });
  });
  if (tabs.length > 0) {
    tabs[0].classList.add("active");
    activePartType = tabs[0].getAttribute("data-part");
    displayParts(ComponentsDB[activePartType], activePartType);
  }
}

/* 部品リスト表示（表形式） */
function displayParts(partsArray, partType) {
  if (!gameState.inventory[partType]) {
    gameState.inventory[partType] = {};
    partsArray.forEach(part => {
      gameState.inventory[partType][part.id] = 3;
    });
  }
  
  const partsListDiv = document.getElementById("partsList");
  partsListDiv.innerHTML = "";
  if (!partsArray) {
    partsListDiv.innerHTML = "<p>部品が見つかりません。</p>";
    return;
  }
  
  const tableSpec = getTableSpec(partType);
  let table = document.createElement("table");
  table.className = "partsTable";
  
  let headerRow = document.createElement("tr");
  tableSpec.headers.forEach(headerText => {
    let th = document.createElement("th");
    th.textContent = headerText;
    headerRow.appendChild(th);
  });
  table.appendChild(headerRow);
  
  partsArray.forEach(part => {
    let stock = gameState.inventory[partType][part.id];
    let row = document.createElement("tr");
    row.classList.add("dataRow");
    if (stock === 0) {
      row.style.backgroundColor = "#eee";
    }
    row.style.cursor = "pointer";
    
    // 特別な日の価格2倍効果を適用
    let price = part.price;
    if (gameState.specialDay && gameState.specialDay.type === "priceDouble" && gameState.specialDayPart === partType) {
      price *= 2;
    }
    
    let cellData = tableSpec.rowData(part, stock, price);
    cellData.forEach(text => {
      let td = document.createElement("td");
      td.textContent = text;
      row.appendChild(td);
    });
    
    row.addEventListener("click", function() {
      if (gameState.inventory[partType][part.id] === 0) return;
      const rows = table.querySelectorAll("tr.dataRow");
      rows.forEach(r => { r.style.backgroundColor = ""; });
      if (gameState.selectedParts[partType] && gameState.selectedParts[partType].id === part.id) {
        delete gameState.selectedParts[partType];
        row.style.backgroundColor = "";
      } else {
        gameState.selectedParts[partType] = { ...part, price: price }; // 特別な日の価格を反映
        row.style.backgroundColor = "rgba(0, 0, 255, 0.2)";
      }
      updateSelectedParts();
    });
    
    table.appendChild(row);
  });
  
  partsListDiv.appendChild(table);
}

/* 各部品のテーブル仕様 */
function getTableSpec(partType) {
  if (partType === "cpu") {
    return {
      headers: ["部品名", "コア", "スレッド", "消費電力(W)", "ソケット", "ブースト(GHz)", "ベンチマーク", "価格", "在庫"],
      rowData: function(part, stock, price) {
        return [
          part.name,
          part.cores,
          part.threads,
          part.tdp,
          part.socket,
          part.boost,
          part.benchmark,
          formatPrice(price),
          stock + "個"
        ];
      }
    };
  } else if (partType === "gpu") {
    return {
      headers: ["部品名", "Compute Unit", "VRAM(GB)", "バス", "TDP(W)", "ベンチマーク", "価格", "在庫"],
      rowData: function(part, stock, price) {
        return [
          part.name,
          part.computeUnits,
          part.vram,
          part.bus,
          part.tdp,
          part.benchmark,
          formatPrice(price),
          stock + "個"
        ];
      }
    };
  } else if (partType === "ram") {
    return {
      headers: ["選択肢", "１枚の容量", "枚数", "総容量", "価格", "在庫"],
      rowData: function(part, stock, price) {
        return [
          part.name,
          part.oneRamCapacity,
          part.ramNumber,
          part.capacity,
          formatPrice(price),
          stock + "個"
        ];
      }
    };
  } else if (partType === "psu") {
    return {
      headers: ["部品名", "ワット数(W)", "効率", "価格", "在庫"],
      rowData: function(part, stock, price) {
        return [
          part.name,
          part.wattage,
          part.efficiency,
          formatPrice(price),
          stock + "個"
        ];
      }
    };
  } else if (partType === "case") {
    return {
      headers: ["部品名", "サイズ", "マザーボードサイズ", "価格", "在庫"],
      rowData: function(part, stock, price) {
        return [
          part.name,
          part.size,
          part.motherboard,
          formatPrice(price),
          stock + "個"
        ];
      }
    };
  } else if (partType === "storage") {
    return {
      headers: ["部品名", "タイプ", "容量(GB)", "速度", "価格", "在庫"],
      rowData: function(part, stock, price) {
        return [
          part.name,
          part.type,
          part.capacity,
          part.speed,
          formatPrice(price),
          stock + "個"
        ];
      }
    };
  } else if (partType === "cooler") {
    return {
      headers: ["部品名", "タイプ", "ファン数", "価格", "在庫"],
      rowData: function(part, stock, price) {
        return [
          part.name,
          part.type,
          part.fans,
          formatPrice(price),
          stock + "個"
        ];
      }
    };
  } else if (partType === "motherboard") {
    return {
      headers: ["部品名", "ソケット", "フォーム", "価格", "在庫"],
      rowData: function(part, stock, price) {
        return [
          part.name,
          part.socket,
          part.form,
          formatPrice(price),
          stock + "個"
        ];
      }
    };
  }
  return { headers: [], rowData: function() { return []; } };
}

/* 選択済み部品・合計金額更新 */
function updateSelectedParts() {
  selectedPartsList.innerHTML = "";
  let total = 0;
  for (let key in gameState.selectedParts) {
    let part = gameState.selectedParts[key];
    let li = document.createElement("li");
    li.textContent = `- ${key.toUpperCase()} : ${part.name} - ${formatPrice(part.price)}`;
    selectedPartsList.appendChild(li);
    total += part.price;
  }
  
  const sellingPrice = total * 1.1 + 5000;
  
  totalPriceDisplay.innerHTML = `
    <div>部品合計: ${formatPrice(total)}</div>
    <div>販売価格: ${formatPrice(sellingPrice)}</div>
  `;
}

/* 組み立て処理 */
function assemblePC() {
  const requiredParts = ["cpu", "gpu", "ram", "motherboard", "case", "psu", "storage", "cooler"];
  for (let i = 0; i < requiredParts.length; i++) {
    if (!gameState.selectedParts[requiredParts[i]]) {
      alert(requiredParts[i] + " が選択されていません！");
      return;
    }
  }
  
  let effectiveTotal = 0;
  for (let key in gameState.selectedParts) {
    effectiveTotal += gameState.selectedParts[key].price;
  }
  let sellingPrice = effectiveTotal * 1.1;
  
  let resultMessage = "";
  let baseIncome = (sellingPrice - effectiveTotal) + 5000;
  let income = baseIncome;
  let isSpecialCustomer = specialOccupations.some(job => job.name === currentOrder.job);
  
  if (sellingPrice <= currentOrder.budget) {
    if (gameState.doubleRewardRemaining > 0) {
      income *= 2;
      gameState.doubleRewardRemaining--;
    }
    // 特別な日の報酬2倍効果
    if (gameState.specialDay && gameState.specialDay.type === "rewardDouble") {
      income *= 2;
    }
    gameState.money += income;
    resultMessage = `組み立て成功！\n販売価格: ${formatPrice(sellingPrice)}\n収入: ${formatPrice(income)}\n（実効原価: ${formatPrice(effectiveTotal)}、顧客予算: ${formatPrice(currentOrder.budget)}）`;
    
    if (isSpecialCustomer) {
      gameState.doubleRewardRemaining = 2;
    }
  } else {
    let penalty = 50000;
    if (isSpecialCustomer) {
      penalty *= 2;
    }
    // 特別な日のペナルティ半減効果
    if (gameState.specialDay && gameState.specialDay.type === "penaltyReduction") {
      penalty /= 2;
    }
    gameState.money -= penalty;
    resultMessage = `組み立て失敗！\n販売価格: ${formatPrice(sellingPrice)} は顧客予算を超えています。\nペナルティ: ${formatPrice(penalty)}\n（実効原価: ${formatPrice(effectiveTotal)}、顧客予算: ${formatPrice(currentOrder.budget)}）`;
  }
  
  for (let key in gameState.selectedParts) {
    let part = gameState.selectedParts[key];
    if (gameState.inventory[key] && gameState.inventory[key][part.id] > 0) {
      gameState.inventory[key][part.id]--;
    }
  }
  
  updateHeader();
  if (gameState.money <= 0) {
    alert(resultMessage);
    handleBankruptcy();
    return;
  }
  
  alert(resultMessage);
  gameState.selectedParts = {};
  updateSelectedParts();
  generateOrder();
}

/* データ削除（転生） */
deleteDataBtn.addEventListener("click", function() {
  if (confirm("本当に全てのデータを削除して最初からやり直しますか？")) {
    gameState = {
      playerName: "",
      storeName: "",
      money: 100000,
      currentDay: 1,
      currentDate: new Date(),
      ordersCompleted: -1,
      selectedParts: {},
      inventory: {},
      doubleRewardRemaining: 0,
      specialDay: null,
      specialDayPart: null
    };
    gameScreen.style.display = "none";
    storeScreen.style.display = "none";
    playerScreen.style.display = "flex";
    document.getElementById("playerName").value = "";
    document.getElementById("storeName").value = "";
    alert("データを消去しました！最初から始めてください");
  }
});

/* 破産処理 */
function handleBankruptcy() {
  const bankruptcyScreen = document.getElementById("bankruptcyScreen");
  bankruptcyScreen.style.display = "flex";
  
  setTimeout(() => {
    bankruptcyScreen.classList.add("visible");
  }, 10);

  setTimeout(() => {
    gameState = {
      playerName: "",
      storeName: "",
      money: 100000,
      currentDay: 1,
      currentDate: new Date(),
      ordersCompleted: -1,
      selectedParts: {},
      inventory: {},
      doubleRewardRemaining: 0,
      specialDay: null,
      specialDayPart: null
    };
    initializeInventory();
    bankruptcyScreen.style.display = "none";
    bankruptcyScreen.classList.remove("visible");
    gameScreen.style.display = "none";
    storeScreen.style.display = "none";
    playerScreen.style.display = "flex";
    document.getElementById("playerName").value = "";
    document.getElementById("storeName").value = "";
    alert("破産しました！ゲームがリセットされ、最初から始まります。");
  }, 3000);
}