// This file contains additional functions for the real estate platform
// It extends the existing functionality without modifying the original design

// Function to create sample data if the database is empty
async function createSampleDataIfNeeded() {
    try {
        // Check if properties table has data
        const { data: properties, error: propertiesError } = await supabase
            .from('properties')
            .select('id')
            .limit(1);
            
        if (propertiesError) {
            console.error('Error checking properties:', propertiesError);
            return;
        }
        
        // If no properties exist, create sample data
        if (!properties || properties.length === 0) {
            console.log('Creating sample properties...');
            
            const sampleProperties = [
                {
                    title: 'فيلا فاخرة للبيع في حي الروضة',
                    description: 'فيلا فاخرة للبيع في حي الروضة، مساحة الأرض 320 متر مربع، مكونة من دورين، تحتوي على 4 غرف نوم و3 حمامات وصالة كبيرة ومطبخ مجهز بأحدث الأجهزة. الفيلا تتميز بتصميمها العصري وتشطيبها الفاخر، وتطل على شارع رئيسي مع موقفين للسيارات. الموقع ممتاز وقريب من الخدمات والمرافق العامة مثل المدارس والمستشفيات والمراكز التجارية.',
                    price: 1250000,
                    type: 'sale',
                    property_type: 'villa',
                    area: 320,
                    bedrooms: 4,
                    bathrooms: 3,
                    city: 'الرياض',
                    district: 'حي الروضة',
                    image_urls: [
                        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1176&q=80',
                        'https://images.unsplash.com/photo-1600566753052-d6f4e67238e1?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
                        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80'
                    ],
                    features: [
                        'تكييف مركزي',
                        'نظام إنذار ضد الحريق',
                        'أنظمة أمنية',
                        'خزانات',
                        'سخانات مياه',
                        'حديقة خاصة',
                        'مواقف سيارات',
                        'غرفة خادمة'
                    ],
                    parking: 2,
                    floors: 2,
                    year_built: 2022,
                    owner_name: 'محمد أحمد',
                    owner_phone: '+966 55 123 4567',
                    owner_email: 'mohamed.ahmed@example.com',
                    owner_avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80'
                },
                {
                    title: 'شقة عصرية للإيجار في حي النخيل',
                    description: 'شقة عصرية للإيجار في حي النخيل، مساحة 120 متر مربع، تحتوي على غرفتي نوم وحمامين وصالة ومطبخ مجهز. الشقة تقع في طابق وسطي في مبنى حديث مع مصعد وأمن 24 ساعة. قريبة من جميع الخدمات والمرافق العامة.',
                    price: 35000,
                    type: 'rent',
                    property_type: 'apartment',
                    area: 120,
                    bedrooms: 2,
                    bathrooms: 2,
                    city: 'الرياض',
                    district: 'حي النخيل',
                    image_urls: [
                        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
                        'https://images.unsplash.com/photo-1502672260266-7c2437e4c8a7?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80'
                    ],
                    features: [
                        'تكييف مركزي',
                        'مصعد',
                        'أمن 24 ساعة',
                        'موقف سيارة',
                        'مطبخ مجهز'
                    ],
                    parking: 1,
                    floors: 5,
                    year_built: 2020,
                    owner_name: 'سارة محمد',
                    owner_phone: '+966 50 987 6543',
                    owner_email: 'sara.mohamed@example.com',
                    owner_avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80'
                },
                {
                    title: 'منزل واسع للبيع في حي الياسمين',
                    description: 'منزل واسع للبيع في حي الياسمين، مساحة 450 متر مربع، مكون من دور واحد مع ملحق، يحتوي على 5 غرف نوم و4 حمامات وصالتين ومطبخ كبير. المنزل يقع في حي هادئ مع حديقة خاصة واسعة وموقفين للسيارات. مثالي للعائلات الكبيرة.',
                    price: 2200000,
                    type: 'sale',
                    property_type: 'house',
                    area: 450,
                    bedrooms: 5,
                    bathrooms: 4,
                    city: 'جدة',
                    district: 'حي الياسمين',
                    image_urls: [
                        'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
                        'https://images.unsplash.com/photo-1568605114967-3135b7b7a5b3?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80'
                    ],
                    features: [
                        'تكييف مركزي',
                        'حديقة خاصة',
                        'ملحق',
                        'مواقف سيارات',
                        'مطبخ كبير',
                        'صالتين'
                    ],
                    parking: 2,
                    floors: 1,
                    year_built: 2019,
                    owner_name: 'عبدالله خالد',
                    owner_phone: '+966 53 456 7890',
                    owner_email: 'abdullah.khaled@example.com',
                    owner_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80'
                },
                {
                    title: 'أرض تجارية مميزة للبيع',
                    description: 'أرض تجارية مميزة للبيع في موقع استراتيجي على شارع رئيسي، مساحة 1000 متر مربع. الأرض مناسبة لبناء مجمع تجاري أو برج سكني. جميع التراخيص جاهزة والخدمات متوفرة.',
                    price: 5000000,
                    type: 'sale',
                    property_type: 'land',
                    area: 1000,
                    city: 'الدمام',
                    district: 'حي الشاطئ',
                    image_urls: [
                        'https://images.unsplash.com/photo-1502672260266-7c2437e4c8a7?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80'
                    ],
                    features: [
                        'موقع استراتيجي',
                        'شارع رئيسي',
                        'تراخيص جاهزة',
                        'خدمات متوفرة'
                    ],
                    owner_name: 'شركة العقارات المتخصصة',
                    owner_phone: '+966 13 246 8135',
                    owner_email: 'info@realestate.com',
                    owner_avatar: 'https://images.unsplash.com/photo-1560250099-5ecaa868a27a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80'
                },
                {
                    title: 'مكتب فاخر للإيجار في مركز الأعمال',
                    description: 'مكتب فاخر للإيجار في مركز الأعمال الرئيسي، مساحة 80 متر مربع. المكتب مجهز بالكامل ويقع في طابق مرتفع مع إطلالة رائعة على المدينة. يوجد مواقف سيارات في الطابق السفلي.',
                    price: 60000,
                    type: 'rent',
                    property_type: 'commercial',
                    area: 80,
                    city: 'الرياض',
                    district: 'مركز الملك عبدالله',
                    image_urls: [
                        'https://images.unsplash.com/photo-1497366754035-f200968a6e72?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80'
                    ],
                    features: [
                        'مجهز بالكامل',
                        'إطلالة رائعة',
                        'موقف سيارة',
                        'مركز أعمال',
                        'أمن 24 ساعة'
                    ],
                    parking: 1,
                    floors: 15,
                    year_built: 2018,
                    owner_name: 'مكاتب الأعمال الراقية',
                    owner_phone: '+966 11 456 7890',
                    owner_email: 'info@premiumoffices.com',
                    owner_avatar: 'https://images.unsplash.com/photo-1557862921-37829c790f19?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80'
                }
            ];
            
            // Insert sample properties
            const { error: insertError } = await supabase
                .from('properties')
                .insert(sampleProperties);
                
            if (insertError) {
                console.error('Error creating sample properties:', insertError);
            } else {
                console.log('Sample properties created successfully');
            }
        }
    } catch (err) {
        console.error('Error in createSampleDataIfNeeded:', err);
    }
}

