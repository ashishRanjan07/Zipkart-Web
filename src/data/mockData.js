// Mock data for ZipKart Admin Portal

export const stores = [
  { id: 's1', name: 'HSR Layout Store', code: 'BLR-HSR-01', city: 'Bengaluru', address: '27, 27th Main, HSR Layout', status: 'active', serviceRadius: 5000, maxOrders: 20, activeOrders: 12, opens: '06:00', closes: '23:59', manager: 'Ravi Kumar', phone: '+919900001001', lat: 12.9116, lng: 77.6389 },
  { id: 's2', name: 'Koramangala Store', code: 'BLR-KOR-01', city: 'Bengaluru', address: '80 Feet Rd, Koramangala', status: 'active', serviceRadius: 5000, maxOrders: 20, activeOrders: 7, opens: '06:00', closes: '23:59', manager: 'Sneha Rao', phone: '+919900001002', lat: 12.9352, lng: 77.6245 },
  { id: 's3', name: 'Indiranagar Store', code: 'BLR-IND-01', city: 'Bengaluru', address: '100 Feet Rd, Indiranagar', status: 'active', serviceRadius: 5000, maxOrders: 15, activeOrders: 4, opens: '06:00', closes: '23:59', manager: 'Arjun Nair', phone: '+919900001003', lat: 12.9784, lng: 77.6408 },
  { id: 's4', name: 'Whitefield Store', code: 'BLR-WTF-01', city: 'Bengaluru', address: 'Whitefield Main Rd', status: 'maintenance', serviceRadius: 4000, maxOrders: 10, activeOrders: 0, opens: '06:00', closes: '23:59', manager: 'Priya Sharma', phone: '+919900001004', lat: 12.9698, lng: 77.7500 },
  { id: 's5', name: 'JP Nagar Store', code: 'BLR-JPN-01', city: 'Bengaluru', address: 'JP Nagar 6th Phase', status: 'active', serviceRadius: 5000, maxOrders: 18, activeOrders: 9, opens: '06:00', closes: '23:59', manager: 'Vikram Singh', phone: '+919900001005', lat: 12.8933, lng: 77.5850 },
];

export const partners = [
  { id: 'p1', name: 'Mahesh D', phone: '+919800001001', storeId: 's1', storeName: 'HSR Layout Store', status: 'on_order', vehicleType: 'bike', vehicleNumber: 'KA01AB1234', rating: 4.8, totalOrders: 1203, isActive: true, lastSeen: '2 min ago' },
  { id: 'p2', name: 'Suresh K', phone: '+919800001002', storeId: 's1', storeName: 'HSR Layout Store', status: 'available', vehicleType: 'bike', vehicleNumber: 'KA01CD5678', rating: 4.5, totalOrders: 874, isActive: true, lastSeen: '30 sec ago' },
  { id: 'p3', name: 'Ramesh T', phone: '+919800001003', storeId: 's2', storeName: 'Koramangala Store', status: 'available', vehicleType: 'cycle', vehicleNumber: '', rating: 4.9, totalOrders: 522, isActive: true, lastSeen: '1 min ago' },
  { id: 'p4', name: 'Ganesh P', phone: '+919800001004', storeId: 's2', storeName: 'Koramangala Store', status: 'offline', vehicleType: 'bike', vehicleNumber: 'KA02EF9012', rating: 4.2, totalOrders: 310, isActive: true, lastSeen: '45 min ago' },
  { id: 'p5', name: 'Arun B', phone: '+919800001005', storeId: 's3', storeName: 'Indiranagar Store', status: 'on_order', vehicleType: 'bike', vehicleNumber: 'KA03GH3456', rating: 4.7, totalOrders: 689, isActive: true, lastSeen: '3 min ago' },
  { id: 'p6', name: 'Kiran M', phone: '+919800001006', storeId: 's5', storeName: 'JP Nagar Store', status: 'available', vehicleType: 'bike', vehicleNumber: 'KA05IJ7890', rating: 4.6, totalOrders: 432, isActive: true, lastSeen: '1 min ago' },
  { id: 'p7', name: 'Naveen R', phone: '+919800001007', storeId: 's5', storeName: 'JP Nagar Store', status: 'on_order', vehicleType: 'bike', vehicleNumber: 'KA05KL2345', rating: 4.3, totalOrders: 201, isActive: false, lastSeen: '2 hours ago' },
];

