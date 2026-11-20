const SUPABASE_URL = "https://sxmsqnjrhylnmmhghztb.supabase.co";
const SUPABASE_KEY = "sb_publishable_Pg4fHfhPk6CsuO29xjpeCQ_IIwthwD6";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

let allCars = [];
let currentCategory = "All";
let allAccounts = [];
let cart = [];


// =====================================
// LOAD CARS
// =====================================

async function loadCars() {
  const { data, error } = await supabaseClient
    .from("cars")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Loading cars failed:", error);
    return;
  }

  allCars = data || [];
  searchCars();
}


// =====================================
// FILTER CARS
// =====================================

function filterCars(category) {
  currentCategory = category;
  searchCars();
}


// =====================================
// SEARCH CARS
// =====================================

function searchCars() {
  const carList = document.getElementById("carList");
  const searchInput = document.getElementById("carSearch");

  if (!carList) return;

  const searchText = searchInput
    ? searchInput.value.toLowerCase().trim()
    : "";

  carList.innerHTML = "";

  const filteredCars = allCars.filter(car => {
    const matchesCategory =
      currentCategory === "All" ||
      (car.category || "Trending Cars") === currentCategory;

    const matchesSearch =
      (car.name || "").toLowerCase().includes(searchText);

    return matchesCategory && matchesSearch;
  });

  filteredCars.forEach(car => {
    const card = document.createElement("div");

    const image = document.createElement("img");
    image.src = car.image_url;
    image.alt = car.name;
    image.loading = "lazy";

    const name = document.createElement("h3");
    name.textContent = car.name;

    const oldPrice = document.createElement("p");
    oldPrice.textContent = "PKR " + car.original_price;
    oldPrice.style.textDecoration = "line-through";

    const price = document.createElement("h3");
    price.textContent = "PKR " + car.price;

    const description = document.createElement("p");
    description.textContent = car.description || "";

    const button = document.createElement("button");
    button.textContent = "ADD TO CART";
    button.onclick = () => addToCart(car);

    card.append(
      image,
      name,
      oldPrice,
      price,
      description,
      button
    );

    carList.appendChild(card);
  });
}


// =====================================
// LOAD CPM ACCOUNTS
// =====================================

async function loadAccounts() {
  const accountList = document.getElementById("accountList");

  if (!accountList) return;

  accountList.innerHTML = "<p>Loading CPM accounts...</p>";

  try {
    const { data, error } = await supabaseClient
      .from("accounts")
      .select("id, name, price, description, video_url, created_at")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    allAccounts = data || [];

    searchAccounts();

  } catch (error) {
    console.error("Loading accounts failed:", error);

    accountList.innerHTML =
      "<p>Unable to load accounts. Please refresh the page.</p>";
  }
}


// =====================================
// SEARCH CPM ACCOUNTS
// =====================================

function searchAccounts() {
  const accountList = document.getElementById("accountList");
  const searchInput = document.getElementById("accountSearch");

  if (!accountList) return;

  const searchText = searchInput
    ? searchInput.value.toLowerCase().trim()
    : "";

  accountList.innerHTML = "";

  const filteredAccounts = allAccounts.filter(account => {
    return (account.name || "")
      .toLowerCase()
      .includes(searchText);
  });

  if (filteredAccounts.length === 0) {
    accountList.innerHTML = "<p>No CPM accounts available.</p>";
    return;
  }

  filteredAccounts.forEach(account => {
    const card = document.createElement("div");
    card.className = "account-card";

    const name = document.createElement("h3");
    name.textContent = account.name;

    const price = document.createElement("h3");
    price.textContent = "PKR " + account.price;

    const description = document.createElement("p");
    description.textContent = account.description || "";

    card.append(name, price, description);

    if (account.video_url) {
      const video = document.createElement("video");

      video.src = account.video_url;
      video.controls = true;
      video.playsInline = true;
      video.preload = "none";

      video.style.width = "100%";
      video.style.height = "180px";
      video.style.objectFit = "contain";
      video.style.background = "#000";

      card.appendChild(video);
    }

    const button = document.createElement("button");

    button.textContent = "ORDER ON WHATSAPP";

    button.onclick = () => {
      orderAccountOnWhatsApp(account.name, account.price);
    };

    card.appendChild(button);
    accountList.appendChild(card);
  });
}