// Function to show owner dashboard
async function showOwnerDashboard() {
    if (!isOwner) {
        alert('غير مصرح لك بالوصول إلى هذه الصفحة');
        return;
    }
    
    // Hide other pages
    hideAllPages();
    document.getElementById('owner-dashboard').style.display = 'block';
    
    // Update breadcrumb
    updateBreadcrumb([
        { text: 'الرئيسية', onclick: 'showHomePage()' },
        { text: 'لوحة التحكم' }
    ]);
    
    // Load owner properties
    await loadOwnerProperties();
}

// Load owner properties
async function loadOwnerProperties() {
    const grid = document.getElementById('owner-properties-grid');
    grid.innerHTML = '';
    
    const { data: properties, error } = await supabase
        .from('properties')
        .select('*')
        .eq('owner_id', currentUser.id);
        
    if (error) {
        console.error('Error loading properties:', error);
        return;
    }
    
    if (properties.length === 0) {
        grid.innerHTML = '<p>لا توجد عقارات مضافة بعد.</p>';
        return;
    }
    
    properties.forEach(property => {
        const card = createPropertyCard(property);
        
        // Add edit and delete buttons
        const actions = document.createElement('div');
        actions.className = 'property-actions';
        actions.innerHTML = `
            <button class="btn btn-primary" onclick="showEditPropertyForm('${property.id}')">تعديل</button>
            <button class="btn btn-danger" onclick="deleteProperty('${property.id}')">حذف</button>
        `;
        
        card.appendChild(actions);
        grid.appendChild(card);
    });
}

