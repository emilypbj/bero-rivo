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
    const response = await fetch.default('https://developer-api.rivo.io/merchant_api/v1/points_redemptions', options); // Use fetch.default
    const data = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error('Error redeeming points:', error);
    return {
      statusCode: 500,
      body: 'Error redeeming points'
    };
  }
};