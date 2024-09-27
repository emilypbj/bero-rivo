const fetch = require('node-fetch');
const apiKey = 'e6a4ae27afa9a21b028fdf84b44d93b6'; // Your actual API key

exports.handler = async function(event, context) {
    try {
        // Parse the incoming request body
        const params = new URLSearchParams(event.body);
        const customerIdentifier = params.get('customer_identifier');
        const creditsAmount = params.get('credits_amount'); // Credits to redeem

        // Validate input parameters
        if (!customerIdentifier || !creditsAmount) {
            return {
                statusCode: 400,
                headers: {
                    'Access-Control-Allow-Origin': 'https://berobrewing.com',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                },
                body: JSON.stringify({ error: 'Missing required parameters: customer_identifier or credits_amount' }),
            };
        }

        // Step 1: Fetch all rewards to get the reward_id for "credits"
        const rewardOptions = {
            method: 'GET',
            headers: {
                'Authorization': apiKey,
                'Content-Type': 'application/json',
            }
        };

        const rewardResponse = await fetch('https://developer-api.rivo.io/merchant_api/v1/rewards', rewardOptions);

        if (!rewardResponse.ok) {
            const rewardError = await rewardResponse.text();
            console.error('Rivo API Error while fetching rewards:', rewardError);
            return {
                statusCode: rewardResponse.status,
                headers: {
                    'Access-Control-Allow-Origin': 'https://berobrewing.com',
                    'Access-Control-Allow-Methods': 'GET, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                },
                body: JSON.stringify({ error: `Failed to fetch rewards: ${rewardError}` }),
            };
        }

        // Step 2: Parse rewards and find the reward with "credits" as the source
        const rewardsData = await rewardResponse.json();
        const reward = rewardsData.data.find(r => r.attributes.source === 'credits' && r.attributes.enabled);

        if (!reward || !reward.id) {
            return {
                statusCode: 404,
                headers: {
                    'Access-Control-Allow-Origin': 'https://berobrewing.com',
                    'Access-Control-Allow-Methods': 'GET, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                },
                body: JSON.stringify({ error: 'No suitable reward found for credits' }),
            };
        }
        const rewardId = reward.id;  // Extract the reward_id

        // Step 3: Redeem credits using the found reward_id
        const redemptionBody = `customer_identifier=${customerIdentifier}&reward_id=${rewardId}&credits_amount=${creditsAmount}`;

        const redemptionOptions = {
            method: 'POST',
            headers: {
                'Authorization': apiKey,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: redemptionBody,
        };

        const redemptionResponse = await fetch('https://developer-api.rivo.io/merchant_api/v1/points_redemptions', redemptionOptions);

        // Handle non-OK responses
        if (!redemptionResponse.ok) {
            const redemptionErrorDetails = await redemptionResponse.text();
            console.error('Rivo API Error while redeeming credits:', redemptionErrorDetails);
            return {
                statusCode: redemptionResponse.status,
                headers: {
                    'Access-Control-Allow-Origin': 'https://berobrewing.com',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                },
                body: JSON.stringify({ error: `Failed to redeem credits: ${redemptionErrorDetails}` }),
            };
        }

        // Step 4: Parse and return success response
        const redemptionData = await redemptionResponse.json();
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': 'https://berobrewing.com',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
            body: JSON.stringify(redemptionData),
        };

    } catch (error) {
        console.error('Function Error:', error);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': 'https://berobrewing.com',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
            body: JSON.stringify({ error: 'An internal server error occurred.', details: error.message }),
        };
    }
};