export const users = [
  { id: 'u1', phone: '+919876543210', email: 'aryan@example.com', name: 'Aryan Mehta', walletBalance: 250.00, isActive: true, isVerified: true, referralCode: 'ARYAN12', totalOrders: 42, createdAt: '2024-01-10' },
  { id: 'u2', phone: '+919876543211', email: 'priya@example.com', name: 'Priya Patel', walletBalance: 75.50, isActive: true, isVerified: true, referralCode: 'PRIYA34', totalOrders: 18, createdAt: '2024-02-20' },
  { id: 'u3', phone: '+919876543212', email: 'rohan@example.com', name: 'Rohan Gupta', walletBalance: 0, isActive: true, isVerified: true, referralCode: 'ROHAN56', totalOrders: 7, createdAt: '2024-03-05' },
  { id: 'u4', phone: '+919876543213', email: '', name: 'Sanya Singh', walletBalance: 500.00, isActive: true, isVerified: true, referralCode: 'SANYA78', totalOrders: 65, createdAt: '2023-11-15' },
  { id: 'u5', phone: '+919876543214', email: 'dev@example.com', name: 'Dev Kumar', walletBalance: 120.75, isActive: false, isVerified: false, referralCode: 'DEVKU90', totalOrders: 2, createdAt: '2024-04-01' },
  { id: 'u6', phone: '+919876543215', email: 'ananya@example.com', name: 'Ananya Sharma', walletBalance: 340.00, isActive: true, isVerified: true, referralCode: 'ANASH12', totalOrders: 29, createdAt: '2024-01-28' },
  { id: 'u7', phone: '+919876543216', email: 'karan@example.com', name: 'Karan Verma', walletBalance: 0, isActive: true, isVerified: true, referralCode: 'KARVE34', totalOrders: 11, createdAt: '2024-03-22' },
];

