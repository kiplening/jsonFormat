// Generate large test JSON data (not tracked by git due to .gitignore)
const fs = require('fs');

function generateTestData() {
    const data = {
        metadata: {
            version: "1.0.0",
            generated_at: new Date().toISOString(),
            total_records: 5000,
            description: "Fake test data for JSON formatter performance testing"
        },
        users: [],
        products: [],
        orders: [],
        analytics: {
            daily_stats: []
        }
    };

    // Generate 2000 fake users
    for (let i = 0; i < 2000; i++) {
        data.users.push({
            id: i + 1,
            username: `user_${i + 1}`,
            email: `user${i + 1}@example.com`,
            full_name: `Test User ${i + 1}`,
            age: 18 + (i % 60),
            country: ['USA', 'UK', 'Canada', 'Australia', 'Germany'][i % 5],
            joined_date: new Date(2020 + (i % 4), i % 12, (i % 28) + 1).toISOString(),
            is_active: i % 3 !== 0,
            preferences: {
                theme: ['light', 'dark', 'auto'][i % 3],
                language: ['en', 'es', 'fr', 'de'][i % 4],
                notifications: {
                    email: i % 2 === 0,
                    sms: i % 3 === 0,
                    push: i % 5 === 0
                }
            },
            stats: {
                login_count: Math.floor(Math.random() * 1000),
                last_login: new Date(2024, 0, (i % 28) + 1).toISOString(),
                total_orders: Math.floor(Math.random() * 50)
            }
        });
    }

    // Generate 1500 fake products
    for (let i = 0; i < 1500; i++) {
        data.products.push({
            id: i + 1,
            sku: `PROD-${String(i + 1).padStart(6, '0')}`,
            name: `Product ${i + 1}`,
            category: ['Electronics', 'Clothing', 'Books', 'Home', 'Sports'][i % 5],
            price: (Math.random() * 999 + 1).toFixed(2),
            currency: 'USD',
            stock: Math.floor(Math.random() * 500),
            description: `This is a test product description for product ${i + 1}. It contains various features and specifications.`,
            tags: [`tag${i % 10}`, `category${i % 5}`, `special${i % 3}`],
            rating: {
                average: (Math.random() * 2 + 3).toFixed(1),
                count: Math.floor(Math.random() * 1000)
            },
            dimensions: {
                width: Math.floor(Math.random() * 100),
                height: Math.floor(Math.random() * 100),
                depth: Math.floor(Math.random() * 100),
                weight: Math.floor(Math.random() * 1000)
            }
        });
    }

    // Generate 1000 fake orders
    for (let i = 0; i < 1000; i++) {
        const itemCount = Math.floor(Math.random() * 5) + 1;
        const items = [];

        for (let j = 0; j < itemCount; j++) {
            items.push({
                product_id: Math.floor(Math.random() * 1500) + 1,
                quantity: Math.floor(Math.random() * 5) + 1,
                price: (Math.random() * 299 + 1).toFixed(2)
            });
        }

        data.orders.push({
            id: i + 1,
            order_number: `ORD-${String(i + 1).padStart(8, '0')}`,
            user_id: Math.floor(Math.random() * 2000) + 1,
            status: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'][i % 5],
            created_at: new Date(2024, i % 12, (i % 28) + 1).toISOString(),
            items: items,
            total: (Math.random() * 999 + 10).toFixed(2),
            shipping_address: {
                street: `${Math.floor(Math.random() * 9999)} Test Street`,
                city: `City ${i % 100}`,
                state: ['CA', 'NY', 'TX', 'FL', 'WA'][i % 5],
                zip: String(10000 + (i % 89999)).padStart(5, '0'),
                country: 'USA'
            },
            payment: {
                method: ['credit_card', 'paypal', 'bank_transfer'][i % 3],
                status: ['paid', 'pending', 'failed'][i % 3]
            }
        });
    }

    // Generate 365 days of analytics
    for (let i = 0; i < 365; i++) {
        data.analytics.daily_stats.push({
            date: new Date(2024, 0, i + 1).toISOString().split('T')[0],
            visitors: Math.floor(Math.random() * 10000) + 1000,
            page_views: Math.floor(Math.random() * 50000) + 5000,
            new_users: Math.floor(Math.random() * 500) + 50,
            revenue: (Math.random() * 50000 + 5000).toFixed(2),
            bounce_rate: (Math.random() * 0.5 + 0.2).toFixed(3),
            avg_session_duration: Math.floor(Math.random() * 300) + 60
        });
    }

    return data;
}

console.log('Generating test data...');
const testData = generateTestData();
const jsonString = JSON.stringify(testData, null, 2);

console.log(`Generated ${(jsonString.length / 1024 / 1024).toFixed(2)} MB of test data`);
console.log(`Total lines: ${jsonString.split('\n').length}`);

// Note: This file won't be saved due to .gitignore
// Just output to console for verification
console.log('\nFirst 500 characters:');
console.log(jsonString.substring(0, 500));
