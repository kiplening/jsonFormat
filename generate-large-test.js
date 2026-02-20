// Generate ~100MB test JSON data for performance testing
// Output written to large-test.json (gitignored)
const fs = require('fs');

const USERS = 39000;
const PRODUCTS = 28000;
const ORDERS = 17000;
const EVENTS = 28000;

const COUNTRIES = ['USA', 'UK', 'Canada', 'Australia', 'Germany', 'France', 'Japan', 'Brazil', 'India', 'Spain'];
const THEMES = ['light', 'dark', 'auto', 'high-contrast'];
const LANGS = ['en', 'es', 'fr', 'de', 'ja', 'pt', 'zh', 'ar'];
const CATEGORIES = ['Electronics', 'Clothing', 'Books', 'Home', 'Sports', 'Toys', 'Beauty', 'Food', 'Garden', 'Automotive'];
const STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
const STATES = ['CA', 'NY', 'TX', 'FL', 'WA', 'IL', 'PA', 'OH', 'GA', 'NC'];
const PAY_METHODS = ['credit_card', 'paypal', 'bank_transfer', 'apple_pay', 'google_pay'];
const PAY_STATUSES = ['paid', 'pending', 'failed', 'refunded'];
const EVENT_TYPES = ['page_view', 'click', 'purchase', 'signup', 'logout', 'search', 'add_to_cart', 'checkout'];
const BROWSERS = ['Chrome', 'Firefox', 'Safari', 'Edge', 'Opera'];
const OS_LIST = ['Windows 11', 'macOS 14', 'Ubuntu 22.04', 'iOS 17', 'Android 14'];

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr, i) {
    return arr[i % arr.length];
}

const OUTPUT_FILE = 'large-test.json';
const stream = fs.createWriteStream(OUTPUT_FILE);

let bytesWritten = 0;
function write(str) {
    stream.write(str);
    bytesWritten += Buffer.byteLength(str, 'utf8');
}

console.log('Generating ~100MB test JSON...');
console.time('generation');

write('{\n');
write(`  "metadata": {\n`);
write(`    "version": "2.0.0",\n`);
write(`    "generated_at": "${new Date().toISOString()}",\n`);
write(`    "description": "Large test dataset for JSON formatter performance testing (~100MB)",\n`);
write(`    "record_counts": { "users": ${USERS}, "products": ${PRODUCTS}, "orders": ${ORDERS}, "events": ${EVENTS} }\n`);
write(`  },\n`);

// Users
write(`  "users": [\n`);
for (let i = 0; i < USERS; i++) {
    const user = {
        id: i + 1,
        username: `user_${i + 1}`,
        email: `user${i + 1}@example-domain-${i % 100}.com`,
        full_name: `Test User ${i + 1} Lastname${i % 500}`,
        age: 18 + (i % 60),
        country: pick(COUNTRIES, i),
        phone: `+1-555-${String(randomInt(100, 999))}-${String(randomInt(1000, 9999))}`,
        joined_date: new Date(2018 + (i % 6), i % 12, (i % 28) + 1).toISOString(),
        is_active: i % 3 !== 0,
        role: pick(['user', 'admin', 'moderator', 'guest'], i),
        bio: `This is the bio for user ${i + 1}. They joined from ${pick(COUNTRIES, i)} and enjoy using our platform.`,
        avatar_url: `https://avatars.example.com/user/${i + 1}.png`,
        preferences: {
            theme: pick(THEMES, i),
            language: pick(LANGS, i),
            timezone: `UTC${i % 2 === 0 ? '+' : '-'}${i % 12}`,
            notifications: {
                email: i % 2 === 0,
                sms: i % 3 === 0,
                push: i % 5 === 0,
                newsletter: i % 7 === 0
            },
            privacy: {
                profile_visible: i % 4 !== 0,
                show_email: i % 6 === 0,
                show_location: i % 3 === 0
            }
        },
        address: {
            street: `${randomInt(1, 9999)} ${pick(['Main', 'Oak', 'Pine', 'Elm', 'Cedar', 'Maple'], i)} St`,
            city: `City ${i % 200}`,
            state: pick(STATES, i),
            zip: String(10000 + (i % 89999)).padStart(5, '0'),
            country: pick(COUNTRIES, i)
        },
        stats: {
            login_count: randomInt(0, 5000),
            last_login: new Date(2025, i % 12, (i % 28) + 1).toISOString(),
            total_orders: randomInt(0, 200),
            total_spent: (randomInt(0, 50000) / 100).toFixed(2),
            loyalty_points: randomInt(0, 10000)
        }
    };
    const comma = i < USERS - 1 ? ',' : '';
    write(`    ${JSON.stringify(user)}${comma}\n`);
    if (i % 10000 === 0 && i > 0) process.stdout.write(`  users: ${i}/${USERS}\r`);
}
write(`  ],\n`);
console.log(`  users: ${USERS}/${USERS} done`);