// Show owner properties
function showOwnerProperties() {
    // Switch to properties tab
    document.querySelectorAll('.dashboard-tab').forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');
    
    document.getElementById('owner-properties').style.display = 'block';
    document.getElementById('owner-orders').style.display = 'none';
    document.getElementById('owner-stats').style.display = 'none';
    
    // Load properties
    loadOwnerProperties();
}

// Show owner orders
async function showOwnerOrders() {
    // Switch to orders tab
    document.querySelectorAll('.dashboard-tab').forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');
    
    document.getElementById('owner-properties').style.display = 'none';
    document.getElementById('owner-orders').style.display = 'block';
    document.getElementById('owner-stats').style.display = 'none';
    
    // Load orders
    await loadOwnerOrders();
}

// Load owner orders
async function loadOwnerOrders() {
    const container = document.getElementById('owner-orders-container');
    container.innerHTML = '';
    
    // Get orders for properties owned by the current user
    const { data: orders, error } = await supabase
        .from('orders')
        .select(`
            id,
            status,
            created_at,
            user_id,
            properties (
                id,
                title,
                price,
                type
            ),
            profiles (
                full_name,
                email
            )
        `)
        .eq('properties.owner_id', currentUser.id);
        
    if (error) {
        console.error('Error loading orders:', error);
        return;
    }
    
    if (orders.length === 0) {
        container.innerHTML = '<p>لا توجد طلبات.</p>';
        return;
    }
    
    orders.forEach(order => {
        const orderCard = document.createElement('div');
        orderCard.className = 'order-card';
        orderCard.innerHTML = `
            <h3>${order.properties.title}</h3>
            <p>السعر: ${order.properties.price.toLocaleString()} ريال</p>
            <p>الطالب: ${order.profiles.full_name} (${order.profiles.email})</p>
            <p>تاريخ الطلب: ${new Date(order.created_at).toLocaleDateString()}</p>
            <p>الحالة: ${getStatusText(order.status)}</p>
            ${order.status === 'pending' ? `
                <div>
                    <button class="btn btn-success" onclick="updateOrderStatus('${order.id}', 'approved')">موافقة</button>
                    <button class="btn btn-danger" onclick="updateOrderStatus('${order.id}', 'rejected')">رفض</button>
                </div>
            ` : ''}
        `;
        container.appendChild(orderCard);
    });
}

// Show owner statistics
async function showOwnerStats() {
    // Switch to stats tab
    document.querySelectorAll('.dashboard-tab').forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');
    
    document.getElementById('owner-properties').style.display = 'none';
    document.getElementById('owner-orders').style.display = 'none';
    document.getElementById('owner-stats').style.display = 'block';
    
    // Load statistics
    await loadOwnerStats();
}

