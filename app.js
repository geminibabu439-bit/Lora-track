// ================================
// AI MODEL TRACKER - app.js (shared / Firestore + Auth version)
// ================================

const tableBody = document.querySelector("#tracker tbody");
const search = document.getElementById("search");
const addBtn = document.getElementById("addRowBtn");
const syncStatus = document.getElementById("syncStatus");

const loginForm = document.getElementById("loginForm");
const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const logoutBtn = document.getElementById("logoutBtn");

const DROPDOWN_OPTIONS = ["", "G Chrome", "V Chrome", "Edge", "G Ch Chrome", "V Ch Chrome"];
const MAX_IMAGE_DIMENSION = 400; // px, keeps photos small enough for Firestore's 1MB doc limit

// -------------------------------
// Firebase init
// -------------------------------
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
const docRef = db.collection("tracker").doc("shared");

let saveTimer = null;
let isOwner = false; // true only when signed in
let lastSyncedJSON = null; // last data we know is saved - used to skip needless re-renders

// -------------------------------
// Auth: sign in / out
// -------------------------------
loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    auth.signInWithEmailAndPassword(loginEmail.value, loginPassword.value)
        .then(() => {
            loginEmail.value = "";
            loginPassword.value = "";
        })
        .catch((err) => {
            alert("Sign in failed: " + err.message);
        });
});

logoutBtn.addEventListener("click", () => {
    auth.signOut();
});

auth.onAuthStateChanged((user) => {
    isOwner = !!user;

    loginForm.style.display = isOwner ? "none" : "flex";
    logoutBtn.style.display = isOwner ? "inline-block" : "none";
    addBtn.style.display = isOwner ? "inline-block" : "none";

    // Re-render existing rows so contenteditable/dropdowns/photo controls
    // switch between editable and read-only without losing current data.
    render(serializeRows());
});

// -------------------------------
// Search
// -------------------------------
search.addEventListener("keyup", () => {
    const value = search.value.toLowerCase();

    tableBody.querySelectorAll("tr").forEach(row => {
        row.style.display = row.innerText.toLowerCase().includes(value) ? "" : "none";
    });
});

// -------------------------------
// Build a dropdown <select> with a given value pre-selected
// -------------------------------
function buildDropdown(selectedValue = "") {
    const select = document.createElement("select");

    DROPDOWN_OPTIONS.forEach(opt => {
        const option = document.createElement("option");
        option.value = opt;
        option.textContent = opt;
        if (opt === selectedValue) option.selected = true;
        select.appendChild(option);
    });

    select.disabled = !isOwner;
    select.addEventListener("change", scheduleSave);

    return select;
}

// -------------------------------
// Build one row (from scratch or from saved data)
// -------------------------------
function buildRow(data = {}) {
    const row = document.createElement("tr");

    // Photo cell
    const photoTd = document.createElement("td");
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.hidden = true;
    fileInput.addEventListener("change", () => loadImage(fileInput));

    const photoBox = document.createElement("div");
    photoBox.className = "photo-box";
    if (isOwner) {
        photoBox.addEventListener("click", () => fileInput.click());
        photoBox.style.cursor = "pointer";
    } else {
        photoBox.style.cursor = "default";
    }

    if (data.photo) {
        const img = document.createElement("img");
        img.src = data.photo;
        img.className = "photo-preview";
        img.addEventListener("click", (e) => {
            e.stopPropagation();
            previewImage(data.photo);
        });
        photoBox.appendChild(img);
    } else {
        photoBox.textContent = "📷";
    }

    photoTd.appendChild(fileInput);
    photoTd.appendChild(photoBox);
    row.appendChild(photoTd);

    // Character cell
    const charTd = document.createElement("td");
    charTd.contentEditable = isOwner ? "true" : "false";
    charTd.textContent = data.character ?? "New Character";
    row.appendChild(charTd);

    // Three dropdown cells
    ["krea", "klein", "zturbo"].forEach(key => {
        const td = document.createElement("td");
        td.appendChild(buildDropdown(data[key] ?? ""));
        row.appendChild(td);
    });

    // Link cell
    const linkTd = document.createElement("td");
    linkTd.contentEditable = isOwner ? "true" : "false";
    linkTd.textContent = data.link ?? "https://";
    row.appendChild(linkTd);

    // Notes cell
    const notesTd = document.createElement("td");
    notesTd.contentEditable = isOwner ? "true" : "false";
    notesTd.textContent = data.notes ?? "";
    row.appendChild(notesTd);

    return row;
}

// -------------------------------
// Add Row
// -------------------------------
addBtn.addEventListener("click", () => {
    if (!isOwner) return;
    const row = buildRow();
    tableBody.appendChild(row);
    scheduleSave();
});

