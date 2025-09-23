// Initialize Supabase with updated configuration
const supabaseUrl = 'https://oanuujxhmxngstijciie.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hbnV1anhobXhuZ3N0aWpjaWllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0NDc2NjAsImV4cCI6MjA3NDAyMzY2MH0.kiv8JpUxtTdDwDJTsMoDTb2vYNWbQMH19lzfYv7Xdzs';

// Create a single Supabase client instance
let supabase;

// Initialize Supabase when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Supabase client
    if (window.supabase) {
        supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
        
        // Check if user is already logged in
        checkUserSession();
        
        // Load home page properties
        loadHomePageProperties();
    } else {
        console.error('Supabase library not loaded');
    }
});

// Track current listing type
let currentListingType = 'sale';
let phoneNumberVisible = false;
let currentPropertyId = null;
let currentUser = null;
let userProfile = null;

// Modal functions
function showModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Function to get user profile from database
async function getUserProfile(userId) {
    if (!supabase) {
        console.error('Supabase client not initialized');
        return null;
    }
    
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        
        if (error) {
            console.error('Error fetching user profile:', error);
            return null;
        }
        
        return data;
    } catch (err) {
        console.error('Error in getUserProfile:', err);
        return null;
    }
}

// Function to update user UI with profile data
async function updateUserUI(user) {
    if (!user) {
        document.getElementById('auth-buttons').style.display = 'flex';
        document.getElementById('user-info').style.display = 'none';
        document.getElementById('dashboard-link').style.display = 'none';
        return;
    }

    // Get user profile from database
    userProfile = await getUserProfile(user.id);
    
    let displayName;
    if (userProfile && userProfile.full_name) {
        displayName = userProfile.full_name;
    } else {
        // Fallback to user metadata or email
        displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'مستخدم';
    }

    document.getElementById('auth-buttons').style.display = 'none';
    document.getElementById('user-info').style.display = 'flex';
    document.getElementById('user-name').textContent = `مرحباً، ${displayName}`;
    
    // Show dashboard link if user is an owner
    if (userProfile && userProfile.role === 'owner') {
        document.getElementById('dashboard-link').style.display = 'block';
    } else {
        document.getElementById('dashboard-link').style.display = 'none';
    }
}

// Check if user is already logged in
async function checkUserSession() {
    if (!supabase) {
        console.error('Supabase client not initialized');
        return;
    }
    
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (session) {
            // User is logged in
            currentUser = session.user;
            
            // Get user profile
            userProfile = await getUserProfile(currentUser.id);
            
            // Update UI
            await updateUserUI(currentUser);
            
            // Ensure user has a profile
            await ensureUserProfile(currentUser);
        }
    } catch (err) {
        console.error('Error checking user session:', err);
    }
}

// Function to ensure user has a profile
async function ensureUserProfile(user) {
    if (!supabase) {
        console.error('Supabase client not initialized');
        return;
    }
    
    try {
        // Check if profile exists
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', user.id)
            .single();
        
        // If profile doesn't exist, create it
        if (profileError && profileError.code === 'PGRST116') {
            const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'مستخدم';
            
            const { error: insertError } = await supabase
                .from('profiles')
                .insert([
                    { 
                        id: user.id, 
                        full_name: fullName, 
                        email: user.email,
                        role: 'user' // Default role is 'user'
                    }
                ]);
            
            if (insertError) {
                console.error('Error creating profile:', insertError);
            } else {
                // Update user profile after creation
                userProfile = await getUserProfile(user.id);
                await updateUserUI(user);
            }
        }
    } catch (err) {
        console.error('Error ensuring user profile:', err);
    }
}

// Function to resend confirmation email
async function resendConfirmationEmail(email) {
    if (!supabase) {
        console.error('Supabase client not initialized');
        return false;
    }
    
    try {
        const { error } = await supabase.auth.resend({
            type: 'signup',
            email: email,
        });
        
        if (error) {
            console.error('Error resending confirmation email:', error);
            return false;
        }
        
        return true;
    } catch (err) {
        console.error('Error:', err);
        return false;
    }
}

// Registration function
document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!supabase) {
        alert('الخدمة غير متوفرة حالياً. يرجى المحاولة مرة أخرى لاحقاً.');
        return;
    }
    
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-password-confirm').value;
    
    if (password !== confirmPassword) {
        alert('كلمتا المرور غير متطابقتين');
        return;
    }
    
    try {
        // Register user
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: name
                }
            }
        });
        
        if (error) {
            alert('خطأ في التسجيل: ' + error.message);
            return;
        }
        
        // Create user profile in the database
        if (data.user) {
            const { error: profileError } = await supabase
                .from('profiles')
                .insert([
                    { 
                        id: data.user.id, 
                        full_name: name, 
                        email: email,
                        role: 'user' // Default role is 'user'
                    }
                ]);
                
            if (profileError) {
                console.error('Error creating profile:', profileError);
            }
        }
        
        alert('تم إنشاء الحساب بنجاح! يرجى تفعيل حسابك عبر البريد الإلكتروني.');
        closeModal('register-modal');
        document.getElementById('register-form').reset();
    } catch (err) {
        alert('حدث خطأ: ' + err.message);
    }
});

// Login function
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!supabase) {
        alert('الخدمة غير متوفرة حالياً. يرجى المحاولة مرة أخرى لاحقاً.');
        return;
    }
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) {
            if (error.message === "Email not confirmed") {
                // Email not confirmed, show option to resend confirmation email
                const resendOption = confirm("بريدك الإلكتروني لم يتم تأكيده بعد. هل ترغب في إعادة إرسال رسالة التأكيد؟");
                if (resendOption) {
                    const success = await resendConfirmationEmail(email);
                    if (success) {
                        alert("تم إعادة إرسال رسالة التأكيد إلى بريدك الإلكتروني. يرجى التحقق من بريدك الوارد.");
                    } else {
                        alert("حدث خطأ أثناء إعادة إرسال رسالة التأكيد. يرجى المحاولة مرة أخرى لاحقاً.");
                    }
                }
                return;
            } else {
                alert('خطأ في تسجيل الدخول: ' + error.message);
                return;
            }
        }
        
        // Check if email is confirmed
        if (data.user && !data.user.email_confirmed_at) {
            const resendOption = confirm("بريدك الإلكتروني لم يتم تأكيده بعد. هل ترغب في إعادة إرسال رسالة التأكيد؟");
            if (resendOption) {
                const success = await resendConfirmationEmail(email);
                if (success) {
                    alert("تم إعادة إرسال رسالة التأكيد إلى بريدك الإلكتروني. يرجى التحقق من بريدك الوارد.");
                } else {
                    alert("حدث خطأ أثناء إعادة إرسال رسالة التأكيد. يرجى المحاولة مرة أخرى لاحقاً.");
                }
            }
            return;
        }
        
        // Update UI
        currentUser = data.user;
        await updateUserUI(currentUser);
        
        // Ensure user has a profile
        await ensureUserProfile(currentUser);
        
        closeModal('login-modal');
        document.getElementById('login-form').reset();
    } catch (err) {
        alert('حدث خطأ: ' + err.message);
    }
});

// Logout function
async function logout() {
    if (!supabase) {
        alert('الخدمة غير متوفرة حالياً. يرجى المحاولة مرة أخرى لاحقاً.');
        return;
    }
    
    try {
        const { error } = await supabase.auth.signOut();
        
        if (error) {
            alert('خطأ في تسجيل الخروج: ' + error.message);
            return;
        }
        
        // Update UI
        currentUser = null;
        userProfile = null;
        await updateUserUI(null);
        
        alert('تم تسجيل الخروج بنجاح');
    } catch (err) {
        alert('حدث خطأ: ' + err.message);
    }
}