export const orders = [
  { id: 'o1', orderNumber: 'ORD-20240115-000001', userId: 'u1', userName: 'Aryan Mehta', storeId: 's1', storeName: 'HSR Layout', partnerId: 'p1', partnerName: 'Mahesh D', status: 'delivered', subtotal: 380, discountAmount: 30, deliveryFee: 0, walletApplied: 0, totalAmount: 350, couponCode: 'SAVE30', paymentMethod: 'upi', createdAt: '2024-06-05 10:22', deliveredAt: '2024-06-05 10:29', estimatedMinutes: 8, items: [ { name: 'Amul Taaza Milk 1L', qty: 2, price: 62 }, { name: 'Britannia Brown Bread', qty: 1, price: 45 }, { name: 'Parle-G Biscuits 800g', qty: 1, price: 99 } ] },
  { id: 'o2', orderNumber: 'ORD-20240115-000002', userId: 'u2', userName: 'Priya Patel', storeId: 's2', storeName: 'Koramangala', partnerId: 'p3', partnerName: 'Ramesh T', status: 'dispatched', subtotal: 520, discountAmount: 0, deliveryFee: 25, walletApplied: 75, totalAmount: 470, couponCode: '', paymentMethod: 'card', createdAt: '2024-06-05 11:05', deliveredAt: null, estimatedMinutes: 8, items: [ { name: 'Maggi Noodles 12pk', qty: 1, price: 120 }, { name: 'Tropicana Orange 1L', qty: 2, price: 95 } ] },
  { id: 'o3', orderNumber: 'ORD-20240115-000003', userId: 'u4', userName: 'Sanya Singh', storeId: 's1', storeName: 'HSR Layout', partnerId: null, partnerName: null, status: 'picking', subtotal: 210, discountAmount: 0, deliveryFee: 25, walletApplied: 0, totalAmount: 235, couponCode: '', paymentMethod: 'cod', createdAt: '2024-06-05 11:30', deliveredAt: null, estimatedMinutes: 8, items: [ { name: 'Dettol Handwash 200ml', qty: 1, price: 85 }, { name: 'Colgate MaxFresh 150g', qty: 2, price: 62 } ] },
  { id: 'o4', orderNumber: 'ORD-20240115-000004', userId: 'u6', userName: 'Ananya Sharma', storeId: 's3', storeName: 'Indiranagar', partnerId: 'p5', partnerName: 'Arun B', status: 'confirmed', subtotal: 890, discountAmount: 100, deliveryFee: 0, walletApplied: 100, totalAmount: 690, couponCode: 'FLAT100', paymentMethod: 'upi', createdAt: '2024-06-05 11:45', deliveredAt: null, estimatedMinutes: 8, items: [ { name: 'Lay\'s Classic Salted 104g', qty: 3, price: 40 }, { name: 'Coca-Cola 2L', qty: 2, price: 95 }, { name: 'Bourbon Biscuits', qty: 4, price: 30 } ] },
  { id: 'o5', orderNumber: 'ORD-20240115-000005', userId: 'u3', userName: 'Rohan Gupta', storeId: 's5', storeName: 'JP Nagar', partnerId: null, partnerName: null, status: 'cancelled', subtotal: 340, discountAmount: 0, deliveryFee: 25, walletApplied: 0, totalAmount: 365, couponCode: '', paymentMethod: 'upi', createdAt: '2024-06-05 09:10', deliveredAt: null, estimatedMinutes: 8, items: [ { name: 'Fortune Sunflower Oil 1L', qty: 2, price: 145 } ] },
  { id: 'o6', orderNumber: 'ORD-20240114-000087', userId: 'u1', userName: 'Aryan Mehta', storeId: 's1', storeName: 'HSR Layout', partnerId: 'p2', partnerName: 'Suresh K', status: 'delivered', subtotal: 430, discountAmount: 0, deliveryFee: 0, walletApplied: 0, totalAmount: 430, couponCode: '', paymentMethod: 'wallet', createdAt: '2024-06-04 18:10', deliveredAt: '2024-06-04 18:17', estimatedMinutes: 8, items: [ { name: 'Aashirvaad Atta 5kg', qty: 1, price: 290 }, { name: 'Tata Salt 1kg', qty: 2, price: 22 } ] },
  { id: 'o7', orderNumber: 'ORD-20240115-000006', userId: 'u7', userName: 'Karan Verma', storeId: 's2', storeName: 'Koramangala', partnerId: null, partnerName: null, status: 'payment_pending', subtotal: 175, discountAmount: 0, deliveryFee: 25, walletApplied: 0, totalAmount: 200, couponCode: '', paymentMethod: 'upi', createdAt: '2024-06-05 12:00', deliveredAt: null, estimatedMinutes: 8, items: [ { name: 'Nestlé KitKat 4F', qty: 5, price: 35 } ] },
];