// =====================================
// ACCOUNT WHATSAPP ORDER
// =====================================

function orderAccountOnWhatsApp(name, price) {
  const phone = "923158727583";

  const message =
    `Hello CPMX!\n\nI want this account: ${name}\nPrice: PKR ${price}\n\nPlease send me the payment details.`;

  window.open(
    "https://wa.me/" + phone +
    "?text=" + encodeURIComponent(message),
    "_blank"
  );
}


// =====================================
// CAR WHATSAPP ORDER
// =====================================

function orderOnWhatsApp(carName, carPrice) {
  const phone = "923158727583";

  const message = `Hello CPM REX!

I want to pay for this car: ${carName}
Price: PKR ${carPrice}

Please send me your account details.`;

  window.open(
    `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
    "_blank"
  );
}


// =====================================
// ADD TO CART
// =====================================

function addToCart(car) {
  cart.push(car);
  updateCart();
  alert("Car added to cart!");
}


// =====================================
// SHOW CART
// =====================================

function showCart() {
  const box = document.getElementById("cartBox");

  box.style.display =
    box.style.display === "none" ? "block" : "none";

  updateCart();
}


// =====================================
// UPDATE CART
// =====================================

function updateCart() {
  document.getElementById("cartCount").textContent = cart.length;

  const items = document.getElementById("cartItems");

  const total = cart.reduce(
    (sum, car) => sum + Number(car.price),
    0
  );

  items.innerHTML = "";

  cart.forEach((car, index) => {
    const item = document.createElement("p");

    item.textContent = car.name + " - PKR " + car.price;

    const remove = document.createElement("button");

    remove.textContent = "Remove";

    remove.onclick = () => {
      cart.splice(index, 1);
      updateCart();
    };

    item.appendChild(remove);
    items.appendChild(item);
  });

  document.getElementById("cartTotal").textContent = total;
}


// =====================================
// CHECKOUT CART
// =====================================

function checkoutCart() {
  if (cart.length === 0) {
    alert("Your cart is empty!");
    return;
  }

  const order = cart.map(car =>
    car.name + " - PKR " + car.price
  ).join("\n");

  const total = cart.reduce(
    (sum, car) => sum + Number(car.price),
    0
  );

  const message =
    "Hello CPM REXX!\n\nMy order:\n" +
    order + "\n\nTotal: PKR " + total;

  window.open(
    "https://wa.me/923158727583?text=" +
    encodeURIComponent(message),
    "_blank"
  );
}


// =====================================
// CHOOSE ORDER METHOD
// =====================================

function chooseOrderMethod() {
  if (cart.length === 0) {
    alert("Your cart is empty!");
    return;
  }

  const popup = document.createElement("div");

  popup.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 99999;
  `;

  popup.innerHTML = `
    <div style="
      background: #191919;
      padding: 25px;
      border-radius: 15px;
      text-align: center;
      width: 85%;
      max-width: 350px;
      border: 1px solid #e5b83f;
    ">
      <h2 style="color:#ffd76a; margin-bottom:20px;">
        Choose Order Method
      </h2>

      <button id="zbWhatsApp" style="
        display:block;
        width:100%;
        padding:14px;
        margin-bottom:12px;
        background:#25D366;
        color:white;
        border:0;
        border-radius:8px;
        font-weight:bold;
      ">WhatsApp</button>

      <button id="rexTikTok" style="
        display:block;
        width:100%;
        padding:14px;
        background:#333;
        color:white;
        border:0;
        border-radius:8px;
        font-weight:bold;
      ">TikTok</button>
    </div>
  `;

  document.body.appendChild(popup);

  popup.querySelector("#zbWhatsApp").onclick = function() {
    popup.remove();
    checkoutCart();
  };

  popup.querySelector("#rexTikTok").onclick = function() {
    popup.remove();

    window.open(
      "https://www.tiktok.com/@rexx_cpm",
      "_blank"
    );
  };
}


// =====================================
// PAGE LOAD
// =====================================

document.addEventListener("DOMContentLoaded", () => {
  loadCars();
  loadAccounts();
});