// Function to add property to favorites
async function addToFavorites(propertyId) {
    // Check if user is logged in
    if (!currentUser) {
        alert('يرجى تسجيل الدخول لحفظ العقارات المفضلة');
        showModal('login-modal');
        return;
    }
    
    if (!supabase) {
        alert('الخدمة غير متوفرة حالياً. يرجى المحاولة مرة أخرى لاحقاً.');
        return;
    }
    
    try {
        // Ensure user has a profile before adding to favorites
        await ensureUserProfile(currentUser);
        
        const { error } = await supabase
            .from('favorites')
            .insert([
                { user_id: currentUser.id, property_id: propertyId }
            ]);
            
        if (error) {
            // Check if it's a duplicate entry
            if (error.code === '23505') {
                alert('العقار موجود بالفعل في قائمتك المفضلة');
            } else {
                console.error('Error adding to favorites:', error);
                alert('خطأ في إضافة العقار للمفضلة: ' + error.message);
            }
            return;
        }
        
        alert('تم إضافة العقار إلى قائمتك المفضلة');
        updateFavoriteButton(propertyId, true);
    } catch (err) {
        console.error('Error in addToFavorites:', err);
        alert('حدث خطأ: ' + err.message);
    }
}

// Function to remove property from favorites
async function removeFromFavorites(propertyId) {
    // Check if user is logged in
    if (!currentUser) {
        return;
    }
    
    if (!supabase) {
        alert('الخدمة غير متوفرة حالياً. يرجى المحاولة مرة أخرى لاحقاً.');
        return;
    }
    
    try {
        const { error } = await supabase
            .from('favorites')
            .delete()
            .eq('user_id', currentUser.id)
            .eq('property_id', propertyId);
            
        if (error) {
            alert('خطأ في إزالة العقار من المفضلة: ' + error.message);
            return;
        }
        
        alert('تم إزالة العقار من قائمتك المفضلة');
        updateFavoriteButton(propertyId, false);
    } catch (err) {
        alert('حدث خطأ: ' + err.message);
    }
}

// Function to check if property is in user's favorites
async function checkIfFavorite(propertyId) {
    if (!currentUser || !supabase) {
        return false;
    }
    
    try {
        const { data, error } = await supabase
            .from('favorites')
            .select('id')
            .eq('user_id', currentUser.id)
            .eq('property_id', propertyId)
            .maybeSingle(); // Use maybeSingle instead of single to avoid error if not found
            
        if (error) {
            console.error('Error checking favorite:', error);
            return false;
        }
        
        return !!data;
    } catch (err) {
        console.error('Error:', err);
        return false;
    }
}

// Function to update favorite button state
function updateFavoriteButton(propertyId, isFavorite) {
    const favoriteButtons = document.querySelectorAll(`[data-property-id="${propertyId}"] .btn-favorite`);
    const detailFavoriteBtn = document.getElementById('detail-favorite-btn');
    
    favoriteButtons.forEach(button => {
        if (isFavorite) {
            button.innerHTML = '<i class="fas fa-heart"></i> إزالة من المفضلة';
            button.classList.add('active');
            button.onclick = () => removeFromFavorites(propertyId);
        } else {
            button.innerHTML = '<i class="fas fa-heart"></i> حفظ العقار';
            button.classList.remove('active');
            button.onclick = () => addToFavorites(propertyId);
        }
    });
    
    // Update detail page button if it exists
    if (detailFavoriteBtn && currentPropertyId === propertyId) {
        if (isFavorite) {
            detailFavoriteBtn.innerHTML = '<i class="fas fa-heart"></i> إزالة من المفضلة';
            detailFavoriteBtn.classList.add('active');
            detailFavoriteBtn.onclick = () => removeFromFavorites(propertyId);
        } else {
            detailFavoriteBtn.innerHTML = '<i class="fas fa-heart"></i> حفظ العقار';
            detailFavoriteBtn.classList.remove('active');
            detailFavoriteBtn.onclick = () => addToFavorites(propertyId);
        }
    }
}

// Function to show user's favorite properties
async function showFavorites() {
    if (!currentUser) {
        alert('يرجى تسجيل الدخول لعرض عقاراتك المفضلة');
        showModal('login-modal');
        return;
    }
    
    // Hide other pages
    document.getElementById('home-page').style.display = 'none';
    document.getElementById('properties-listing').style.display = 'none';
    document.getElementById('rent-listing').style.display = 'none';
    document.getElementById('property-detail').style.display = 'none';
    document.getElementById('contact-page').style.display = 'none';
    document.getElementById('owner-dashboard').style.display = 'none';
    
    // Show favorites page
    document.getElementById('favorites-page').style.display = 'block';
    
    // Update breadcrumb
    document.getElementById('breadcrumb-list').innerHTML = `
        <li><a onclick="showHomePage()">الرئيسية</a></li>
        <li>عقاراتي المفضلة</li>
    `;
    
    if (!supabase) {
        alert('الخدمة غير متوفرة حالياً. يرجى المحاولة مرة أخرى لاحقاً.');
        return;
    }
    
    try {
        // Get user's favorites with property details
        const { data, error } = await supabase
            .from('favorites')
            .select(`
                id,
                property_id,
                properties (
                    id,
                    title,
                    price,
                    type,
                    area,
                    bedrooms,
                    bathrooms,
                    city,
                    district,
                    image_urls,
                    property_type
                )
            `)
            .eq('user_id', currentUser.id);
            
        if (error) {
            alert('خطأ في جلب العقارات المفضلة: ' + error.message);
            return;
        }
        
        const favoritesGrid = document.getElementById('favorites-grid');
        favoritesGrid.innerHTML = '';
        
        if (!data || data.length === 0) {
            favoritesGrid.innerHTML = `
                <div class="no-results" style="grid-column: 1/-1;">
                    <i class="fas fa-heart"></i>
                    <h3>لا توجد عقارات مفضلة</h3>
                    <p>لم تقم بحفظ أي عقار في قائمتك المفضلة بعد.</p>
                    <button class="btn btn-primary" onclick="showHomePage()" style="margin-top: 15px;">
                        تصفح العقارات
                    </button>
                </div>
            `;
            return;
        }
        
        // Display favorite properties
        data.forEach(fav => {
            if (!fav.properties) return; // Skip if property data is missing
            
            const property = fav.properties;
            const imageUrl = property.image_urls && property.image_urls.length > 0 
                ? property.image_urls[0] 
                : 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80';
            
            const propertyCard = document.createElement('div');
            propertyCard.className = 'property-card';
            propertyCard.setAttribute('data-property-id', property.id);
            propertyCard.innerHTML = `
                <div class="property-image">
                    <img src="${imageUrl}" alt="${property.title}">
                    <div class="property-badge badge-${property.type}">${property.type === 'sale' ? 'للبيع' : 'للإيجار'}</div>
                </div>
                <div class="property-content">
                    <h3 class="property-card-title">${property.title}</h3>
                    <div class="property-card-price price-${property.type}">
                        ${property.price.toLocaleString()} ريال ${property.type === 'rent' ? '/ شهرياً' : ''}
                    </div>
                    <div class="property-card-address">
                        <i class="fas fa-map-marker-alt"></i>
                        ${property.district}، ${property.city}
                    </div>
                    <div class="property-card-features">
                        <div class="property-feature">
                            <i class="fas fa-ruler-combined"></i>
                            <span>${property.area} م²</span>
                        </div>
                        ${property.bedrooms ? `
                        <div class="property-feature">
                            <i class="fas fa-bed"></i>
                            <span>${property.bedrooms} غرف</span>
                        </div>
                        ` : ''}
                        ${property.bathrooms ? `
                        <div class="property-feature">
                            <i class="fas fa-bath"></i>
                            <span>${property.bathrooms} حمامات</span>
                        </div>
                        ` : ''}
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <button class="view-details-btn" onclick="showPropertyDetails('${property.id}', '${property.type}')" style="flex: 1;">
                            عرض التفاصيل
                        </button>
                        <button class="btn-favorite active" onclick="removeFromFavorites('${property.id}')" style="width: auto; padding: 10px 15px;">
                            <i class="fas fa-heart"></i>
                        </button>
                    </div>
                </div>
            `;
            
            favoritesGrid.appendChild(propertyCard);
        });
    } catch (err) {
        alert('حدث خطأ: ' + err.message);
    }
}

