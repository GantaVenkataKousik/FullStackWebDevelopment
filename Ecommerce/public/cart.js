const plusButtons = document.querySelectorAll(".plus-btn");
const minusButtons = document.querySelectorAll(".minus-btn");



function updateTotalAmount() {
    const totalAmountElement = document.getElementById("total-amount");

    let totalAmount = 0;

    // Loop through each product to calculate its contribution to the total amount
    plusButtons.forEach((plusButton) => {
        const productId = plusButton.getAttribute("data-product");
        const countElement = document.querySelector(`.count[data-product="${productId}"]`);
        const priceElement = document.querySelector(`.price[data-product="${productId}"]`);

        const count = parseInt(countElement.textContent);
        const price = parseFloat(priceElement.textContent.substring(1));

        totalAmount += price;

        console.log(totalAmount);
    });
    // Update the total amount element with the calculated total
    totalAmountElement.textContent = `$${totalAmount.toFixed(2)}`;
}

updateTotalAmount();
// Add event listeners to the plus buttons
plusButtons.forEach((plusButton) => {
    plusButton.addEventListener("click", (event) => {
        // Get the product ID from the data-product attribute
        const productId = event.target.getAttribute("data-product");

        // Find the corresponding count element
        const countElement = document.querySelector(`.count[data-product="${productId}"]`);
        const price = document.querySelector(`.price[data-product="${productId}"]`);
        console.log(price);

        // Increment the count
        let count = parseInt(countElement.textContent);
        let amount = parseInt(price.textContent.substring(1));

        let originalprice = amount / count;

        count++;
        
        amount = originalprice*count;
        console.log(amount);

        countElement.textContent = count;
        price.textContent = '$'+amount;
                
 
        updateTotalAmount();
    });
    
});

// Add event listeners to the minus buttons
minusButtons.forEach((minusButton) => {
    minusButton.addEventListener("click", (event) => {
        // Get the product ID from the data-product attribute
        const productId = event.target.getAttribute("data-product");

        // Find the corresponding count element
        const countElement = document.querySelector(`.count[data-product="${productId}"]`);
        const price = document.querySelector(`.price[data-product="${productId}"]`);

        // Decrement the count, but ensure it doesn't go below 1
        let count = parseInt(countElement.textContent);
        if (count > 1) {
            let count = parseInt(countElement.textContent);
        let amount = parseInt(price.textContent.substring(1));
        
        let originalprice = amount / count;

        count--;
        
        
        
        amount = originalprice*count;
        console.log(amount);

        countElement.textContent = count;
        price.textContent = '$'+amount;
        
       
        
        updateTotalAmount();
        
        }
    });
});


document.querySelector(".checkout").addEventListener("click", function () {
    // Redirect to the "thank you" route
    window.location.href = "/thankyou"; // Change "/thank-you" to your actual route
  });