// Load owner statistics
async function loadOwnerStats() {
    // Get order statistics
    const { data: orders, error } = await supabase
        .from('orders')
        .select('status')
        .eq('properties.owner_id', currentUser.id);
        
    if (error) {
        console.error('Error loading statistics:', error);
        return;
    }
    
    const stats = {
        total: orders.length,
        approved: orders.filter(o => o.status === 'approved').length,
        rejected: orders.filter(o => o.status === 'rejected').length,
        pending: orders.filter(o => o.status === 'pending').length
    };
    
    // Update stat cards
    document.getElementById('total-orders').textContent = stats.total;
    document.getElementById('approved-orders').textContent = stats.approved;
    document.getElementById('rejected-orders').textContent = stats.rejected;
    document.getElementById('pending-orders').textContent = stats.pending;
    
    // Create chart
    createOrdersChart(stats);
}

// Create orders chart
function createOrdersChart(stats) {
    const ctx = document.getElementById('orders-chart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (window.ordersChart) {
        window.ordersChart.destroy();
    }
    
    window.ordersChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['مقبول', 'مرفوض', 'قيد الانتظار'],
            datasets: [{
                label: 'عدد الطلبات',
                data: [stats.approved, stats.rejected, stats.pending],
                backgroundColor: [
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(255, 206, 86, 0.6)'
                ],
                borderColor: [
                    'rgba(75, 192, 192, 1)',
                    'rgba(255, 99, 132, 1)',
                    'rgba(255, 206, 86, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
}

// Update order status
async function updateOrderStatus(orderId, status) {
    const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);
        
    if (error) {
        console.error('Error updating order status:', error);
        alert('حدث خطأ أثناء تحديث الحالة');
        return;
    }
    
    alert('تم تحديث الحالة بنجاح');
    loadOwnerOrders(); // Reload orders
}

// Show user orders
async function showUserOrders() {
    // Hide other pages
    hideAllPages();
    document.getElementById('user-orders').style.display = 'block';
    
    // Update breadcrumb
    updateBreadcrumb([
        { text: 'الرئيسية', onclick: 'showHomePage()' },
        { text: 'طلباتي' }
    ]);
    
    // Load user orders
    await loadUserOrders();
}

// Load user orders
async function loadUserOrders() {
    const container = document.getElementById('user-orders-container');
    container.innerHTML = '';
    
    const { data: orders, error } = await supabase
        .from('orders')
        .select(`
            id,
            status,
            created_at,
            properties (
                id,
                title,
                price,
                type,
                city,
                district
            )
        `)
        .eq('user_id', currentUser.id);
        
    if (error) {
        console.error('Error loading orders:', error);
        return;
    }
    
    if (orders.length === 0) {
        container.innerHTML = '<p>لم تقم بطلب أي عقار بعد.</p>';
        return;
    }
    
    orders.forEach(order => {
        const orderCard = document.createElement('div');
        orderCard.className = 'order-card';
        orderCard.innerHTML = `
            <h3>${order.properties.title}</h3>
            <p>السعر: ${order.properties.price.toLocaleString()} ريال</p>
            <p>الموقع: ${order.properties.district}، ${order.properties.city}</p>
            <p>تاريخ الطلب: ${new Date(order.created_at).toLocaleDateString()}</p>
            <p>الحالة: ${getStatusText(order.status)}</p>
        `;
        container.appendChild(orderCard);
    });
}

// Place an order for a property
async function placeOrder(propertyId) {
    if (!currentUser) {
        alert('يرجى تسجيل الدخول لطلب العقار');
        showModal('login-modal');
        return;
    }
    
    const { error } = await supabase
        .from('orders')
        .insert([
            { property_id: propertyId, user_id: currentUser.id }
        ]);
        
    if (error) {
        console.error('Error placing order:', error);
        alert('حدث خطأ أثناء تقديم الطلب');
        return;
    }
    
    alert('تم تقديم طلبك بنجاح');
}

// Show add property form
function showAddPropertyForm() {
    document.getElementById('property-form-title').textContent = 'إضافة عقار جديد';
    document.getElementById('property-form').reset();
    document.getElementById('property-id').value = '';
    showModal('property-form-modal');
}

// Show edit property form
async function showEditPropertyForm(propertyId) {
    const { data: property, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .single();
        
    if (error) {
        console.error('Error loading property:', error);
        alert('حدث خطأ أثناء تحميل بيانات العقار');
        return;
    }
    
    document.getElementById('property-form-title').textContent = 'تعديل عقار';
    document.getElementById('property-id').value = property.id;
    document.getElementById('property-title').value = property.title;
    document.getElementById('property-description').value = property.description;
    document.getElementById('property-price').value = property.price;
    document.getElementById('property-type').value = property.type;
    document.getElementById('property-building-type').value = property.property_type;
    document.getElementById('property-area').value = property.area;
    document.getElementById('property-bedrooms').value = property.bedrooms || '';
    document.getElementById('property-bathrooms').value = property.bathrooms || '';
    document.getElementById('property-city').value = property.city;
    document.getElementById('property-district').value = property.district;
    document.getElementById('property-image').value = property.image_urls ? property.image_urls[0] : '';
    document.getElementById('property-images').value = property.image_urls ? property.image_urls.slice(1).join(',') : '';
    document.getElementById('property-features').value = property.features ? property.features.join(',') : '';
    
    showModal('property-form-modal');
}

// Save property (add or update)
document.getElementById('property-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const propertyId = document.getElementById('property-id').value;
    const propertyData = {
        title: document.getElementById('property-title').value,
        description: document.getElementById('property-description').value,
        price: parseFloat(document.getElementById('property-price').value),
        type: document.getElementById('property-type').value,
        property_type: document.getElementById('property-building-type').value,
        area: parseInt(document.getElementById('property-area').value),
        bedrooms: document.getElementById('property-bedrooms').value ? parseInt(document.getElementById('property-bedrooms').value) : null,
        bathrooms: document.getElementById('property-bathrooms').value ? parseInt(document.getElementById('property-bathrooms').value) : null,
        city: document.getElementById('property-city').value,
        district: document.getElementById('property-district').value,
        image_urls: [document.getElementById('property-image').value, ...document.getElementById('property-images').value.split(',').map(url => url.trim()).filter(url => url)],
        features: document.getElementById('property-features').value.split(',').map(feature => feature.trim()).filter(feature => feature)
    };
    
    if (propertyId) {
        // Update existing property
        const { error } = await supabase
            .from('properties')
            .update(propertyData)
            .eq('id', propertyId);
            
        if (error) {
            console.error('Error updating property:', error);
            alert('حدث خطأ أثناء تحديث العقار');
            return;
        }
        
        alert('تم تحديث العقار بنجاح');
    } else {
        // Add new property
        propertyData.owner_id = currentUser.id;
        const { error } = await supabase
            .from('properties')
            .insert([propertyData]);
            
        if (error) {
            console.error('Error adding property:', error);
            alert('حدث خطأ أثناء إضافة العقار');
            return;
        }
        
        alert('تم إضافة العقار بنجاح');
    }
    
    closePropertyFormModal();
    loadOwnerProperties(); // Reload properties
});

// Close property form modal
function closePropertyFormModal() {
    closeModal('property-form-modal');
}

// Delete property
async function deleteProperty(propertyId) {
    if (!confirm('هل أنت متأكد من حذف هذا العقار؟')) {
        return;
    }
    
    const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId);
        
    if (error) {
        console.error('Error deleting property:', error);
        alert('حدث خطأ أثناء حذف العقار');
        return;
    }
    
    alert('تم حذف العقار بنجاح');
    loadOwnerProperties(); // Reload properties
}

// Helper function to get status text in Arabic
function getStatusText(status) {
    switch (status) {
        case 'pending': return 'قيد الانتظار';
        case 'approved': return 'مقبول';
        case 'rejected': return 'مرفوض';
        default: return status;
    }
}
