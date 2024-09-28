const fetch = require('node-fetch');
const apiKey = 'e6a4ae27afa9a21b028fdf84b44d93b6';

exports.handler = async function(event, context) {
    try {
        // Parse the incoming request body
        const params = new URLSearchParams(event.body);
        const customerIdentifier = params.get('customer_identifier');
        const creditsAmount = params.get('credits_amount'); // Credits to redeem or add
        const action = params.get('action'); // Identifies whether adding or redeeming credits

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

        if (action === 'add') {
            // Functionality to add credits

            const pointsEventBody = new URLSearchParams({
                customer_identifier: customerIdentifier,
                source: 'manual',
                credits_amount: creditsAmount,
            }).toString();

            const pointsEventOptions = {
                method: 'POST',
                headers: {
                    'Authorization': apiKey,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: pointsEventBody,
            };

            const pointsEventResponse = await fetch('https://developer-api.rivo.io/merchant_api/v1/points_events', pointsEventOptions);

            if (!pointsEventResponse.ok) {
                const pointsEventError = await pointsEventResponse.text();
                console.error('Rivo API Error while adding credits:', pointsEventError);
                return {
                    statusCode: pointsEventResponse.status,
                    headers: {
                        'Access-Control-Allow-Origin': 'https://berobrewing.com',
                        'Access-Control-Allow-Methods': 'POST, OPTIONS',
                        'Access-Control-Allow-Headers': 'Content-Type',
                    },
                    body: JSON.stringify({ error: `Failed to add credits: ${pointsEventError}` }),
                };
            }

            // Return success for adding credits
            const pointsEventData = await pointsEventResponse.json();
            return {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': 'https://berobrewing.com',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                },
                body: JSON.stringify(pointsEventData),
            };
        } else if (action === 'redeem') {
            // Existing redeem credits functionality

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

            // Step 4: Parse and return success response for redemption
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
        } else {
            return {
                statusCode: 400,
                headers: {
                    'Access-Control-Allow-Origin': 'https://berobrewing.com',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                },
                body: JSON.stringify({ error: 'Invalid action specified' }),
            };
        }

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