// Products
write(`  "products": [\n`);
for (let i = 0; i < PRODUCTS; i++) {
    const product = {
        id: i + 1,
        sku: `PROD-${String(i + 1).padStart(8, '0')}`,
        name: `${pick(CATEGORIES, i)} Product ${i + 1} — Model ${String.fromCharCode(65 + (i % 26))}${i % 100}`,
        category: pick(CATEGORIES, i),
        subcategory: `Subcategory ${i % 30}`,
        brand: `Brand ${i % 50}`,
        price: (randomInt(99, 99999) / 100).toFixed(2),
        sale_price: i % 5 === 0 ? (randomInt(50, 80000) / 100).toFixed(2) : null,
        currency: 'USD',
        stock: randomInt(0, 1000),
        description: `This is a detailed product description for ${pick(CATEGORIES, i)} Product ${i + 1}. It features high quality materials, excellent craftsmanship, and is suitable for everyday use. Available in multiple variants.`,
        short_description: `Quality ${pick(CATEGORIES, i)} product, model ${i + 1}.`,
        tags: [`tag${i % 20}`, `cat${i % 10}`, pick(CATEGORIES, i).toLowerCase(), `brand${i % 50}`],
        images: [
            `https://images.example.com/products/${i + 1}/main.jpg`,
            `https://images.example.com/products/${i + 1}/alt1.jpg`,
            `https://images.example.com/products/${i + 1}/alt2.jpg`
        ],
        rating: {
            average: (randomInt(30, 50) / 10).toFixed(1),
            count: randomInt(0, 5000),
            breakdown: { 5: randomInt(0, 2000), 4: randomInt(0, 1500), 3: randomInt(0, 800), 2: randomInt(0, 400), 1: randomInt(0, 200) }
        },
        dimensions: {
            width_cm: randomInt(1, 200),
            height_cm: randomInt(1, 200),
            depth_cm: randomInt(1, 200),
            weight_g: randomInt(10, 20000)
        },
        attributes: {
            color: pick(['Red', 'Blue', 'Green', 'Black', 'White', 'Silver', 'Gold'], i),
            material: pick(['Plastic', 'Metal', 'Wood', 'Fabric', 'Glass', 'Leather'], i),
            warranty_months: pick([0, 6, 12, 24, 36], i)
        },
        seo: {
            slug: `product-${i + 1}-${pick(CATEGORIES, i).toLowerCase()}`,
            meta_title: `Buy ${pick(CATEGORIES, i)} Product ${i + 1} Online`,
            meta_description: `Shop our ${pick(CATEGORIES, i)} Product ${i + 1} at the best price. Free shipping available.`
        }
    };
    const comma = i < PRODUCTS - 1 ? ',' : '';
    write(`    ${JSON.stringify(product)}${comma}\n`);
    if (i % 10000 === 0 && i > 0) process.stdout.write(`  products: ${i}/${PRODUCTS}\r`);
}
write(`  ],\n`);
console.log(`  products: ${PRODUCTS}/${PRODUCTS} done`);