// Function to fetch properties from Supabase
async function fetchProperties(type = null) {
    console.log('Fetching properties with type:', type);
    
    if (!supabase) {
        console.error('Supabase client not initialized');
        return [];
    }
    
    try {
        let query = supabase.from('properties').select('*');
        
        if (type) {
            query = query.eq('type', type);
        }
        
        const { data, error } = await query;
        
        if (error) {
            console.error('Error fetching properties:', error);
            return [];
        }
        
        console.log('Fetched properties:', data);
        return data || [];
    } catch (err) {
        console.error('Error in fetchProperties:', err);
        return [];
    }
}

// Function to create property card HTML
function createPropertyCard(property) {
    const imageUrl = property.image_urls && property.image_urls.length > 0 
        ? property.image_urls[0] 
        : 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80';
    
    const propertyCard = document.createElement('div');
    propertyCard.className = 'property-card';
    propertyCard.setAttribute('data-property-id', property.id);
    propertyCard.innerHTML = `
        <div class="property-image">
            <img src="${imageUrl}" alt="${property.title}">
            <div class="property-badge badge-${property.type}">${property.type === 'sale' ? 'للبيع' : 'للإيجار'}</div>
        </div>
        <div class="property-content">
            <h3 class="property-card-title">${property.title}</h3>
            <div class="property-card-price price-${property.type}">
                ${property.price.toLocaleString()} ريال ${property.type === 'rent' ? '/ شهرياً' : ''}
            </div>
            <div class="property-card-address">
                <i class="fas fa-map-marker-alt"></i>
                ${property.district}، ${property.city}
            </div>
            <div class="property-card-features">
                <div class="property-feature">
                    <i class="fas fa-ruler-combined"></i>
                    <span>${property.area} م²</span>
                </div>
                ${property.bedrooms ? `
                <div class="property-feature">
                    <i class="fas fa-bed"></i>
                    <span>${property.bedrooms} غرف</span>
                </div>
                ` : ''}
                ${property.bathrooms ? `
                <div class="property-feature">
                    <i class="fas fa-bath"></i>
                    <span>${property.bathrooms} حمامات</span>
                </div>
                ` : ''}
            </div>
            <div style="display: flex; gap: 10px;">
                <button class="view-details-btn" onclick="showPropertyDetails('${property.id}', '${property.type}')" style="flex: 1;">
                    عرض التفاصيل
                </button>
                <button class="btn-favorite" onclick="addToFavorites('${property.id}')" style="width: auto; padding: 10px 15px;">
                    <i class="fas fa-heart"></i>
                </button>
            </div>
        </div>
    `;
    
    return propertyCard;
}

// Function to show home page
function showHomePage() {
    document.getElementById('home-page').style.display = 'block';
    document.getElementById('properties-listing').style.display = 'none';
    document.getElementById('rent-listing').style.display = 'none';
    document.getElementById('property-detail').style.display = 'none';
    document.getElementById('contact-page').style.display = 'none';
    document.getElementById('favorites-page').style.display = 'none';
    document.getElementById('owner-dashboard').style.display = 'none'; // Hide dashboard
    document.getElementById('search-results').style.display = 'none';
    document.getElementById('sale-search-results').style.display = 'none';
    document.getElementById('rent-search-results').style.display = 'none';
    
    // Reset breadcrumb
    document.getElementById('breadcrumb-list').innerHTML = `
        <li><a onclick="showHomePage()">الرئيسية</a></li>
    `;
    
    // Load properties
    loadHomePageProperties();
}

// Function to load properties for home page
async function loadHomePageProperties() {
    const propertiesGrid = document.getElementById('home-properties-grid');
    propertiesGrid.innerHTML = '';
    
    // Fetch properties from Supabase
    const properties = await fetchProperties();
    
    // Display properties
    if (properties.length === 0) {
        propertiesGrid.innerHTML = `
            <div class="no-properties" style="grid-column: 1/-1; text-align: center; padding: 40px;">
                <i class="fas fa-home" style="font-size: 48px; color: #3498db; margin-bottom: 20px;"></i>
                <h3>لا توجد عقارات متاحة</h3>
                <p>لم يتم العثور على أي عقارات. يرجى إضافة بيانات تجريبية.</p>
                <button class="btn btn-primary" onclick="insertSampleData()" style="margin-top: 15px;">
                    إضافة بيانات تجريبية
                </button>
            </div>
        `;
        return;
    }
    
    properties.forEach(property => {
        const propertyCard = createPropertyCard(property);
        propertiesGrid.appendChild(propertyCard);
    });
}

// Function to show properties listing (for sale)
async function showPropertiesListing() {
    document.getElementById('home-page').style.display = 'none';
    document.getElementById('properties-listing').style.display = 'block';
    document.getElementById('rent-listing').style.display = 'none';
    document.getElementById('property-detail').style.display = 'none';
    document.getElementById('contact-page').style.display = 'none';
    document.getElementById('favorites-page').style.display = 'none';
    document.getElementById('owner-dashboard').style.display = 'none';
    document.getElementById('search-results').style.display = 'none';
    document.getElementById('sale-search-results').style.display = 'none';
    document.getElementById('rent-search-results').style.display = 'none';
    
    currentListingType = 'sale';
    
    // Update breadcrumb
    document.getElementById('breadcrumb-list').innerHTML = `
        <li><a onclick="showHomePage()">الرئيسية</a></li>
        <li><a onclick="showPropertiesListing()">عقارات للبيع</a></li>
    `;
    
    // Load properties
    const propertiesGrid = document.getElementById('sale-properties-grid');
    propertiesGrid.innerHTML = '';
    
    // Fetch properties from Supabase
    const properties = await fetchProperties('sale');
    
    // Display properties
    properties.forEach(property => {
        const propertyCard = createPropertyCard(property);
        propertiesGrid.appendChild(propertyCard);
    });
}

// Function to show rent properties listing
async function showRentListing() {
    document.getElementById('home-page').style.display = 'none';
    document.getElementById('properties-listing').style.display = 'none';
    document.getElementById('rent-listing').style.display = 'block';
    document.getElementById('property-detail').style.display = 'none';
    document.getElementById('contact-page').style.display = 'none';
    document.getElementById('favorites-page').style.display = 'none';
    document.getElementById('owner-dashboard').style.display = 'none';
    document.getElementById('search-results').style.display = 'none';
    document.getElementById('sale-search-results').style.display = 'none';
    document.getElementById('rent-search-results').style.display = 'none';
    
    currentListingType = 'rent';
    
    // Update breadcrumb
    document.getElementById('breadcrumb-list').innerHTML = `
        <li><a onclick="showHomePage()">الرئيسية</a></li>
        <li><a onclick="showRentListing()">عقارات للإيجار</a></li>
    `;
    
    // Load properties
    const propertiesGrid = document.getElementById('rent-properties-grid');
    propertiesGrid.innerHTML = '';
    
    // Fetch properties from Supabase
    const properties = await fetchProperties('rent');
    
    // Display properties
    properties.forEach(property => {
        const propertyCard = createPropertyCard(property);
        propertiesGrid.appendChild(propertyCard);
    });
}

// Function to show contact page
function showContactPage() {
    document.getElementById('home-page').style.display = 'none';
    document.getElementById('properties-listing').style.display = 'none';
    document.getElementById('rent-listing').style.display = 'none';
    document.getElementById('property-detail').style.display = 'none';
    document.getElementById('contact-page').style.display = 'block';
    document.getElementById('favorites-page').style.display = 'none';
    document.getElementById('owner-dashboard').style.display = 'none';
    document.getElementById('search-results').style.display = 'none';
    document.getElementById('sale-search-results').style.display = 'none';
    document.getElementById('rent-search-results').style.display = 'none';
    
    // Update breadcrumb
    document.getElementById('breadcrumb-list').innerHTML = `
        <li><a onclick="showHomePage()">الرئيسية</a></li>
        <li><a onclick="showContactPage()">اتصل بنا</a></li>
    `;
    
    // Initialize contact map
    initContactMap();
}

