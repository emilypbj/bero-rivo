const apiKey = 'e6a4ae27afa9a21b028fdf84b44d93b6';  // Your actual API key

exports.handler = async function(event, context) {
    try {
        const fetch = await import('node-fetch'); // Dynamic import for ES modules
    
        const params = new URLSearchParams(event.body);
        const customerId = params.get('customer_id');
        const pointsAmount = params.get('points_amount');

        // Validate input
        if (!customerId || !pointsAmount) {
            return {
                statusCode: 400, // Bad Request if inputs are missing
                headers: {
                    'Access-Control-Allow-Origin': 'https://berobrewing.com',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                },
                body: JSON.stringify({
                    error: 'Missing required parameters: customer_id or points_amount',
                }),
            };
        }

        // API request to Rivo
        const options = {
            method: 'POST',
            headers: {
                'Authorization': apiKey,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `customer_id=${customerId}&points_amount=${pointsAmount}`
        };

        // Send request to Rivo API
        const response = await fetch('https://developer-api.rivo.io/merchant_api/v1/points_redemptions', options);
        
        // Check if the response is OK
        if (!response.ok) {
            const errorDetails = await response.text(); // Capture error details from the response
            console.error('Rivo API Error:', errorDetails);
            return {
                statusCode: response.status,
                headers: {
                    'Access-Control-Allow-Origin': 'https://berobrewing.com',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                },
                body: JSON.stringify({
                    error: `Failed to redeem points: ${errorDetails}`,
                }),
            };
        }

        // Parse the API response data
        const data = await response.json();
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': 'https://berobrewing.com',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
            body: JSON.stringify(data),
        };
    } catch (error) {
        console.error('Function Error:', error); // Log the full error details
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': 'https://berobrewing.com',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
            body: JSON.stringify({
                error: 'An internal server error occurred.',
                details: error.message, // Include the error message
            }),
        };
    }
};