// -------------------------------
// Image Upload (resized + compressed before saving)
// -------------------------------
function loadImage(input) {
    if (!isOwner) return;

    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (e) {
        const tempImg = new Image();

        tempImg.onload = function () {
            const resizedDataUrl = resizeImage(tempImg);

            const box = input.nextElementSibling;
            box.innerHTML = "";

            const img = document.createElement("img");
            img.src = resizedDataUrl;
            img.className = "photo-preview";

            img.onclick = function (ev) {
                ev.stopPropagation();
                previewImage(resizedDataUrl);
            };

            box.appendChild(img);
            scheduleSave();
        };

        tempImg.src = e.target.result;
    };

    reader.readAsDataURL(file);
}

function resizeImage(img) {
    let { width, height } = img;

    if (width > height && width > MAX_IMAGE_DIMENSION) {
        height *= MAX_IMAGE_DIMENSION / width;
        width = MAX_IMAGE_DIMENSION;
    } else if (height > MAX_IMAGE_DIMENSION) {
        width *= MAX_IMAGE_DIMENSION / height;
        height = MAX_IMAGE_DIMENSION;
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, width, height);

    return canvas.toDataURL("image/jpeg", 0.7);
}

// -------------------------------
// Image Preview
// -------------------------------
function previewImage(src) {
    const win = window.open("", "_blank");

    win.document.write(`
    <html>
    <head>
        <title>Image Preview</title>
    </head>

    <body style="
        margin:0;
        background:#111;
        display:flex;
        justify-content:center;
        align-items:center;
        height:100vh;
    ">

        <img src="${src}"
        style="
            max-width:95%;
            max-height:95%;
            border-radius:15px;
        ">

    </body>
    </html>
    `);
}

// -------------------------------
// Serialize current table -> array of row objects
// -------------------------------
function serializeRows() {
    const rows = [];

    tableBody.querySelectorAll("tr").forEach(row => {
        const cells = row.children;
        const photoImg = cells[0].querySelector("img");
        const selects = row.querySelectorAll("select");

        rows.push({
            photo: photoImg ? photoImg.src : "",
            character: cells[1].textContent.trim(),
            krea: selects[0] ? selects[0].value : "",
            klein: selects[1] ? selects[1].value : "",
            zturbo: selects[2] ? selects[2].value : "",
            link: cells[5].textContent.trim(),
            notes: cells[6].textContent.trim()
        });
    });

    return rows;
}

// -------------------------------
// Render rows (used for both Firestore updates and auth state toggles)
// -------------------------------
function render(rows) {
    tableBody.innerHTML = "";
    rows.forEach(data => tableBody.appendChild(buildRow(data)));
}

// -------------------------------
// Save to Firestore (debounced so we don't write on every keystroke)
// Only ever triggered from owner-only interactions, but double-check here too.
// -------------------------------
function scheduleSave() {
    if (!isOwner) return;
    setSyncStatus("saving", "saving…");
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveData, 800);
}

function saveData() {
    if (!isOwner) return;
    const rows = serializeRows();
    const json = JSON.stringify(rows);
    docRef.set({ rows, updatedAt: firebase.firestore.FieldValue.serverTimestamp() })
        .then(() => {
            lastSyncedJSON = json;
            setSyncStatus("saved", "saved");
        })
        .catch(err => {
            console.error("Save failed:", err);
            setSyncStatus("error", "save failed");
        });
}

function setSyncStatus(state, text) {
    syncStatus.dataset.state = state;
    syncStatus.innerHTML = `<span class="dot"></span>${text}`;
}

// -------------------------------
// Live sync: listen for changes (including from other users)
// -------------------------------
docRef.onSnapshot({ includeMetadataChanges: true }, (doc) => {
    // hasPendingWrites is true for the optimistic local echo of OUR OWN write.
    // We already have that data in the DOM, so skip re-rendering to avoid
    // wiping out whatever you're currently typing.
    if (doc.metadata.hasPendingWrites) return;

    const incomingRows = doc.exists ? (doc.data().rows || []) : [];
    const incomingJSON = JSON.stringify(incomingRows);

    if (incomingJSON === lastSyncedJSON) {
        // This snapshot is just the server confirming a write we already made
        // (or a load that matches what we already have) - nothing changed,
        // so don't rebuild the table and interrupt anyone mid-typing.
        setSyncStatus("synced", "synced");
        return;
    }

    lastSyncedJSON = incomingJSON;

    if (doc.exists) {
        render(incomingRows);
    } else if (isOwner) {
        // Nothing in the database yet - seed one example row (owner only)
        render([{ character: "Sonam" }]);
        saveData();
    }

    setSyncStatus("synced", "synced");
}, (err) => {
    console.error("Sync error:", err);
    setSyncStatus("error", "offline");
});

// -------------------------------
// Auto Save (text edits) - debounced, owner only (scheduleSave no-ops otherwise)
// -------------------------------
document.addEventListener("input", scheduleSave);