export const inventory = [
  { id: 'i1', productId: 'prod1', productName: 'Amul Taaza Milk 1L', sku: 'AMUL-TAAZA-1L', storeId: 's1', storeName: 'HSR Layout', quantity: 48, reserved: 4, price: 62, mrp: 68, discountPct: 9, lowStockAlert: 10, isActive: true },
  { id: 'i2', productId: 'prod2', productName: 'Britannia Brown Bread', sku: 'BRIT-BRNBRD-400', storeId: 's1', storeName: 'HSR Layout', quantity: 7, reserved: 2, price: 45, mrp: 50, discountPct: 10, lowStockAlert: 10, isActive: true },
  { id: 'i3', productId: 'prod3', productName: 'Parle-G Biscuits 800g', sku: 'PARLE-G-800', storeId: 's1', storeName: 'HSR Layout', quantity: 32, reserved: 0, price: 99, mrp: 99, discountPct: 0, lowStockAlert: 10, isActive: true },
  { id: 'i4', productId: 'prod4', productName: 'Fortune Sunflower Oil 1L', sku: 'FORT-SFLOIL-1L', storeId: 's1', storeName: 'HSR Layout', quantity: 0, reserved: 0, price: 145, mrp: 160, discountPct: 9, lowStockAlert: 5, isActive: true },
  { id: 'i5', productId: 'prod5', productName: 'Maggi Noodles 12pk', sku: 'MAGGI-NOOD-12PK', storeId: 's2', storeName: 'Koramangala', quantity: 24, reserved: 1, price: 120, mrp: 130, discountPct: 8, lowStockAlert: 10, isActive: true },
  { id: 'i6', productId: 'prod1', productName: 'Amul Taaza Milk 1L', sku: 'AMUL-TAAZA-1L', storeId: 's2', storeName: 'Koramangala', quantity: 3, reserved: 2, price: 62, mrp: 68, discountPct: 9, lowStockAlert: 10, isActive: true },
  { id: 'i7', productId: 'prod6', productName: 'Aashirvaad Atta 5kg', sku: 'AASH-ATTA-5KG', storeId: 's1', storeName: 'HSR Layout', quantity: 18, reserved: 1, price: 290, mrp: 320, discountPct: 9, lowStockAlert: 5, isActive: true },
  { id: 'i8', productId: 'prod7', productName: 'Tropicana Orange 1L', sku: 'TROP-OJ-1L', storeId: 's2', storeName: 'Koramangala', quantity: 12, reserved: 2, price: 95, mrp: 110, discountPct: 14, lowStockAlert: 5, isActive: true },
  { id: 'i9', productId: 'prod8', productName: 'Dettol Handwash 200ml', sku: 'DETT-HW-200', storeId: 's3', storeName: 'Indiranagar', quantity: 6, reserved: 1, price: 85, mrp: 95, discountPct: 11, lowStockAlert: 10, isActive: true },
  { id: 'i10', productId: 'prod9', productName: 'Coca-Cola 2L', sku: 'COKE-2L', storeId: 's3', storeName: 'Indiranagar', quantity: 0, reserved: 0, price: 95, mrp: 105, discountPct: 10, lowStockAlert: 5, isActive: true },
];

export const products = [
  { id: 'prod1', sku: 'AMUL-TAAZA-1L', name: 'Amul Taaza Milk 1L', slug: 'amul-taaza-milk-1l', brand: 'Amul', category: 'Dairy & Eggs', unit: '1 L', mrp: 68, rating: 4.6, reviewCount: 1243, isActive: true, imageUrl: '' },
  { id: 'prod2', sku: 'BRIT-BRNBRD-400', name: 'Britannia Brown Bread 400g', slug: 'britannia-brown-bread', brand: 'Britannia', category: 'Bakery', unit: '400 g', mrp: 50, rating: 4.3, reviewCount: 521, isActive: true, imageUrl: '' },
  { id: 'prod3', sku: 'PARLE-G-800', name: 'Parle-G Biscuits 800g', slug: 'parle-g-biscuits-800g', brand: 'Parle', category: 'Snacks', unit: '800 g', mrp: 99, rating: 4.7, reviewCount: 2104, isActive: true, imageUrl: '' },
  { id: 'prod4', sku: 'FORT-SFLOIL-1L', name: 'Fortune Sunflower Oil 1L', slug: 'fortune-sunflower-oil-1l', brand: 'Fortune', category: 'Oils & Ghee', unit: '1 L', mrp: 160, rating: 4.2, reviewCount: 389, isActive: true, imageUrl: '' },
  { id: 'prod5', sku: 'MAGGI-NOOD-12PK', name: 'Maggi Noodles 12-pack', slug: 'maggi-noodles-12-pack', brand: 'Nestlé', category: 'Instant Food', unit: '12 × 70 g', mrp: 130, rating: 4.5, reviewCount: 1876, isActive: true, imageUrl: '' },
  { id: 'prod6', sku: 'AASH-ATTA-5KG', name: 'Aashirvaad Atta 5kg', slug: 'aashirvaad-atta-5kg', brand: 'Aashirvaad', category: 'Staples', unit: '5 kg', mrp: 320, rating: 4.6, reviewCount: 912, isActive: true, imageUrl: '' },
  { id: 'prod7', sku: 'TROP-OJ-1L', name: 'Tropicana Orange Juice 1L', slug: 'tropicana-orange-1l', brand: 'Tropicana', category: 'Juices & Beverages', unit: '1 L', mrp: 110, rating: 4.4, reviewCount: 603, isActive: true, imageUrl: '' },
  { id: 'prod8', sku: 'DETT-HW-200', name: 'Dettol Handwash 200ml', slug: 'dettol-handwash-200ml', brand: 'Dettol', category: 'Personal Care', unit: '200 ml', mrp: 95, rating: 4.8, reviewCount: 1432, isActive: true, imageUrl: '' },
  { id: 'prod9', sku: 'COKE-2L', name: 'Coca-Cola 2L', slug: 'coca-cola-2l', brand: 'Coca-Cola', category: 'Juices & Beverages', unit: '2 L', mrp: 105, rating: 4.6, reviewCount: 877, isActive: true, imageUrl: '' },
  { id: 'prod10', sku: 'COLG-MXF-150', name: 'Colgate MaxFresh 150g', slug: 'colgate-maxfresh-150g', brand: 'Colgate', category: 'Personal Care', unit: '150 g', mrp: 72, rating: 4.5, reviewCount: 2301, isActive: false, imageUrl: '' },
];