// Function to filter properties on home page
function filterProperties(type) {
    const tabs = document.querySelectorAll('.category-tab');
    const properties = document.querySelectorAll('#home-properties-grid .property-card');
    
    // Update active tab
    tabs.forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Show/hide properties based on filter
    properties.forEach(property => {
        const propertyType = property.getAttribute('data-type');
        if (type === 'all' || propertyType === type) {
            property.style.display = 'block';
        } else {
            property.style.display = 'none';
        }
    });
}

// Function to perform search on home page
async function performSearch() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase().trim();
    
    if (searchTerm === '') {
        document.getElementById('search-results').style.display = 'none';
        return;
    }
    
    // Fetch properties from Supabase
    const properties = await fetchProperties();
    const resultsContainer = document.getElementById('search-results-container');
    resultsContainer.innerHTML = '';
    
    let foundResults = false;
    
    properties.forEach(property => {
        const title = property.title.toLowerCase();
        const address = `${property.district}، ${property.city}`.toLowerCase();
        const propertyType = (property.property_type || '').toLowerCase();
        
        // Check if search term matches any property attribute
        if (title.includes(searchTerm) || 
            address.includes(searchTerm) || 
            propertyType.includes(searchTerm)) {
            
            // Create property card and add to results
            const propertyCard = createPropertyCard(property);
            resultsContainer.appendChild(propertyCard);
            foundResults = true;
        }
    });
    
    // Show search results section
    document.getElementById('search-results').style.display = 'block';
    
    // Show no results message if no properties found
    if (!foundResults) {
        resultsContainer.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <h3>لا توجد نتائج</h3>
                <p>لم يتم العثور على عقارات تطابق بحثك. يرجى تجربة كلمات أخرى.</p>
            </div>
        `;
    }
    
    // Scroll to search results
    document.getElementById('search-results').scrollIntoView({ behavior: 'smooth' });
}

// Function to perform search on sale properties page
async function performSaleSearch() {
    const searchTerm = document.getElementById('sale-search-input').value.toLowerCase().trim();
    
    if (searchTerm === '') {
        document.getElementById('sale-search-results').style.display = 'none';
        // Show all properties if search term is empty
        showPropertiesListing();
        return;
    }
    
    // Fetch properties from Supabase
    const properties = await fetchProperties('sale');
    const resultsContainer = document.getElementById('sale-search-results-container');
    resultsContainer.innerHTML = '';
    
    let foundResults = false;
    
    properties.forEach(property => {
        const title = property.title.toLowerCase();
        const address = `${property.district}، ${property.city}`.toLowerCase();
        const propertyType = (property.property_type || '').toLowerCase();
        
        // Check if search term matches any property attribute
        if (title.includes(searchTerm) || 
            address.includes(searchTerm) || 
            propertyType.includes(searchTerm)) {
            
            // Create property card and add to results
            const propertyCard = createPropertyCard(property);
            resultsContainer.appendChild(propertyCard);
            foundResults = true;
        }
    });
    
    // Show search results section
    document.getElementById('sale-search-results').style.display = 'block';
    
    // Show no results message if no properties found
    if (!foundResults) {
        resultsContainer.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <h3>لا توجد نتائج</h3>
                <p>لم يتم العثور على عقارات تطابق بحثك. يرجى تجربة كلمات أخرى.</p>
            </div>
        `;
    }
    
    // Scroll to search results
    document.getElementById('sale-search-results').scrollIntoView({ behavior: 'smooth' });
}

