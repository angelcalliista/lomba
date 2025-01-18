import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-database.js";
import { getAuth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { getFirestore, doc, setDoc, collection, getDoc, getDocs, deleteDoc } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";

const appSettings = {
  apiKey: "AIzaSyA-aE30nZkCN3AkgqzJZJijlAP60pyURiY",
  authDomain: "testing-7cc32.firebaseapp.com",
  databaseURL: "https://testing-7cc32-default-rtdb.firebaseio.com",
  projectId: "testing-7cc32",
  storageBucket: "testing-7cc32.firebasestorage.app",
  messagingSenderId: "1023551489009",
  appId: "1:1023551489009:web:35d81777449f5135fcba50",
  measurementId: "G-CD14WHR67R",
};

// Initialize Firebase
const app = initializeApp(appSettings);
const database = getDatabase(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);
const auth = getAuth(app);

const tableBody = document.getElementById("mahasiswaTbody");

async function fetchMahasiswaData() {
  const mahasiswaCollection = collection(db, "mahasiswa"); // Koleksi "mahasiswa"
  const querySnapshot = await getDocs(mahasiswaCollection);

  const mahasiswaData = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data(); // Ambil data setiap dokumen
    data.uid = doc.id; // Simpan UID dokumen ke dalam data
    mahasiswaData.push(data); // Tambahkan ke array
  });

  console.log("Data mahasiswa berhasil diambil:", mahasiswaData); // Log data untuk debug
  return mahasiswaData; // Kembalikan array data mahasiswa
}

// Saat halaman dimuat
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const mahasiswaData = await fetchMahasiswaData(); // Ambil data mahasiswa dari Firestore
    populateTable(mahasiswaData); // Tampilkan data di tabel
  } catch (error) {
    console.error("Error memuat data mahasiswa:", error);
  }
});

function populateTable(data) {
  const tableBody = document.querySelector("table tbody");

  data.forEach((item) => {
    const row = document.createElement("tr");
    row.setAttribute("data-uid", item.uid); // Tambahkan UID ke atribut data-uid

    const namaCell = document.createElement("td");
    namaCell.textContent = item.name || "-";

    const npmCell = document.createElement("td");
    npmCell.textContent = item.npm || "-";

    const lokerCell = document.createElement("td");
    lokerCell.textContent = "-";

    const actionCell = document.createElement("td");
    actionCell.innerHTML = `
        <button class="reject-btn">TOLAK</button>
        <button class="activate-btn">AKTIVASI</button>
      `;

    // Tambahkan semua cell ke baris
    row.appendChild(npmCell);
    row.appendChild(namaCell);
    row.appendChild(lokerCell);
    row.appendChild(actionCell);
    tableBody.appendChild(row);
  });
}

document.addEventListener("click", (event) => {
  if (event.target.classList.contains("activate-btn")) {
    const row = event.target.closest("tr"); // Ambil baris yang terkait
    const uid = row.dataset.uid; // Ambil UID dari data-uid
    const npm = row.querySelector("td:nth-child(1)").textContent;
    const nama = row.querySelector("td:nth-child(2)").textContent;
    const ttl = row.querySelector("td:nth-child(3)").textContent;
    const alamat = row.querySelector("td:nth-child(4)").textContent;

    // Simpan data mahasiswa sementara (tambahkan UID)
    const selectedMahasiswa = { uid, npm, nama, ttl, alamat };

    // Tampilkan dialog
    const dialog = document.getElementById("activationDialog");
    dialog.style.display = "block";

    // Tambahkan event listener untuk tombol Simpan dan Batal
    handleDialogActions(dialog, selectedMahasiswa);
  }

  if (event.target.classList.contains("reject-btn")) {
    const row = event.target.closest("tr"); // Ambil baris yang terkait
    const uid = row.dataset.uid; // Ambil UID dari data-uid
    const npm = row.querySelector("td:nth-child(1)").textContent;
    const nama = row.querySelector("td:nth-child(2)").textContent;

    // Simpan data mahasiswa sementara (tambahkan UID)
    const selectedMahasiswa = { uid, npm, nama };

    // Tampilkan dialog
    const rejectDialog = document.getElementById("rejectDialog");
    rejectDialog.style.display = "block";

    // Tambahkan event listener untuk tombol konfirmasi dan batal
    handleRejectActions(rejectDialog, selectedMahasiswa);
  }
});