// Orders
write(`  "orders": [\n`);
for (let i = 0; i < ORDERS; i++) {
    const itemCount = randomInt(1, 8);
    const items = [];
    for (let j = 0; j < itemCount; j++) {
        items.push({
            product_id: randomInt(1, PRODUCTS),
            sku: `PROD-${String(randomInt(1, PRODUCTS)).padStart(8, '0')}`,
            name: `${pick(CATEGORIES, j)} Product ${j + 1}`,
            quantity: randomInt(1, 10),
            unit_price: (randomInt(99, 29999) / 100).toFixed(2),
            discount: i % 4 === 0 ? (randomInt(5, 30)).toFixed(2) : '0.00',
            tax_rate: '0.08'
        });
    }
    const order = {
        id: i + 1,
        order_number: `ORD-${String(i + 1).padStart(10, '0')}`,
        user_id: randomInt(1, USERS),
        status: pick(STATUSES, i),
        created_at: new Date(2023 + (i % 2), i % 12, (i % 28) + 1).toISOString(),
        updated_at: new Date(2024 + (i % 2), i % 12, (i % 28) + 1).toISOString(),
        items,
        subtotal: (randomInt(1000, 200000) / 100).toFixed(2),
        tax: (randomInt(100, 20000) / 100).toFixed(2),
        shipping_cost: (randomInt(0, 2999) / 100).toFixed(2),
        discount_total: (randomInt(0, 5000) / 100).toFixed(2),
        total: (randomInt(1500, 250000) / 100).toFixed(2),
        currency: 'USD',
        notes: i % 10 === 0 ? `Special instructions for order ${i + 1}. Please handle with care.` : null,
        shipping_address: {
            full_name: `Customer ${i + 1}`,
            street: `${randomInt(1, 9999)} ${pick(['Main', 'Oak', 'Pine', 'Elm', 'Cedar'], i)} Ave`,
            city: `City ${i % 300}`,
            state: pick(STATES, i),
            zip: String(10000 + (i % 89999)).padStart(5, '0'),
            country: 'USA',
            phone: `+1-555-${randomInt(100,999)}-${randomInt(1000,9999)}`
        },
        billing_address: {
            full_name: `Customer ${i + 1}`,
            street: `${randomInt(1, 9999)} ${pick(['Billing', 'Commerce', 'Trade', 'Market', 'Exchange'], i)} Blvd`,
            city: `City ${i % 300}`,
            state: pick(STATES, i),
            zip: String(10000 + (i % 89999)).padStart(5, '0'),
            country: 'USA'
        },
        payment: {
            method: pick(PAY_METHODS, i),
            status: pick(PAY_STATUSES, i),
            transaction_id: `TXN-${String(i + 1).padStart(12, '0')}`,
            processed_at: new Date(2024, i % 12, (i % 28) + 1).toISOString()
        },
        tracking: {
            carrier: pick(['FedEx', 'UPS', 'USPS', 'DHL'], i),
            number: `TRACK${String(i + 1).padStart(15, '0')}`,
            estimated_delivery: new Date(2024, (i + 1) % 12, ((i + 7) % 28) + 1).toISOString().split('T')[0]
        }
    };
    const comma = i < ORDERS - 1 ? ',' : '';
    write(`    ${JSON.stringify(order)}${comma}\n`);
    if (i % 5000 === 0 && i > 0) process.stdout.write(`  orders: ${i}/${ORDERS}\r`);
}
write(`  ],\n`);
console.log(`  orders: ${ORDERS}/${ORDERS} done`);

// Events / activity log
write(`  "events": [\n`);
for (let i = 0; i < EVENTS; i++) {
    const event = {
        id: i + 1,
        event_id: `evt_${Math.random().toString(36).slice(2, 18)}`,
        type: pick(EVENT_TYPES, i),
        user_id: i % 5 === 0 ? null : randomInt(1, USERS),
        session_id: `sess_${Math.random().toString(36).slice(2, 18)}`,
        timestamp: new Date(2025, i % 12, (i % 28) + 1, i % 24, i % 60, i % 60).toISOString(),
        ip_address: `${randomInt(1,254)}.${randomInt(0,255)}.${randomInt(0,255)}.${randomInt(1,254)}`,
        user_agent: `Mozilla/5.0 (${pick(OS_LIST, i)}) ${pick(BROWSERS, i)}/${randomInt(100,130)}.0`,
        page: `/${pick(['home', 'products', 'cart', 'checkout', 'account', 'search', 'category', 'orders'], i)}`,
        referrer: i % 3 === 0 ? `https://search.example.com/?q=product${i % 100}` : null,
        properties: {
            duration_ms: randomInt(50, 30000),
            clicks: randomInt(0, 50),
            scroll_depth: randomInt(0, 100),
            product_id: pick(EVENT_TYPES, i) === 'purchase' ? randomInt(1, PRODUCTS) : null,
            search_query: pick(EVENT_TYPES, i) === 'search' ? `query term ${i % 200}` : null,
            value: pick(EVENT_TYPES, i) === 'purchase' ? (randomInt(500, 50000) / 100).toFixed(2) : null
        },
        geo: {
            country: pick(COUNTRIES, i),
            region: pick(STATES, i),
            city: `City ${i % 150}`
        },
        device: {
            type: pick(['desktop', 'mobile', 'tablet'], i),
            os: pick(OS_LIST, i),
            browser: pick(BROWSERS, i),
            screen: pick(['1920x1080', '1366x768', '390x844', '768x1024', '2560x1440'], i)
        }
    };
    const comma = i < EVENTS - 1 ? ',' : '';
    write(`    ${JSON.stringify(event)}${comma}\n`);
    if (i % 10000 === 0 && i > 0) process.stdout.write(`  events: ${i}/${EVENTS}\r`);
}
write(`  ]\n`);
console.log(`  events: ${EVENTS}/${EVENTS} done`);

write('}\n');

stream.end(() => {
    console.timeEnd('generation');
    const stats = fs.statSync(OUTPUT_FILE);
    const mb = (stats.size / 1024 / 1024).toFixed(1);
    console.log(`\nWrote ${OUTPUT_FILE}: ${mb} MB`);
});