// Function to perform search on rent properties page
async function performRentSearch() {
    const searchTerm = document.getElementById('rent-search-input').value.toLowerCase().trim();
    
    if (searchTerm === '') {
        document.getElementById('rent-search-results').style.display = 'none';
        // Show all properties if search term is empty
        showRentListing();
        return;
    }
    
    // Fetch properties from Supabase
    const properties = await fetchProperties('rent');
    const resultsContainer = document.getElementById('rent-search-results-container');
    resultsContainer.innerHTML = '';
    
    let foundResults = false;
    
    properties.forEach(property => {
        const title = property.title.toLowerCase();
        const address = `${property.district}، ${property.city}`.toLowerCase();
        const propertyType = (property.property_type || '').toLowerCase();
        
        // Check if search term matches any property attribute
        if (title.includes(searchTerm) || 
            address.includes(searchTerm) || 
            propertyType.includes(searchTerm)) {
            
            // Create property card and add to results
            const propertyCard = createPropertyCard(property);
            resultsContainer.appendChild(propertyCard);
            foundResults = true;
        }
    });
    
    // Show search results section
    document.getElementById('rent-search-results').style.display = 'block';
    
    // Show no results message if no properties found
    if (!foundResults) {
        resultsContainer.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <h3>لا توجد نتائج</h3>
                <p>لم يتم العثور على عقارات تطابق بحثك. يرجى تجربة كلمات أخرى.</p>
            </div>
        `;
    }
    
    // Scroll to search results
    document.getElementById('rent-search-results').scrollIntoView({ behavior: 'smooth' });
}

// Function to show property details and hide listing
async function showPropertyDetails(propertyId, propertyType) {
    document.getElementById('home-page').style.display = 'none';
    document.getElementById('properties-listing').style.display = 'none';
    document.getElementById('rent-listing').style.display = 'none';
    document.getElementById('property-detail').style.display = 'block';
    document.getElementById('contact-page').style.display = 'none';
    document.getElementById('favorites-page').style.display = 'none';
    document.getElementById('owner-dashboard').style.display = 'none';
    document.getElementById('search-results').style.display = 'none';
    document.getElementById('sale-search-results').style.display = 'none';
    document.getElementById('rent-search-results').style.display = 'none';
    
    currentPropertyId = propertyId;
    
    if (!supabase) {
        alert('الخدمة غير متوفرة حالياً. يرجى المحاولة مرة أخرى لاحقاً.');
        return;
    }
    
    // Fetch property from Supabase
    const { data: property, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .maybeSingle(); // Use maybeSingle instead of single to avoid error if not found
        
    if (error || !property) {
        console.error('Error fetching property:', error || 'Property not found');
        alert('عذراً، لم يتم العثور على العقار المطلوب');
        goBackToListing();
        return;
    }
    
    // Update property details
    document.getElementById('detail-title').textContent = property.title;
    document.getElementById('detail-price').textContent = `${property.price.toLocaleString()} ريال ${property.type === 'rent' ? '/ شهرياً' : ''}`;
    document.getElementById('detail-address').textContent = `${property.district}، ${property.city}، المملكة العربية السعودية`;
    document.getElementById('detail-description').textContent = property.description || 'لا يوجد وصف متاح';
    
    // Update owner information
    document.getElementById('owner-name').textContent = property.owner_name || 'غير محدد';
    document.getElementById('owner-phone').textContent = property.owner_phone || 'غير متوفر';
    document.getElementById('owner-email').textContent = property.owner_email || 'غير متوفر';
    document.getElementById('owner-avatar-img').src = property.owner_avatar || 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80';
    
    // Reset phone number visibility
    phoneNumberVisible = false;
    document.getElementById('owner-phone').style.filter = 'blur(4px)';
    document.getElementById('owner-phone').style.userSelect = 'none';
    
    // Update badge
    const badgeElement = document.getElementById('detail-badge');
    if (propertyType === 'sale') {
        badgeElement.textContent = 'للبيع';
        badgeElement.className = 'image-badge badge-sale-detail';
        document.getElementById('detail-price').className = 'property-price price-sale-detail';
    } else {
        badgeElement.textContent = 'للإيجار';
        badgeElement.className = 'image-badge badge-rent-detail';
        document.getElementById('detail-price').className = 'property-price price-rent-detail';
    }
    
    // Update property features
    const featuresContainer = document.querySelector('.property-features');
    featuresContainer.innerHTML = `
        <div class="feature">
            <i class="fas fa-ruler-combined"></i>
            <div>
                <span class="feature-value">${property.area} م²</span>
                <span class="feature-label">المساحة</span>
            </div>
        </div>
        ${property.bedrooms ? `
        <div class="feature">
            <i class="fas fa-bed"></i>
            <div>
                <span class="feature-value">${property.bedrooms}</span>
                <span class="feature-label">غرف نوم</span>
            </div>
        </div>
        ` : ''}
        ${property.bathrooms ? `
        <div class="feature">
            <i class="fas fa-bath"></i>
            <div>
                <span class="feature-value">${property.bathrooms}</span>
                <span class="feature-label">حمامات</span>
            </div>
        </div>
        ` : ''}
        ${property.parking ? `
        <div class="feature">
            <i class="fas fa-car"></i>
            <div>
                <span class="feature-value">${property.parking}</span>
                <span class="feature-label">مواقف سيارات</span>
            </div>
        </div>
        ` : ''}
        ${property.floors ? `
        <div class="feature">
            <i class="fas fa-building"></i>
            <div>
                <span class="feature-value">${property.floors}</span>
                <span class="feature-label">عدد الأدوار</span>
            </div>
        </div>
        ` : ''}
        ${property.year_built ? `
        <div class="feature">
            <i class="fas fa-calendar-alt"></i>
            <div>
                <span class="feature-value">${property.year_built}</span>
                <span class="feature-label">سنة البناء</span>
            </div>
        </div>
        ` : ''}
    `;
    
    // Update amenities
    const amenitiesContainer = document.querySelector('.amenities');
    amenitiesContainer.innerHTML = '';
    
    if (property.features && Array.isArray(property.features) && property.features.length > 0) {
        property.features.forEach(feature => {
            const amenity = document.createElement('div');
            amenity.className = 'amenity';
            amenity.innerHTML = `
                <i class="fas fa-check-circle"></i>
                <span>${feature}</span>
            `;
            amenitiesContainer.appendChild(amenity);
        });
    } else {
        amenitiesContainer.innerHTML = '<p>لا توجد مرافق متوفرة</p>';
    }
    
    // Update gallery images
    const mainImage = document.getElementById('main-image');
    const thumbnails = document.querySelectorAll('.thumbnail img');
    
    if (property.image_urls && Array.isArray(property.image_urls) && property.image_urls.length > 0) {
        mainImage.src = property.image_urls[0];
        
        // Update thumbnails
        for (let i = 0; i < Math.min(3, property.image_urls.length); i++) {
            if (thumbnails[i]) {
                thumbnails[i].src = property.image_urls[i];
                thumbnails[i].parentElement.setAttribute('onclick', `changeImage('${property.image_urls[i]}')`);
            }
        }
    }
    
    // Check if property is in user's favorites
    const isFavorite = await checkIfFavorite(propertyId);
    updateFavoriteButton(propertyId, isFavorite);
    
    // Update breadcrumb
    if (propertyType === 'sale') {
        document.getElementById('breadcrumb-list').innerHTML = `
            <li><a onclick="showHomePage()">الرئيسية</a></li>
            <li><a onclick="showPropertiesListing()">عقارات للبيع</a></li>
            <li>تفاصيل العقار</li>
        `;
    } else {
        document.getElementById('breadcrumb-list').innerHTML = `
            <li><a onclick="showHomePage()">الرئيسية</a></li>
            <li><a onclick="showRentListing()">عقارات للإيجار</a></li>
            <li>تفاصيل العقار</li>
        `;
    }
    
    // Initialize map
    initMap();
}

// Function to go back to listing
function goBackToListing() {
    if (currentListingType === 'sale') {
        showPropertiesListing();
    } else if (currentListingType === 'rent') {
        showRentListing();
    } else {
        showHomePage();
    }
}

// Function to change main image in gallery
function changeImage(src) {
    document.getElementById('main-image').src = src;
}

// Function to show/hide phone number
function showPhoneNumber() {
    const phoneElement = document.getElementById('owner-phone');
    if (!phoneNumberVisible) {
        phoneElement.style.filter = 'none';
        phoneElement.style.userSelect = 'text';
        phoneNumberVisible = true;
    }
}

// Function to open contact modal
function openContactModal() {
    document.getElementById('contact-modal').style.display = 'flex';
}

// Function to close contact modal
function closeContactModal() {
    document.getElementById('contact-modal').style.display = 'none';
}

// Initialize map for property details
function initMap() {
    // Check if map container exists
    if (document.getElementById('property-map')) {
        // Create a map centered on Riyadh
        var map = L.map('property-map').setView([24.7136, 46.6753], 15);
        
        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        
        // Add a marker for the property
        L.marker([24.7136, 46.6753])
            .addTo(map)
            .bindPopup('عقار في الرياض')
            .openPopup();
    }
}

// Initialize map for contact page
function initContactMap() {
    // Check if map container exists
    if (document.getElementById('contact-map')) {
        // Create a map centered on Riyadh
        var map = L.map('contact-map').setView([24.7136, 46.6753], 13);
        
        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        
        // Add a marker for the office
        L.marker([24.7136, 46.6753])
            .addTo(map)
            .bindPopup('مكتب عقارك الرئيسي')
            .openPopup();
    }
}

// Close modal if clicked outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}

// Add event listener for Enter key on search inputs
document.getElementById('search-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        performSearch();
    }
});

document.getElementById('sale-search-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        performSaleSearch();
    }
});

document.getElementById('rent-search-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        performRentSearch();
    }
});

// Owner Dashboard Functions

// Show owner dashboard
async function showOwnerDashboard() {
    // Check if user is logged in
    if (!currentUser) {
        alert('يرجى تسجيل الدخول أولاً');
        showModal('login-modal');
        return;
    }
    
    // Check if user profile is loaded
    if (!userProfile) {
        userProfile = await getUserProfile(currentUser.id);
    }
    
    // Check if user is an owner
    if (!userProfile || userProfile.role !== 'owner') {
        alert('لا تملك صلاحية الوصول إلى لوحة التحكم');
        showHomePage();
        return;
    }
    
    // Hide other pages
    document.getElementById('home-page').style.display = 'none';
    document.getElementById('properties-listing').style.display = 'none';
    document.getElementById('rent-listing').style.display = 'none';
    document.getElementById('property-detail').style.display = 'none';
    document.getElementById('contact-page').style.display = 'none';
    document.getElementById('favorites-page').style.display = 'none';
    document.getElementById('search-results').style.display = 'none';
    document.getElementById('sale-search-results').style.display = 'none';
    document.getElementById('rent-search-results').style.display = 'none';
    
    // Show owner dashboard
    document.getElementById('owner-dashboard').style.display = 'block';
    
    // Update breadcrumb
    document.getElementById('breadcrumb-list').innerHTML = `
        <li><a onclick="showHomePage()">الرئيسية</a></li>
        <li>لوحة التحكم</li>
    `;
    
    // Load properties
    loadOwnerProperties();
    
    // Load agents
    loadOwnerAgents();
    
    // Load reports
    loadOwnerReports();
}

// Show dashboard section
function showDashboardSection(section) {
    // Hide all sections
    document.querySelectorAll('.dashboard-section').forEach(sec => {
        sec.style.display = 'none';
    });
    
    // Remove active class from all sidebar items
    document.querySelectorAll('.sidebar li').forEach(item => {
        item.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(`dashboard-${section}`).style.display = 'block';
    
    // Add active class to clicked sidebar item
    event.target.closest('li').classList.add('active');
    
    // Load data for the section
    if (section === 'properties') {
        loadOwnerProperties();
    } else if (section === 'agents') {
        loadOwnerAgents();
    } else if (section === 'messages') {
        loadConversations();
    } else if (section === 'reports') {
        loadOwnerReports();
    }
}

// Load owner properties
async function loadOwnerProperties() {
    const tbody = document.getElementById('properties-tbody');
    tbody.innerHTML = '';
    
    if (!supabase) {
        console.error('Supabase client not initialized');
        return;
    }
    
    try {
        const { data, error } = await supabase
            .from('properties')
            .select('*')
            .eq('owner_id', currentUser.id);
            
        if (error) {
            console.error('Error loading properties:', error);
            return;
        }
        
        if (!data || data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 20px;">
                        لا توجد عقارات مضافة بعد
                    </td>
                </tr>
            `;
            return;
        }
        
        data.forEach(property => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${property.title}</td>
                <td>${property.price.toLocaleString()} ريال</td>
                <td>${property.city}</td>
                <td>
                    <span class="status-badge status-${property.status}">
                        ${property.status === 'available' ? 'متاح' : 'مباع'}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-primary btn-small" onclick="editProperty('${property.id}')">
                            تعديل
                        </button>
                        <button class="btn btn-outline btn-small" onclick="togglePropertyStatus('${property.id}', '${property.status}')">
                            ${property.status === 'available' ? 'تعيين كمباع' : 'تعيين كمتاح'}
                        </button>
                        <button class="btn btn-outline btn-small" onclick="deleteProperty('${property.id}')">
                            حذف
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error('Error:', err);
    }
}