// Diterima
function handleDialogActions(dialog, mahasiswaData) {
  const saveBtn = document.getElementById("saveActivation");
  const cancelBtn = document.getElementById("cancelActivation");

  const saveHandler = async () => {
    const idInput = document.getElementById("activationId").value;

    if (!idInput) {
      alert("ID harus diisi!");
      return;
    }

    try {
      // Validasi data mahasiswa
      if (!mahasiswaData.uid) {
        alert("UID tidak ditemukan. Pastikan data valid.");
        return;
      }

      const aktifCollection = collection(db, "aktif"); // Koleksi "aktif"
      const docRef = doc(aktifCollection, idInput); // Buat referensi dokumen dengan ID yang diinput

      await setDoc(docRef, {
        ...mahasiswaData, // Data mahasiswa yang diambil dari baris tabel
        activatedAt: new Date().toISOString(), // Tambahkan timestamp
        activatedBy: "Admin", // Admin yang mengaktivasi
      });

      // Hapus dokumen dari koleksi mahasiswa
      await deleteDoc(doc(db, "mahasiswa", mahasiswaData.uid));

      // Hapus baris tabel
      const row = document.querySelector(`[data-uid="${mahasiswaData.uid}"]`);
      if (row) row.remove();

      alert("Data berhasil disimpan ke koleksi aktif!");
      dialog.style.display = "none";
    } catch (error) {
      console.error("Error menyimpan data:", error);
      alert("Terjadi kesalahan saat menyimpan data.");
    }

    cleanup();
  };

  const cancelHandler = () => {
    dialog.style.display = "none";
    cleanup();
  };

  saveBtn.addEventListener("click", saveHandler);
  cancelBtn.addEventListener("click", cancelHandler);

  function cleanup() {
    saveBtn.removeEventListener("click", saveHandler);
    cancelBtn.removeEventListener("click", cancelHandler);
    document.getElementById("activationId").value = "";
  }
}

function handleRejectActions(dialog, mahasiswaData) {
  const confirmBtn = document.getElementById("confirmReject");
  const cancelBtn = document.getElementById("cancelReject");

  const confirmHandler = async () => {
    try {
      // Validasi UID
      if (!mahasiswaData.uid) {
        alert("UID tidak ditemukan. Pastikan data valid.");
        return;
      }

      const ditolakCollection = collection(db, "ditolak"); // Koleksi "ditolak"
      const docRef = doc(ditolakCollection, mahasiswaData.uid); // Buat referensi dokumen dengan UID mahasiswa

      // Simpan data ke koleksi "ditolak"
      await setDoc(docRef, {
        ...mahasiswaData, // Data mahasiswa yang diambil dari baris tabel
        rejectedAt: new Date().toISOString(), // Tambahkan timestamp
        rejectedBy: "Admin", // Admin yang menolak
      });

      // Hapus dokumen dari koleksi mahasiswa
      await deleteDoc(doc(db, "mahasiswa", mahasiswaData.uid));

      // Hapus baris tabel
      const row = document.querySelector(`[data-uid="${mahasiswaData.uid}"]`);
      if (row) row.remove();

      alert("Data berhasil disimpan ke koleksi ditolak!");
      dialog.style.display = "none";
    } catch (error) {
      console.error("Error memindahkan data ke koleksi ditolak:", error);
      alert("Terjadi kesalahan saat memindahkan data.");
    }

    cleanup();
  };

  const cancelHandler = () => {
    dialog.style.display = "none";
    cleanup();
  };

  confirmBtn.addEventListener("click", confirmHandler);
  cancelBtn.addEventListener("click", cancelHandler);

  function cleanup() {
    confirmBtn.removeEventListener("click", confirmHandler);
    cancelBtn.removeEventListener("click", cancelHandler);
  }
}