export const categories = [
  { id: 'c1', name: 'Dairy & Eggs', slug: 'dairy-eggs', productCount: 42, isActive: true },
  { id: 'c2', name: 'Bakery', slug: 'bakery', productCount: 28, isActive: true },
  { id: 'c3', name: 'Snacks', slug: 'snacks', productCount: 95, isActive: true },
  { id: 'c4', name: 'Oils & Ghee', slug: 'oils-ghee', productCount: 31, isActive: true },
  { id: 'c5', name: 'Instant Food', slug: 'instant-food', productCount: 54, isActive: true },
  { id: 'c6', name: 'Staples', slug: 'staples', productCount: 67, isActive: true },
  { id: 'c7', name: 'Juices & Beverages', slug: 'juices-beverages', productCount: 48, isActive: true },
  { id: 'c8', name: 'Personal Care', slug: 'personal-care', productCount: 83, isActive: true },
];

export const payments = [
  { id: 'pay1', orderId: 'o1', orderNumber: 'ORD-20240115-000001', userId: 'u1', userName: 'Aryan Mehta', gateway: 'razorpay', gatewayPaymentId: 'pay_ABC123', method: 'upi', amount: 350, currency: 'INR', status: 'captured', createdAt: '2024-06-05 10:22', failureReason: null, refundAmount: null },
  { id: 'pay2', orderId: 'o2', orderNumber: 'ORD-20240115-000002', userId: 'u2', userName: 'Priya Patel', gateway: 'razorpay', gatewayPaymentId: 'pay_DEF456', method: 'card', amount: 470, currency: 'INR', status: 'captured', createdAt: '2024-06-05 11:05', failureReason: null, refundAmount: null },
  { id: 'pay3', orderId: 'o3', orderNumber: 'ORD-20240115-000003', userId: 'u4', userName: 'Sanya Singh', gateway: 'cod', gatewayPaymentId: null, method: 'cod', amount: 235, currency: 'INR', status: 'pending', createdAt: '2024-06-05 11:30', failureReason: null, refundAmount: null },
  { id: 'pay4', orderId: 'o4', orderNumber: 'ORD-20240115-000004', userId: 'u6', userName: 'Ananya Sharma', gateway: 'razorpay', gatewayPaymentId: 'pay_GHI789', method: 'upi', amount: 690, currency: 'INR', status: 'captured', createdAt: '2024-06-05 11:45', failureReason: null, refundAmount: null },
  { id: 'pay5', orderId: 'o5', orderNumber: 'ORD-20240115-000005', userId: 'u3', userName: 'Rohan Gupta', gateway: 'razorpay', gatewayPaymentId: 'pay_JKL012', method: 'upi', amount: 365, currency: 'INR', status: 'refunded', createdAt: '2024-06-05 09:10', failureReason: null, refundAmount: 365 },
  { id: 'pay6', orderId: 'o6', orderNumber: 'ORD-20240114-000087', userId: 'u1', userName: 'Aryan Mehta', gateway: 'zipkart_wallet', gatewayPaymentId: null, method: 'zipkart_wallet', amount: 430, currency: 'INR', status: 'captured', createdAt: '2024-06-04 18:10', failureReason: null, refundAmount: null },
  { id: 'pay7', orderId: 'o7', orderNumber: 'ORD-20240115-000006', userId: 'u7', userName: 'Karan Verma', gateway: 'razorpay', gatewayPaymentId: null, method: 'upi', amount: 200, currency: 'INR', status: 'failed', createdAt: '2024-06-05 12:00', failureReason: 'Payment declined by bank', refundAmount: null },
];