// Show add property form
function showAddPropertyForm() {
    showModal('add-property-modal');
}

// Add property form submission
document.getElementById('add-property-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!supabase) {
        alert('الخدمة غير متوفرة حالياً. يرجى المحاولة مرة أخرى لاحقاً.');
        return;
    }
    
    const propertyData = {
        title: document.getElementById('property-title').value,
        price: parseFloat(document.getElementById('property-price').value),
        city: document.getElementById('property-city').value,
        district: document.getElementById('property-district').value,
        area: parseInt(document.getElementById('property-area').value),
        bedrooms: parseInt(document.getElementById('property-bedrooms').value) || null,
        bathrooms: parseInt(document.getElementById('property-bathrooms').value) || null,
        description: document.getElementById('property-description').value,
        type: document.getElementById('property-type').value,
        status: document.getElementById('property-status').value,
        owner_id: currentUser.id
    };
    
    try {
        const { data, error } = await supabase
            .from('properties')
            .insert([propertyData]);
            
        if (error) {
            console.error('Error adding property:', error);
            alert('خطأ في إضافة العقار: ' + error.message);
            return;
        }
        
        // Success - close modal and reload properties
        closeModal('add-property-modal');
        loadOwnerProperties();
        alert('تم إضافة العقار بنجاح');
        
        // Reset form
        document.getElementById('add-property-form').reset();
    } catch (err) {
        console.error('Error:', err);
        alert('حدث خطأ: ' + err.message);
    }
});

// Function to edit a property
async function editProperty(propertyId) {
    if (!supabase) {
        alert('الخدمة غير متوفرة حالياً. يرجى المحاولة مرة أخرى لاحقاً.');
        return;
    }
    
    try {
        // Fetch property data
        const { data: property, error } = await supabase
            .from('properties')
            .select('*')
            .eq('id', propertyId)
            .single();
            
        if (error) {
            console.error('Error fetching property:', error);
            alert('خطأ في جلب بيانات العقار');
            return;
        }
        
        // Populate form with property data
        document.getElementById('edit-property-id').value = property.id;
        document.getElementById('edit-property-title').value = property.title;
        document.getElementById('edit-property-price').value = property.price;
        document.getElementById('edit-property-city').value = property.city;
        document.getElementById('edit-property-district').value = property.district;
        document.getElementById('edit-property-area').value = property.area;
        document.getElementById('edit-property-bedrooms').value = property.bedrooms || '';
        document.getElementById('edit-property-bathrooms').value = property.bathrooms || '';
        document.getElementById('edit-property-description').value = property.description || '';
        document.getElementById('edit-property-type').value = property.type;
        document.getElementById('edit-property-status').value = property.status;
        
        // Show edit modal
        showModal('edit-property-modal');
    } catch (err) {
        console.error('Error:', err);
        alert('حدث خطأ: ' + err.message);
    }
}

// Edit property form submission
document.getElementById('edit-property-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!supabase) {
        alert('الخدمة غير متوفرة حالياً. يرجى المحاولة مرة أخرى لاحقاً.');
        return;
    }
    
    const propertyId = document.getElementById('edit-property-id').value;
    
    const propertyData = {
        title: document.getElementById('edit-property-title').value,
        price: parseFloat(document.getElementById('edit-property-price').value),
        city: document.getElementById('edit-property-city').value,
        district: document.getElementById('edit-property-district').value,
        area: parseInt(document.getElementById('edit-property-area').value),
        bedrooms: parseInt(document.getElementById('edit-property-bedrooms').value) || null,
        bathrooms: parseInt(document.getElementById('edit-property-bathrooms').value) || null,
        description: document.getElementById('edit-property-description').value,
        type: document.getElementById('edit-property-type').value,
        status: document.getElementById('edit-property-status').value
    };
    
    try {
        const { error } = await supabase
            .from('properties')
            .update(propertyData)
            .eq('id', propertyId);
            
        if (error) {
            console.error('Error updating property:', error);
            alert('خطأ في تحديث العقار: ' + error.message);
            return;
        }
        
        // Success - close modal and reload properties
        closeModal('edit-property-modal');
        loadOwnerProperties();
        alert('تم تحديث العقار بنجاح');
    } catch (err) {
        console.error('Error:', err);
        alert('حدث خطأ: ' + err.message);
    }
});

// Function to toggle property status
async function togglePropertyStatus(propertyId, currentStatus) {
    if (!supabase) {
        alert('الخدمة غير متوفرة حالياً. يرجى المحاولة مرة أخرى لاحقاً.');
        return;
    }
    
    const newStatus = currentStatus === 'available' ? 'sold' : 'available';
    
    try {
        const { error } = await supabase
            .from('properties')
            .update({ status: newStatus })
            .eq('id', propertyId);
            
        if (error) {
            console.error('Error updating property status:', error);
            alert('خطأ في تحديث حالة العقار: ' + error.message);
            return;
        }
        
        // Reload properties
        loadOwnerProperties();
        alert(`تم تحديث حالة العقار إلى ${newStatus === 'available' ? 'متاح' : 'مباع'} بنجاح`);
    } catch (err) {
        console.error('Error:', err);
        alert('حدث خطأ: ' + err.message);
    }
}

// Function to delete a property
async function deleteProperty(propertyId) {
    if (!confirm('هل أنت متأكد من حذف هذا العقار؟ لا يمكن التراجع عن هذا الإجراء.')) {
        return;
    }
    
    if (!supabase) {
        alert('الخدمة غير متوفرة حالياً. يرجى المحاولة مرة أخرى لاحقاً.');
        return;
    }
    
    try {
        const { error } = await supabase
            .from('properties')
            .delete()
            .eq('id', propertyId);
            
        if (error) {
            console.error('Error deleting property:', error);
            alert('خطأ في حذف العقار: ' + error.message);
            return;
        }
        
        // Reload properties
        loadOwnerProperties();
        alert('تم حذف العقار بنجاح');
    } catch (err) {
        console.error('Error:', err);
        alert('حدث خطأ: ' + err.message);
    }
}