// Kelola Akun
async function fetchAktifData() {
  const aktifCollection = collection(db, "aktif");

  try {
    // Ambil semua dokumen dari koleksi "aktif"
    const aktifSnapshot = await getDocs(aktifCollection);
    const aktifData = [];

    // Iterasi melalui dokumen di koleksi "aktif"
    aktifSnapshot.forEach((doc) => {
      const data = doc.data();
      data.uid = doc.id; // Simpan UID dokumen
      aktifData.push(data); // Tambahkan data ke array
    });

    console.log("Data dari koleksi aktif berhasil diambil:", aktifData);
    return aktifData; // Kembalikan array data
  } catch (error) {
    console.error("Error fetching data from aktif collection:", error);
    throw error;
  }
}

function populateAktifTable(data) {
  const tableBody = document.getElementById("mahasiswaTbody"); // Ambil tbody dengan id aktifTbody

  // Bersihkan isi tabel sebelumnya
  tableBody.innerHTML = "";

  data.forEach((item) => {
    // Buat elemen baris (row)
    const row = document.createElement("tr");
    row.setAttribute("data-id", item.uid); // Tambahkan atribut data-id dengan UID

    // Kolom Nama
    const namaCell = document.createElement("td");
    namaCell.textContent = item.nama || "-";

    // Kolom NPM
    const npmCell = document.createElement("td");
    npmCell.textContent = item.npm || "-";

    // Kolom TTL
    const ttlCell = document.createElement("td");
    ttlCell.textContent = item.ttl || "-";

    // Kolom Alamat
    const alamatCell = document.createElement("td");
    alamatCell.textContent = item.alamat || "-";

    const statusCell = document.createElement("td");
    const statusSpan = document.createElement("span");
    statusSpan.className = "status active";
    statusSpan.textContent = "Active";
    statusSpan.addEventListener("click", () => handleStatusClick(item)); // Tambahkan event listener
    statusCell.appendChild(statusSpan);

    // Tambahkan kolom ke baris
    row.appendChild(namaCell);
    row.appendChild(npmCell);
    row.appendChild(statusCell);

    // Tambahkan baris ke tabel
    tableBody.appendChild(row);
  });
}

function handleStatusClick(mahasiswaData) {
  const dialog = document.getElementById("confirmationDialog");

  if (!dialog) {
    console.error("Dialog tidak ditemukan di DOM.");
    return;
  }

  dialog.style.display = "block";

  const confirmBtn = document.getElementById("confirmDeactivate");
  const cancelBtn = document.getElementById("cancelDeactivate");

  const confirmHandler = async () => {
    try {
      // Ambil referensi dokumen dari koleksi "aktif" berdasarkan UID
      const docRef = doc(db, "aktif", mahasiswaData.uid);

      // Hapus dokumen dari Firestore
      console.log(`Menghapus dokumen dengan UID: ${mahasiswaData.uid}`);
      await deleteDoc(docRef);

      // Hapus baris dari tabel
      const row = document.querySelector(`[data-id="${mahasiswaData.uid}"]`);
      if (row) {
        row.remove();
        console.log(`Baris dengan UID ${mahasiswaData.uid} dihapus dari tabel.`);
      } else {
        console.warn(`Baris dengan UID ${mahasiswaData.uid} tidak ditemukan di tabel.`);
      }

      alert("Status berhasil dinonaktifkan.");
    } catch (error) {
      console.error("Error menghapus data:", error);
      alert("Terjadi kesalahan saat menghapus status.");
    } finally {
      closeDialog();
    }
  };

  const cancelHandler = () => closeDialog();

  confirmBtn.addEventListener("click", confirmHandler);
  cancelBtn.addEventListener("click", cancelHandler);

  function closeDialog() {
    dialog.style.display = "none";
    confirmBtn.removeEventListener("click", confirmHandler);
    cancelBtn.removeEventListener("click", cancelHandler);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  fetchAktifData()
    .then((data) => populateAktifTable(data))
    .catch((error) => console.error("Error loading data:", error));
});

