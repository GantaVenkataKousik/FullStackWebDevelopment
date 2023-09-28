const fromPrice = document.querySelector(".price")
function populateCurrencyDropdowns(data) {
    const fromCurrencyDropdown = document.getElementById('from_currency');
    const toCurrencyDropdown = document.getElementById('to_currency');

    for (const currency in data) {
        const val = document.createElement('option');
        val.value = currency;
        val.textContent = currency;

        fromCurrencyDropdown.appendChild(val.cloneNode(true));
        toCurrencyDropdown.appendChild(val);
    }
}


function convertCurrency() {
    const fromCurrency = document.getElementById('from_currency').value;
    const toCurrency = document.getElementById('to_currency').value;
    const amount = parseFloat(document.getElementById('amount').textContent);

    fetch(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`)
        .then(response => response.json())
        .then(data => {
            const exchangeRate = data.rates[toCurrency];
            if (exchangeRate) {
                const convertedAmount = (amount * exchangeRate).toFixed(2);
                document.getElementById('amount').textContent = `${convertedAmount} ${toCurrency}`;
                document.getElementById('vals').textContent=""
            } else {
                document.getElementById('amount').textContent = 'Invalid currency selection';
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

document.getElementById('convert').addEventListener('click', convertCurrency);

fetch('https://api.exchangerate-api.com/v4/latest/USD')
    .then(response => response.json())
    .then(data => {
        populateCurrencyDropdowns(data.rates)
    })
    .catch(error => {
        console.error('Error:', error);
    });

