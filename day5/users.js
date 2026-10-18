
const loadButton = document.getElementById("load-users");
const filterInput = document.getElementById("filter-input");
const statusMessage = document.getElementById("status");
const usersList = document.getElementById("users-list");


let users = [];

let usersLoaded = false;

async function loadUsers() {

    loadButton.disabled = true;


    statusMessage.textContent = "Loading users...";


    usersList.replaceChildren();

    try {

        const response = await fetch(
            "https://jsonplaceholder.typicode.com/users"
        );


        if (!response.ok) {
            throw new Error(
                `HTTP error! Status: ${response.status}`
            );
        }

  
        const data = await response.json();


        users = data;

        usersLoaded = true;


        renderUsers(users);


        statusMessage.textContent =
            `Successfully loaded ${users.length} users.`;

    } catch (error) {

        users = [];
        usersLoaded = false;

        usersList.replaceChildren();

        statusMessage.textContent =
            "Error loading users. Please check your connection and try again.";

        console.error("Failed to load users:", error);

    } finally {

        loadButton.disabled = false;
    }
}



function renderUsers(list) {

    usersList.replaceChildren();


    if (list.length === 0) {
        statusMessage.textContent =
            "No users match your filter.";

        return;
    }


    list.forEach(function (user) {

        const listItem = document.createElement("li");
        listItem.className = "user-card";

        const name = document.createElement("h2");
        name.textContent = user.name;


        const email = document.createElement("p");
        email.textContent = `Email: ${user.email}`;


        const city = document.createElement("p");
        city.textContent = `City: ${user.address.city}`;


        const company = document.createElement("p");
        company.textContent = `Company: ${user.company.name}`;


        listItem.append(
            name,
            email,
            city,
            company
        );


        usersList.appendChild(listItem);
    });
}



loadButton.addEventListener("click", loadUsers);



filterInput.addEventListener("input", function () {
 
    if (!usersLoaded) {
        return;
    }

 
    const searchText = filterInput.value
        .trim()
        .toLowerCase();

 
    const filteredUsers = users.filter(function (user) {
        return user.name
            .toLowerCase()
            .includes(searchText);
    });

 
    renderUsers(filteredUsers);
});