// Firebase references
const statusRef = ref(database, "status");
const lastCardTappedRef = ref(database, "lastCardTapped");

// Function to update HTML element
function updateElement(elementId, data, fallbackMessage) {
  const element = document.getElementById(elementId);

  // Only proceed if the element exists
  if (element) {
    element.textContent = data || fallbackMessage;
  } else {
    console.error(`Element with ID "${elementId}" not found.`);
  }
}

// Listen for "status" updates
onValue(statusRef, (snapshot) => {
  if (snapshot.exists()) {
    updateElement("statusText", snapshot.val(), "No status available");
  } else {
    updateElement("statusText", null, "No data found for 'status'");
  }
});

// Listen for "lastCardTapped" updates
onValue(lastCardTappedRef, (snapshot) => {
  if (snapshot.exists()) {
    updateElement("lastCardTapped", snapshot.val(), "No card tapped");
  } else {
    updateElement("lastCardTapped", null, "No data found for 'lastCardTapped'");
  }
});

document.addEventListener("DOMContentLoaded", function async() {
  const buttonAdmin = document.getElementById("submitLoginAdmin");
  const logoutButton = document.getElementById("logoutAdmin");
  const buttonDaftar = document.getElementById("googleUser");
  const confirmDaftar = document.getElementById("submitDaftar");
  const logOutUser = document.getElementById("logOutUser");

  onAuthStateChanged(auth, (user) => {
    if (user) {
      const isAdmin = localStorage.getItem("isAdmin") === "true";

      if (isAdmin) {
        console.log("Admin login:", {
          uid: user.uid,
          email: user.email,
        });
      } else {
        console.log("User login:", {
          uid: user.uid,
          email: user.email,
        });
      }
    } else {
      console.log("Tidak ada pengguna yang login.");
    }
  });

  if (buttonAdmin) {
    buttonAdmin.addEventListener("click", function (event) {
      event.preventDefault(); // Mencegah submit form default

      const email = document.getElementById("emailAdmin").value.trim();
      const password = document.getElementById("passwordAdmin").value.trim();

      if (!email || !password) {
        console.error("Email dan password tidak boleh kosong.");
        alert("Email dan password tidak boleh kosong.");
        return;
      }

      // Regex sederhana untuk validasi format email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        console.error("Format email tidak valid.");
        alert("Format email tidak valid.");
        return;
      }

      // Firebase Auth
      const auth = getAuth();
      signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          const user = userCredential.user;
          console.log("Login berhasil. User:", user);
          localStorage.setItem("isAdmin", "true");
          window.location.href = "dashboardAdmin.html";
        })
        .catch((error) => {
          console.error("Login gagal:", error.code, error.message);
          alert("Login gagal: " + error.message);
        });
    });
  }
  if (logoutButton) {
    const auth = getAuth();
    logoutButton.addEventListener("click", () => {
      const auth = getAuth();

      console.log("Sebelum signOut:", auth.currentUser);

      signOut(auth)
        .then(() => {
          console.log("Berhasil logout.");
          console.log("Setelah signOut:", auth.currentUser); // Harusnya null
          window.location.href = "loginPageAdmin.html";
        })
        .catch((error) => {
          console.error("Gagal logout:", error);
        });
    });
  }

  if (buttonDaftar) {
    buttonDaftar.addEventListener("click", async () => {
      try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        // Simpan atau perbarui data pengguna ke koleksi `data`
        const userRef = doc(db, "data", user.uid);
        await setDoc(userRef, {
          uid: user.uid,
          name: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          lastLogin: new Date().toISOString(),
        });

        console.log("Login berhasil, data disimpan:", user.uid);

        // Periksa apakah UID pengguna sudah ada di koleksi `aktif`
        const aktifCollection = collection(db, "aktif");
        const aktifSnapshot = await getDocs(aktifCollection);

        let uidFoundInAktif = false;

        aktifSnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.uid === user.uid) {
            uidFoundInAktif = true;
          }
        });

        if (uidFoundInAktif) {
          console.log("UID ditemukan di koleksi aktif. Navigasi ke halaman loker.");
          window.location.href = "./lokerMahasiswa.html";
          return; // Langsung keluar setelah navigasi
        }

        // Ambil dokumen dari koleksi `mahasiswa` berdasarkan UID pengguna
        const mahasiswaRef = doc(db, "mahasiswa", user.uid);
        const mahasiswaDoc = await getDoc(mahasiswaRef);

        if (mahasiswaDoc.exists()) {
          const userData = mahasiswaDoc.data();
          const npm = userData.npm; // Ambil NPM dari data mahasiswa

          if (!npm) {
            console.error("NPM tidak ditemukan untuk pengguna:", user.uid);
            alert("Data Anda tidak valid, hubungi admin.");
            return;
          }

          console.log("NPM pengguna:", npm);
          console.log("UID tidak ditemukan di koleksi aktif. Navigasi ke halaman tunggu.");
          window.location.href = "./waitUser.html";
        } else {
          console.log("Data mahasiswa belum ada. Navigasi ke halaman pendaftaran.");
          window.location.href = "./daftarUser.html";
        }
      } catch (error) {
        console.error("Login gagal:", error.message);
        alert("Terjadi kesalahan saat login. Silakan coba lagi.");
      }
    });
  }

  if (confirmDaftar) {
    confirmDaftar.addEventListener("click", async function (event) {
      event.preventDefault();

      // Ambil UID pengguna yang sedang login
      const user = auth.currentUser;
      if (!user) {
        alert("Anda harus login terlebih dahulu.");
        window.location.href = "./daftarUser.html"; // Redirect jika belum login
        return;
      }

      // Ambil data dari form
      const npm = document.getElementById("NPM").value;
      const name = document.getElementById("nameUser").value;
      const ttl = document.getElementById("TTL").value;
      const alamat = document.getElementById("alamat").value;

      // Validasi input
      if (!npm || !name || !ttl || !alamat) {
        alert("Semua field harus diisi!");
        return;
      }

      try {
        // Referensi dokumen di koleksi mahasiswa
        const mahasiswaRef = doc(db, "mahasiswa", user.uid);

        // Simpan data ke Firestore
        await setDoc(mahasiswaRef, {
          uid: user.uid,
          npm: npm,
          name: name,
          ttl: ttl,
          alamat: alamat,
          createdAt: new Date().toISOString(),
        });

        alert("Data berhasil disimpan!");
        // Arahkan ke halaman waitUser.html
        window.location.href = "./waitUser.html";
      } catch (error) {
        console.error("Error menyimpan data ke Firestore:", error.message);
        alert("Terjadi kesalahan saat menyimpan data.");
      }
    });
  }
  if (logOutUser) {
    logOutUser.addEventListener("click", function (event) {
      event.preventDefault();

      const auth = getAuth();
      auth
        .signOut()
        .then(() => {
          console.log("Logout berhasil!");
          localStorage.removeItem("isLoggedIn"); // Hapus data sesi lokal
          window.location.href = "loginPageUser.html"; // Ganti dengan URL halaman login Anda
        })
        .catch((error) => {
          console.error("Logout gagal:", error.message);
        });
    });
  }
});