// Function to load owner agents
async function loadOwnerAgents() {
    const tbody = document.getElementById('agents-tbody');
    tbody.innerHTML = '';
    
    if (!supabase) {
        console.error('Supabase client not initialized');
        return;
    }
    
    try {
        const { data, error } = await supabase
            .from('agents')
            .select('*')
            .eq('owner_id', currentUser.id);
            
        if (error) {
            console.error('Error loading agents:', error);
            return;
        }
        
        if (!data || data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; padding: 20px;">
                        لا توجد وكلاء مضافين بعد
                    </td>
                </tr>
            `;
            return;
        }
        
        data.forEach(agent => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${agent.name}</td>
                <td>${agent.phone}</td>
                <td>${agent.email}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-primary btn-small" onclick="editAgent('${agent.id}')">
                            تعديل
                        </button>
                        <button class="btn btn-outline btn-small" onclick="deleteAgent('${agent.id}')">
                            حذف
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error('Error:', err);
    }
}

// Function to edit an agent
async function editAgent(agentId) {
    if (!supabase) {
        alert('الخدمة غير متوفرة حالياً. يرجى المحاولة مرة أخرى لاحقاً.');
        return;
    }
    
    try {
        // Fetch agent data
        const { data: agent, error } = await supabase
            .from('agents')
            .select('*')
            .eq('id', agentId)
            .single();
            
        if (error) {
            console.error('Error fetching agent:', error);
            alert('خطأ في جلب بيانات الوكيل');
            return;
        }
        
        // Populate form with agent data
        document.getElementById('edit-agent-id').value = agent.id;
        document.getElementById('edit-agent-name').value = agent.name;
        document.getElementById('edit-agent-phone').value = agent.phone;
        document.getElementById('edit-agent-email').value = agent.email;
        
        // Show edit modal
        showModal('edit-agent-modal');
    } catch (err) {
        console.error('Error:', err);
        alert('حدث خطأ: ' + err.message);
    }
}

// Edit agent form submission
document.getElementById('edit-agent-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!supabase) {
        alert('الخدمة غير متوفرة حالياً. يرجى المحاولة مرة أخرى لاحقاً.');
        return;
    }
    
    const agentId = document.getElementById('edit-agent-id').value;
    
    const agentData = {
        name: document.getElementById('edit-agent-name').value,
        phone: document.getElementById('edit-agent-phone').value,
        email: document.getElementById('edit-agent-email').value
    };
    
    try {
        const { error } = await supabase
            .from('agents')
            .update(agentData)
            .eq('id', agentId);
            
        if (error) {
            console.error('Error updating agent:', error);
            alert('خطأ في تحديث الوكيل: ' + error.message);
            return;
        }
        
        // Success - close modal and reload agents
        closeModal('edit-agent-modal');
        loadOwnerAgents();
        alert('تم تحديث الوكيل بنجاح');
    } catch (err) {
        console.error('Error:', err);
        alert('حدث خطأ: ' + err.message);
    }
});

// Function to delete an agent
async function deleteAgent(agentId) {
    if (!confirm('هل أنت متأكد من حذف هذا الوكيل؟')) {
        return;
    }
    
    if (!supabase) {
        alert('الخدمة غير متوفرة حالياً. يرجى المحاولة مرة أخرى لاحقاً.');
        return;
    }
    
    try {
        const { error } = await supabase
            .from('agents')
            .delete()
            .eq('id', agentId);
            
        if (error) {
            console.error('Error deleting agent:', error);
            alert('خطأ في حذف الوكيل: ' + error.message);
            return;
        }
        
        // Reload agents
        loadOwnerAgents();
        alert('تم حذف الوكيل بنجاح');
    } catch (err) {
        console.error('Error:', err);
        alert('حدث خطأ: ' + err.message);
    }
}

// Function to load owner reports
async function loadOwnerReports() {
    const reportsContainer = document.getElementById('reports-container');
    reportsContainer.innerHTML = '<div class="loading">جاري تحميل التقارير...</div>';
    
    if (!supabase) {
        reportsContainer.innerHTML = '<div class="error">الخدمة غير متوفرة حالياً</div>';
        return;
    }
    
    try {
        // Get properties count
        const { data: properties, error: propertiesError } = await supabase
            .from('properties')
            .select('*')
            .eq('owner_id', currentUser.id);
            
        if (propertiesError) {
            console.error('Error loading properties:', propertiesError);
            reportsContainer.innerHTML = '<div class="error">خطأ في تحميل البيانات</div>';
            return;
        }
        
        // Get favorites count
        const { data: favorites, error: favoritesError } = await supabase
            .from('favorites')
            .select(`
                property_id,
                properties (
                    id,
                    title
                )
            `)
            .in('property_id', properties.map(p => p.id));
            
        if (favoritesError) {
            console.error('Error loading favorites:', favoritesError);
        }
        
        // Calculate statistics
        const totalProperties = properties ? properties.length : 0;
        const availableProperties = properties ? properties.filter(p => p.status === 'available').length : 0;
        const soldProperties = properties ? properties.filter(p => p.status === 'sold').length : 0;
        const totalFavorites = favorites ? favorites.length : 0;
        
        // Calculate total value
        const totalValue = properties ? properties.reduce((sum, p) => sum + p.price, 0) : 0;
        
        // Create report HTML
        reportsContainer.innerHTML = `
            <div class="reports-grid">
                <div class="report-card">
                    <h3>إجمالي العقارات</h3>
                    <div class="report-value">${totalProperties}</div>
                </div>
                <div class="report-card">
                    <h3>العقارات المتاحة</h3>
                    <div class="report-value">${availableProperties}</div>
                </div>
                <div class="report-card">
                    <h3>العقارات المباعة</h3>
                    <div class="report-value">${soldProperties}</div>
                </div>
                <div class="report-card">
                    <h3>القيمة الإجمالية</h3>
                    <div class="report-value">${totalValue.toLocaleString()} ريال</div>
                </div>
                <div class="report-card">
                    <h3>الإضافات للمفضلة</h3>
                    <div class="report-value">${totalFavorites}</div>
                </div>
            </div>
            
            <div class="report-details">
                <h3>تفاصيل العقارات</h3>
                <div class="report-table-container">
                    <table class="report-table">
                        <thead>
                            <tr>
                                <th>العقار</th>
                                <th>الحالة</th>
                                <th>السعر</th>
                                <th>المدينة</th>
                                <th>الإضافات للمفضلة</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${properties && properties.length > 0 ? properties.map(property => {
                                const propertyFavorites = favorites ? favorites.filter(f => f.property_id === property.id).length : 0;
                                return `
                                    <tr>
                                        <td>${property.title}</td>
                                        <td>
                                            <span class="status-badge status-${property.status}">
                                                ${property.status === 'available' ? 'متاح' : 'مباع'}
                                            </span>
                                        </td>
                                        <td>${property.price.toLocaleString()} ريال</td>
                                        <td>${property.city}</td>
                                        <td>${propertyFavorites}</td>
                                    </tr>
                                `;
                            }).join('') : '<tr><td colspan="5" style="text-align: center;">لا توجد بيانات</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    } catch (err) {
        console.error('Error:', err);
        reportsContainer.innerHTML = '<div class="error">حدث خطأ في تحميل التقارير</div>';
    }
}

// Function to load conversations
async function loadConversations() {
    const conversationsContainer = document.getElementById('conversations-container');
    conversationsContainer.innerHTML = '<div class="loading">جاري تحميل المحادثات...</div>';
    
    if (!supabase) {
        conversationsContainer.innerHTML = '<div class="error">الخدمة غير متوفرة حالياً</div>';
        return;
    }
    
    try {
        const { data, error } = await supabase
            .from('conversations')
            .select(`
                *,
                users (
                    full_name,
                    email
                )
            `)
            .eq('owner_id', currentUser.id)
            .order('created_at', { ascending: false });
            
        if (error) {
            console.error('Error loading conversations:', error);
            conversationsContainer.innerHTML = '<div class="error">خطأ في تحميل المحادثات</div>';
            return;
        }
        
        if (!data || data.length === 0) {
            conversationsContainer.innerHTML = `
                <div class="no-conversations">
                    <i class="fas fa-comments"></i>
                    <h3>لا توجد محادثات</h3>
                    <p>لم تتلق أي رسائل بعد.</p>
                </div>
            `;
            return;
        }
        
        conversationsContainer.innerHTML = '';
        
        data.forEach(conversation => {
            const conversationDiv = document.createElement('div');
            conversationDiv.className = 'conversation';
            conversationDiv.innerHTML = `
                <div class="conversation-header">
                    <div class="conversation-user">
                        <img src="https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80" alt="${conversation.users.full_name}" class="conversation-avatar">
                        <div>
                            <div class="conversation-name">${conversation.users.full_name}</div>
                            <div class="conversation-email">${conversation.users.email}</div>
                        </div>
                    </div>
                    <div class="conversation-date">${new Date(conversation.created_at).toLocaleDateString()}</div>
                </div>
                <div class="conversation-message">
                    ${conversation.message}
                </div>
                <div class="conversation-actions">
                    <button class="btn btn-primary btn-small" onclick="viewConversation('${conversation.id}')">
                        عرض المحادثة
                    </button>
                    <button class="btn btn-outline btn-small" onclick="deleteConversation('${conversation.id}')">
                        حذف
                    </button>
                </div>
            `;
            conversationsContainer.appendChild(conversationDiv);
        });
    } catch (err) {
        console.error('Error:', err);
        conversationsContainer.innerHTML = '<div class="error">حدث خطأ في تحميل المحادثات</div>';
    }
}

// Function to view conversation
function viewConversation(conversationId) {
    alert(`عرض المحادثة: ${conversationId}`);
    // TODO: Implement view conversation functionality
}

// Function to delete conversation
async function deleteConversation(conversationId) {
    if (!confirm('هل أنت متأكد من حذف هذه المحادثة؟')) {
        return;
    }
    
    if (!supabase) {
        alert('الخدمة غير متوفرة حالياً. يرجى المحاولة مرة أخرى لاحقاً.');
        return;
    }
    
    try {
        const { error } = await supabase
            .from('conversations')
            .delete()
            .eq('id', conversationId);
            
        if (error) {
            console.error('Error deleting conversation:', error);
            alert('خطأ في حذف المحادثة: ' + error.message);
            return;
        }
        
        // Reload conversations
        loadConversations();
        alert('تم حذف المحادثة بنجاح');
    } catch (err) {
        console.error('Error:', err);
        alert('حدث خطأ: ' + err.message);
    }
}

// Function to show add agent form
function showAddAgentForm() {
    showModal('add-agent-modal');
}

// Add agent form submission
document.getElementById('add-agent-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!supabase) {
        alert('الخدمة غير متوفرة حالياً. يرجى المحاولة مرة أخرى لاحقاً.');
        return;
    }
    
    const agentData = {
        name: document.getElementById('agent-name').value,
        phone: document.getElementById('agent-phone').value,
        email: document.getElementById('agent-email').value,
        owner_id: currentUser.id
    };
    
    try {
        const { data, error } = await supabase
            .from('agents')
            .insert([agentData]);
            
        if (error) {
            console.error('Error adding agent:', error);
            alert('خطأ في إضافة الوكيل: ' + error.message);
            return;
        }
        
        // Success - close modal and reload agents
        closeModal('add-agent-modal');
        loadOwnerAgents();
        alert('تم إضافة الوكيل بنجاح');
        
        // Reset form
        document.getElementById('add-agent-form').reset();
    } catch (err) {
        console.error('Error:', err);
        alert('حدث خطأ: ' + err.message);
    }
});