export const coupons = [
  { id: 'cp1', code: 'SAVE30', type: 'flat', value: 30, minOrderValue: 200, maxDiscount: null, maxUsesTotal: 1000, maxUsesPerUser: 1, usedCount: 423, applicableTo: 'all', validFrom: '2024-06-01', validUntil: '2024-06-30', isActive: true },
  { id: 'cp2', code: 'FLAT100', type: 'flat', value: 100, minOrderValue: 500, maxDiscount: null, maxUsesTotal: 500, maxUsesPerUser: 1, usedCount: 198, applicableTo: 'all', validFrom: '2024-06-01', validUntil: '2024-06-15', isActive: true },
  { id: 'cp3', code: 'NEWUSER50', type: 'flat', value: 50, minOrderValue: 150, maxDiscount: null, maxUsesTotal: null, maxUsesPerUser: 1, usedCount: 1021, applicableTo: 'new_user', validFrom: '2024-01-01', validUntil: '2024-12-31', isActive: true },
  { id: 'cp4', code: 'DAIRY20', type: 'percentage', value: 20, minOrderValue: 100, maxDiscount: 60, maxUsesTotal: 200, maxUsesPerUser: 2, usedCount: 87, applicableTo: 'category', validFrom: '2024-06-05', validUntil: '2024-06-10', isActive: true },
  { id: 'cp5', code: 'FREEDEL', type: 'free_delivery', value: 25, minOrderValue: 99, maxDiscount: null, maxUsesTotal: null, maxUsesPerUser: 3, usedCount: 3402, applicableTo: 'all', validFrom: '2024-01-01', validUntil: '2024-12-31', isActive: true },
  { id: 'cp6', code: 'SUMMER25', type: 'percentage', value: 25, minOrderValue: 300, maxDiscount: 150, maxUsesTotal: 300, maxUsesPerUser: 1, usedCount: 300, applicableTo: 'all', validFrom: '2024-05-01', validUntil: '2024-05-31', isActive: false },
];

export const flashSales = [
  { id: 'fs1', title: 'Weekend Milk Bonanza', storeId: null, storeName: 'All Stores', startsAt: '2024-06-08 10:00', endsAt: '2024-06-08 13:00', status: 'scheduled', items: [ { productName: 'Amul Taaza Milk 1L', flashPrice: 45, originalPrice: 62, discountPct: 27, maxQtyTotal: 500, maxQtyPerUser: 2, soldCount: 0 } ] },
  { id: 'fs2', title: 'Snack Attack Friday', storeId: 's1', storeName: 'HSR Layout Store', startsAt: '2024-06-07 18:00', endsAt: '2024-06-07 20:00', status: 'active', items: [ { productName: 'Lay\'s Classic 104g', flashPrice: 25, originalPrice: 40, discountPct: 38, maxQtyTotal: 300, maxQtyPerUser: 2, soldCount: 189 }, { productName: 'Parle-G 800g', flashPrice: 75, originalPrice: 99, discountPct: 24, maxQtyTotal: 200, maxQtyPerUser: 2, soldCount: 132 } ] },
  { id: 'fs3', title: 'Monsoon Essentials', storeId: null, storeName: 'All Stores', startsAt: '2024-06-01 12:00', endsAt: '2024-06-01 14:00', status: 'ended', items: [ { productName: 'Dettol Handwash 200ml', flashPrice: 60, originalPrice: 85, discountPct: 29, maxQtyTotal: 400, maxQtyPerUser: 2, soldCount: 400 } ] },
];