// Status card
function updateElementById(elementId, newId, data, fallbackMessage) {
  // Cari elemen dengan ID saat ini (baik elementId atau newId)
  const element = document.getElementById(elementId) || document.getElementById(newId);

  // Hanya lanjutkan jika elemen ditemukan
  if (element) {
    // Perbarui teks status
    const statusText = element.querySelector("#statusText");
    if (statusText) {
      statusText.textContent = data || fallbackMessage;
    }

    // Ganti ID elemen berdasarkan status
    if (data === "Penuh") {
      element.id = newId; // Ubah ID menjadi yang baru (misalnya "cardPenuh")
    } else if (data === "Kosong") {
      element.id = elementId; // Kembali ke ID asli (misalnya "card")
    }
  } else {
    console.error(`Element with ID "${elementId}" or "${newId}" not found.`);
  }
}

// Mendengarkan perubahan status di Firebase
onValue(statusRef, (snapshot) => {
  if (snapshot.exists()) {
    updateElementById("card", "cardPenuh", snapshot.val(), "No status available");
  } else {
    console.warn("No data found for 'status'.");
  }
});

// Last Card User
let isStatusPenuh = false; // Global state untuk status penuh
let lastCardTappedCache = null; // Cache untuk lastCardTapped agar sinkronisasi lebih baik