// Function to insert sample data
async function insertSampleData() {
    if (!supabase) {
        alert('الخدمة غير متوفرة حالياً. يرجى المحاولة مرة أخرى لاحقاً.');
        return;
    }
    
    // Sample properties
    const sampleProperties = [
        {
            title: 'فيلا فاخرة في حي النخيل',
            price: 2500000,
            city: 'الرياض',
            district: 'حي النخيل',
            area: 400,
            bedrooms: 5,
            bathrooms: 4,
            description: 'فيلا فاخرة جداً في حي النخيل، تتكون من طابقين مع حديقة ومرآب',
            type: 'sale',
            status: 'available',
            owner_id: currentUser?.id || '00000000-0000-0000-0000-000000000000',
            image_urls: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80'],
            property_type: 'فيلا',
            owner_name: 'أحمد محمد',
            owner_phone: '0501234567',
            owner_email: 'ahmed@example.com',
            owner_avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
            features: ['مسبح', 'حديقة', 'مرآب', 'غرفة خادمة'],
            parking: 2,
            floors: 2,
            year_built: 2020
        },
        {
            title: 'شقة عصرية في شارع التحلية',
            price: 800000,
            city: 'جدة',
            district: 'التحلية',
            area: 150,
            bedrooms: 3,
            bathrooms: 2,
            description: 'شقة عصرية في موقع مميز، قريبة من جميع الخدمات',
            type: 'sale',
            status: 'available',
            owner_id: currentUser?.id || '00000000-0000-0000-0000-000000000000',
            image_urls: ['https://images.unsplash.com/photo-1570129477492-45c003edd2be?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80'],
            property_type: 'شقة',
            owner_name: 'محمد علي',
            owner_phone: '0559876543',
            owner_email: 'mohammed@example.com',
            owner_avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
            features: ['تكييف مركزي', 'مصعد', 'أمن', 'كاميرات مراقبة'],
            parking: 1,
            floors: 1,
            year_built: 2019
        },
        {
            title: 'شقة للإيجار في حي الملز',
            price: 35000,
            city: 'الرياض',
            district: 'الملز',
            area: 120,
            bedrooms: 2,
            bathrooms: 1,
            description: 'شقة للإيجار في حي الملز، مناسبة للعائلات',
            type: 'rent',
            status: 'available',
            owner_id: currentUser?.id || '00000000-0000-0000-0000-000000000000',
            image_urls: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80'],
            property_type: 'شقة',
            owner_name: 'فاطمة أحمد',
            owner_phone: '0511223344',
            owner_email: 'fatima@example.com',
            owner_avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
            features: ['أمن', 'موقف سيارة', 'مطبخ مجهز'],
            parking: 1,
            floors: 1,
            year_built: 2018
        }
    ];

    // Sample agents
    const sampleAgents = [
        {
            name: 'سعد عبدالله',
            phone: '0501112233',
            email: 'saad@example.com',
            owner_id: currentUser?.id || '00000000-0000-0000-0000-000000000000'
        },
        {
            name: 'نورة محمد',
            phone: '0554445566',
            email: 'nora@example.com',
            owner_id: currentUser?.id || '00000000-0000-0000-0000-000000000000'
        }
    ];

    // Sample conversations
    const sampleConversations = [
        {
            owner_id: currentUser?.id || '00000000-0000-0000-0000-000000000000',
            user_id: '11111111-1111-1111-1111-111111111111',
            message: 'أهلاً، أود الاستفسار عن الفيلة المعروضة في حي النخيل',
            created_at: new Date().toISOString()
        },
        {
            owner_id: currentUser?.id || '00000000-0000-0000-0000-000000000000',
            user_id: '22222222-2222-2222-2222-222222222222',
            message: 'هل الشقة في شارع التحلية لا تزال متاحة؟',
            created_at: new Date().toISOString()
        }
    ];

    try {
        // Insert properties
        const { data: propertiesData, error: propertiesError } = await supabase
            .from('properties')
            .insert(sampleProperties);
            
        if (propertiesError) {
            console.error('Error inserting sample properties:', propertiesError);
        } else {
            console.log('Sample properties inserted:', propertiesData);
        }

        // Insert agents
        const { data: agentsData, error: agentsError } = await supabase
            .from('agents')
            .insert(sampleAgents);
            
        if (agentsError) {
            console.error('Error inserting sample agents:', agentsError);
        } else {
            console.log('Sample agents inserted:', agentsData);
        }

        // Insert conversations
        const { data: conversationsData, error: conversationsError } = await supabase
            .from('conversations')
            .insert(sampleConversations);
            
        if (conversationsError) {
            console.error('Error inserting sample conversations:', conversationsError);
        } else {
            console.log('Sample conversations inserted:', conversationsData);
        }

        alert('تم إضافة البيانات التجريبية بنجاح! يرجى تحديث الصفحة.');
    } catch (err) {
        console.error('Error inserting sample data:', err);
        alert('حدث خطأ أثناء إضافة البيانات التجريبية: ' + err.message);
    }
}
