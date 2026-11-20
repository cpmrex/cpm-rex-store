const SUPABASE_URL = "https://sxmsqnjrhylnmmhghztb.supabase.co";
const SUPABASE_KEY = "sb_publishable_Pg4fHfhPk6CsuO29xjpeCQ_IIwthwD6";

const db = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

// ==============================
// ADMIN LOGIN
// ==============================

async function loginAdmin() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { data, error } = await db.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    document.getElementById("message").textContent = error.message;
    return;
  }

  document.getElementById("login").hidden = true;
  document.getElementById("dashboard").hidden = false;

  loadCars();
  loadAccounts();
}


// ==============================
// ADD A CAR
// ==============================

async function addCar() {
  const name = document.getElementById("carName").value.trim();
  const price = Number(document.getElementById("carPrice").value);
  const originalPrice = Number(document.getElementById("originalPrice").value);
  const description = document.getElementById("carDescription").value.trim();
  const category = document.getElementById("carCategory").value;
  const file = document.getElementById("carImageFile").files[0];

  if (!name || !price || !originalPrice || !file) {
    alert("Enter car name, both prices and select a photo.");
    return;
  }

  if (originalPrice < price) {
    alert("Real price must be greater than or equal to discounted price.");
    return;
  }

  const extension = file.name.split(".").pop();
  const filePath = `${Date.now()}.${extension}`;

  const { error: uploadError } = await db.storage
    .from("car-images")
    .upload(filePath, file, {
      contentType: file.type,
      upsert: false
    });

  if (uploadError) {
    alert("Photo upload failed: " + uploadError.message);
    return;
  }

  const { data: imageData } = db.storage
    .from("car-images")
    .getPublicUrl(filePath);

  const { error } = await db.from("cars").insert([{
    name,
    price,
    original_price: originalPrice,
    description,
    category,
    image_url: imageData.publicUrl,
    is_active: true
  }]);

  if (error) {
    alert("Car save failed: " + error.message);
    return;
  }

  alert("Car and both prices added successfully!");

  document.getElementById("carName").value = "";
  document.getElementById("carPrice").value = "";
  document.getElementById("originalPrice").value = "";
  document.getElementById("carDescription").value = "";
  document.getElementById("carImageFile").value = "";

  loadCars();
}


// ==============================
// SHOW CARS
// ==============================

async function loadCars() {
  const { data, error } = await db
    .from("cars")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    alert(error.message);
    return;
  }

  const container = document.getElementById("adminCars");
  container.innerHTML = "";

  data.forEach(car => {
    const item = document.createElement("div");
    item.textContent = `${car.name} - PKR ${car.price}`;

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "DELETE";
    deleteButton.onclick = () => deleteCar(car.id);

    item.appendChild(deleteButton);
    container.appendChild(item);
  });
}


// ==============================
// DELETE A CAR
// ==============================

async function deleteCar(id) {
  if (!confirm("Delete this car?")) return;

  const { error } = await db
    .from("cars")
    .delete()
    .eq("id", id);

  if (error) {
    alert(error.message);
    return;
  }

  loadCars();
}


// ==============================
// ADD ACCOUNT WITH VIDEO
// ==============================

async function addAccount() {
  const name = document.getElementById("accountName").value.trim();
  const price = Number(document.getElementById("accountPrice").value);
  const description = document.getElementById("accountDescription").value.trim();
  const file = document.getElementById("accountVideoFile").files[0];

  if (!name || !price || !file) {
    alert("Enter account name, price and select a video.");
    return;
  }

  if (price <= 0) {
    alert("Enter a valid account price.");
    return;
  }

  if (!file.type.startsWith("video/")) {
    alert("Please select a valid video file.");
    return;
  }

  const extension = file.name.split(".").pop();
  const filePath = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;

  // Upload video to Supabase Storage

  const { error: uploadError } = await db.storage
    .from("account-videos")
    .upload(filePath, file, {
      contentType: file.type,
      upsert: false
    });

  if (uploadError) {
    alert("Video upload failed: " + uploadError.message);
    return;
  }

  // Get public video URL

  const { data: videoData } = db.storage
    .from("account-videos")
    .getPublicUrl(filePath);

  // Save account in database

  const { error } = await db
    .from("accounts")
    .insert([{
      name,
      price,
      description,
      video_url: videoData.publicUrl,
      is_active: true
    }]);

  if (error) {
    alert("Account save failed: " + error.message);
    return;
  }

  alert("Account added successfully!");

  document.getElementById("accountName").value = "";
  document.getElementById("accountPrice").value = "";
  document.getElementById("accountDescription").value = "";
  document.getElementById("accountVideoFile").value = "";

  loadAccounts();
}


// ==============================
// LOAD ACCOUNTS IN ADMIN PANEL
// ==============================

async function loadAccounts() {
  const container = document.getElementById("adminAccounts");

  const { data, error } = await db
    .from("accounts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    container.textContent = "Could not load accounts: " + error.message;
    return;
  }

  container.innerHTML = "";

  if (!data || data.length === 0) {
    container.textContent = "No accounts added yet.";
    return;
  }

  data.forEach(account => {
    const item = document.createElement("div");

    const name = document.createElement("h3");
    name.textContent = account.name;

    const price = document.createElement("p");
    price.textContent = `PKR ${account.price}`;

    const description = document.createElement("p");
    description.textContent = account.description || "";

    item.appendChild(name);
    item.appendChild(price);
    item.appendChild(description);

    if (account.video_url) {
      const video = document.createElement("video");
      video.src = account.video_url;
      video.controls = true;
      video.playsInline = true;
      video.preload = "metadata";
      video.style.width = "100%";
      video.style.maxWidth = "350px";

      item.appendChild(video);
    }

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "DELETE ACCOUNT";
    deleteButton.onclick = () => deleteAccount(account.id, account.video_url);

    item.appendChild(deleteButton);
    container.appendChild(item);
  });
}


// ==============================
// DELETE ACCOUNT
// ==============================

async function deleteAccount(id, videoUrl) {
  if (!confirm("Delete this account?")) return;

  // Delete account record

  const { error } = await db
    .from("accounts")
    .delete()
    .eq("id", id);

  if (error) {
    alert("Account delete failed: " + error.message);
    return;
  }

  // Delete its video from Storage

  if (videoUrl) {
    const marker = "/account-videos/";
    const videoPath = videoUrl.split(marker)[1];

    if (videoPath) {
      const { error: storageError } = await db.storage
        .from("account-videos")
        .remove([decodeURIComponent(videoPath)]);

      if (storageError) {
        alert("Account deleted, but video cleanup failed: " + storageError.message);
      }
    }
  }

  alert("Account deleted successfully!");

  loadAccounts();
}


// ==============================
// LOGOUT
// ==============================

async function logoutAdmin() {
  await db.auth.signOut();
  location.reload();
}