export const notifications = [
  { id: 'n1', userId: 'u1', userName: 'Aryan Mehta', channel: 'push', status: 'delivered', eventType: 'order.confirmed', title: 'Order Confirmed!', body: 'Your order #ORD-000001 has been confirmed.', platform: 'android', queuedAt: '2024-06-05 10:23', sentAt: '2024-06-05 10:23', deliveredAt: '2024-06-05 10:23' },
  { id: 'n2', userId: 'u1', userName: 'Aryan Mehta', channel: 'sms', status: 'delivered', eventType: 'order.confirmed', title: null, body: 'ZipKart: Your order ORD-000001 is confirmed. Delivered in 8 min!', platform: null, queuedAt: '2024-06-05 10:23', sentAt: '2024-06-05 10:23', deliveredAt: '2024-06-05 10:24' },
  { id: 'n3', userId: 'u2', userName: 'Priya Patel', channel: 'push', status: 'sent', eventType: 'delivery.dispatched', title: 'Partner on the way!', body: 'Ramesh T is heading your way. ETA: 4 min', platform: 'ios', queuedAt: '2024-06-05 11:10', sentAt: '2024-06-05 11:10', deliveredAt: null },
  { id: 'n4', userId: 'u3', userName: 'Rohan Gupta', channel: 'push', status: 'failed', eventType: 'otp', title: null, body: 'Your ZipKart OTP is 847291', platform: 'android', queuedAt: '2024-06-05 09:05', sentAt: null, deliveredAt: null },
  { id: 'n5', userId: 'u4', userName: 'Sanya Singh', channel: 'push', status: 'delivered', eventType: 'flash_sale', title: 'Snack Attack is LIVE!', body: 'Up to 38% off on your favourite snacks. Shop now!', platform: 'ios', queuedAt: '2024-06-07 18:00', sentAt: '2024-06-07 18:00', deliveredAt: '2024-06-07 18:01' },
  { id: 'n6', userId: 'u5', userName: 'Dev Kumar', channel: 'push', status: 'failed', eventType: 'order.confirmed', title: 'Order Confirmed!', body: 'Your order has been confirmed.', platform: 'android', queuedAt: '2024-06-05 10:30', sentAt: null, deliveredAt: null },
];

export const auditLogs = [
  { id: 'al1', userId: 'u1', userName: 'Aryan Mehta', action: 'login', resourceType: null, resourceId: null, ip: '203.0.113.10', createdAt: '2024-06-05 10:20', metadata: { platform: 'android', deviceId: 'dev-uuid-001' } },
  { id: 'al2', userId: 'u1', userName: 'Aryan Mehta', action: 'order_placed', resourceType: 'order', resourceId: 'o1', ip: '203.0.113.10', createdAt: '2024-06-05 10:22', metadata: { orderNumber: 'ORD-20240115-000001', amount: 350 } },
  { id: 'al3', userId: 'u1', userName: 'Aryan Mehta', action: 'payment_completed', resourceType: 'payment', resourceId: 'pay1', ip: '203.0.113.10', createdAt: '2024-06-05 10:22', metadata: { method: 'upi', amount: 350 } },
  { id: 'al4', userId: 'u3', userName: 'Rohan Gupta', action: 'otp_sent', resourceType: null, resourceId: null, ip: '198.51.100.22', createdAt: '2024-06-05 09:05', metadata: { purpose: 'login', phone: '+919876543212' } },
  { id: 'al5', userId: 'u3', userName: 'Rohan Gupta', action: 'otp_verified', resourceType: null, resourceId: null, ip: '198.51.100.22', createdAt: '2024-06-05 09:06', metadata: { purpose: 'login' } },
  { id: 'al6', userId: 'u5', userName: 'Dev Kumar', action: 'device_registered', resourceType: 'device', resourceId: null, ip: '10.0.0.55', createdAt: '2024-06-05 08:45', metadata: { platform: 'android', deviceModel: 'Samsung Galaxy S21' } },
  { id: 'al7', userId: 'u2', userName: 'Priya Patel', action: 'logout', resourceType: null, resourceId: null, ip: '192.0.2.15', createdAt: '2024-06-04 22:30', metadata: { deviceId: 'dev-uuid-002' } },
  { id: 'al8', userId: 'u4', userName: 'Sanya Singh', action: 'refund_requested', resourceType: 'order', resourceId: 'o5', ip: '203.0.113.88', createdAt: '2024-06-05 12:00', metadata: { reason: 'wrong item delivered', amount: 365 } },
];