async function updateDataFromFirestore(lastCardTapped) {
  try {
    const docRef = doc(getFirestore(), "aktif", lastCardTapped); // Referensi dokumen
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();

      // Perbarui elemen HTML dengan data dari Firestore
      updateElement("npm", data.npm || "No NPM available");
      updateElement("nama", data.nama || "No Name available");
      updateElement("ID", lastCardTapped || "No ID available"); // ID = nama dokumen
    } else {
      console.warn(`No document found for ID: ${lastCardTapped}`);
      clearData(); // Hapus data jika dokumen tidak ditemukan
    }
  } catch (error) {
    console.error("Error fetching document:", error);
    clearData(); // Hapus data jika ada error
  }
}

// Fungsi untuk menghapus data dari elemen HTML
function clearData() {
  updateElement("npm", "No NPM available");
  updateElement("nama", "No Name available");
  updateElement("ID", "No ID available");
}

// Fungsi untuk memastikan sinkronisasi update
function safeUpdate(lastCardTapped) {
  if (isStatusPenuh) {
    // Jika status penuh, pastikan data diambil dari Firestore
    if (lastCardTapped !== lastCardTappedCache) {
      lastCardTappedCache = lastCardTapped;
      updateDataFromFirestore(lastCardTapped);
    }
  } else {
    clearData();
  }
}

// Listener untuk status
onValue(statusRef, (snapshot) => {
  const status = snapshot.exists() ? snapshot.val() : null;
  const wasStatusPenuh = isStatusPenuh; // Simpan status sebelumnya
  isStatusPenuh = status === "Penuh";

  updateElement("statusText", status || "No status available");

  // Jika baru berubah menjadi penuh, pastikan data diperbarui
  if (isStatusPenuh && !wasStatusPenuh && lastCardTappedCache) {
    updateDataFromFirestore(lastCardTappedCache);
  }

  // Jika berubah menjadi kosong, hapus data
  if (!isStatusPenuh) {
    clearData();
  }
});

// Listener untuk lastCardTapped
onValue(lastCardTappedRef, (snapshot) => {
  const lastCardTapped = snapshot.exists() ? snapshot.val() : null;

  // Selalu perbarui cache
  lastCardTappedCache = lastCardTapped;

  // Jika status penuh, perbarui data
  if (lastCardTapped) {
    safeUpdate(lastCardTapped);
  } else {
    clearData();
  }
});

// API BLYNK
const API_ON = "https://sgp1.blynk.cloud/external/api/update?token=NPMl11GnkjDQnOgvoDDL8FLaYuPQkqbx&v1=1";
const API_OFF = "https://sgp1.blynk.cloud/external/api/update?token=NPMl11GnkjDQnOgvoDDL8FLaYuPQkqbx&v1=0";

async function controlRelay(apiUrl) {
  try {
    const response = await fetch(apiUrl);
    if (response.ok) {
      console.log("Relay berhasil dikendalikan.");
    } else {
      console.error("Gagal mengendalikan relay:", response.statusText);
    }
  } catch (error) {
    console.error("Error saat mengakses API:", error);
  }
}

// Tambahkan event listener ke tombol
document.getElementById("relayOn").addEventListener("click", (e) => {
  e.preventDefault(); // Mencegah reload halaman
  controlRelay(API_ON);
});

document.getElementById("relayOff").addEventListener("click", (e) => {
  e.preventDefault(); // Mencegah reload halaman
  controlRelay(API_OFF);
});

document.getElementById('year').textContent = new Date().getFullYear();
