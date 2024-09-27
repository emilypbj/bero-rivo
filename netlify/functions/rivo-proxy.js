const apiKey = 'e6a4ae27afa9a21b028fdf84b44d93b6'

exports.handler = async function(event, context) {
    const fetch = await import('node-fetch'); // Dynamic import for ES modules
  
    const params = new URLSearchParams(event.body);
    const customerId = params.get('customer_id');
    const pointsAmount = params.get('points_amount');
  
    const options = {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: `customer_id=${customerId}&points_amount=${pointsAmount}`
  };

  try {
    const response = await fetch('https://developer-api.rivo.io/merchant_api/v1/points_redemptions', options);
    const data = await response.json();

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': 'https://berobrewing.com', // Replace with your Shopify domain
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error('Error redeeming points:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': 'https://berobrewing.com', // Replace with your Shopify domain
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: 'Error redeeming points'
    };
  }
};