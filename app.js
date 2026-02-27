// Open Modal
document.getElementById("btnAddCustomer").onclick = function () {
    document.getElementById("customerModal").style.display = "block";
};

// Close Modal
document.getElementById("closeModal").onclick = function () {
    document.getElementById("customerModal").style.display = "none";
};

// Click outside to close
window.onclick = function(event) {
    const modal = document.getElementById("customerModal");
    if (event.target === modal) {
        modal.style.display = "none";
    }
};

// Form submit (demo)
document.getElementById("customerForm").onsubmit = function (e) {
    e.preventDefault();
    alert("Customer saved successfully (frontend only)!");
    document.getElementById("customerModal").style.display = "none";
};