export const appConfigs = [
  { key: 'min_app_version', value: { ios: '1.0.0', android: '1.0.0' }, description: 'Force update below this version', isActive: true, updatedAt: '2024-05-01' },
  { key: 'free_delivery_threshold', value: 99, description: 'Cart value above which delivery is free (₹)', isActive: true, updatedAt: '2024-04-15' },
  { key: 'delivery_fee', value: 25, description: 'Standard delivery fee (₹)', isActive: true, updatedAt: '2024-04-15' },
  { key: 'flash_sale_enabled', value: true, description: 'Master toggle for flash sale feature', isActive: true, updatedAt: '2024-06-01' },
  { key: 'max_cart_items', value: 50, description: 'Maximum distinct items in cart', isActive: true, updatedAt: '2024-03-10' },
  { key: 'maintenance_mode', value: false, description: 'Show maintenance screen if true', isActive: true, updatedAt: '2024-06-05' },
  { key: 'max_cart_qty_per_item', value: 10, description: 'Max quantity per item in cart', isActive: true, updatedAt: '2024-03-10' },
  { key: 'otp_expiry_seconds', value: 600, description: 'OTP validity window in seconds', isActive: true, updatedAt: '2024-01-01' },
  { key: 'referral_reward_amount', value: 50, description: 'Wallet credit given on successful referral (₹)', isActive: true, updatedAt: '2024-02-20' },
];

// Chart data
export const orderTrendData = [
  { date: 'Jun 1', orders: 312, gmv: 109200, delivered: 298 },
  { date: 'Jun 2', orders: 287, gmv: 100450, delivered: 279 },
  { date: 'Jun 3', orders: 401, gmv: 140350, delivered: 389 },
  { date: 'Jun 4', orders: 365, gmv: 127750, delivered: 354 },
  { date: 'Jun 5', orders: 210, gmv: 73500, delivered: 188 },
  { date: 'Jun 6', orders: 178, gmv: 62300, delivered: 154 },
  { date: 'Jun 7', orders: 328, gmv: 114800, delivered: 312 },
];

export const orderFunnelData = [
  { stage: 'App Opens', value: 12430 },
  { stage: 'Products Viewed', value: 8920 },
  { stage: 'Cart Created', value: 4210 },
  { stage: 'Checkout Started', value: 2840 },
  { stage: 'Payment Initiated', value: 2190 },
  { stage: 'Orders Placed', value: 2050 },
];

export const deliverySLAData = [
  { range: '< 6 min', count: 312 },
  { range: '6-8 min', count: 841 },
  { range: '8-10 min', count: 267 },
  { range: '10-15 min', count: 89 },
  { range: '> 15 min', count: 22 },
];

export const paymentMethodData = [
  { method: 'UPI', value: 58 },
  { method: 'Card', value: 20 },
  { method: 'Wallet', value: 12 },
  { method: 'COD', value: 7 },
  { method: 'NetBanking', value: 3 },
];

export const notificationHealthData = [
  { date: 'Jun 1', push: 94, sms: 99, email: 97 },
  { date: 'Jun 2', push: 92, sms: 99, email: 96 },
  { date: 'Jun 3', push: 95, sms: 98, email: 97 },
  { date: 'Jun 4', push: 91, sms: 99, email: 95 },
  { date: 'Jun 5', push: 88, sms: 97, email: 98 },
  { date: 'Jun 6', push: 93, sms: 99, email: 97 },
  { date: 'Jun 7', push: 90, sms: 98, email: 96 },
];
