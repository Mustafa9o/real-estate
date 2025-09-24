// Initialize Supabase with updated configuration
const supabaseUrl = 'https://oanuujxhmxngstijciie.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hbnV1anhobXhuZ3N0aWpjaWllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0NDc2NjAsImV4cCI6MjA3NDAyMzY2MH0.kiv8JpUxtTdDwDJTsMoDTb2vYNWbQMH19lzfYv7Xdzs';

// Create a single Supabase client instance
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// Track current listing type
let currentListingType = 'sale';
let phoneNumberVisible = false;
let currentPropertyId = null;
let currentUser = null;
let userProfile = null;
let isOwner = false;

// Modal functions
function showModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Function to get user profile from database
async function getUserProfile(userId) {
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
    
    // Update navigation based on user role
    await updateNavigation();
}

// Update navigation based on user role
async function updateNavigation() {
    if (!currentUser) {
        document.querySelectorAll('.nav-owner, .nav-user').forEach(el => el.style.display = 'none');
        return;
    }

    // Get user profile
    const profile = await getUserProfile(currentUser.id);
    
    if (profile && profile.is_owner) {
        isOwner = true;
        document.querySelectorAll('.nav-owner').forEach(el => el.style.display = 'block');
        document.querySelectorAll('.nav-user').forEach(el => el.style.display = 'none');
    } else {
        isOwner = false;
        document.querySelectorAll('.nav-owner').forEach(el => el.style.display = 'none');
        document.querySelectorAll('.nav-user').forEach(el => el.style.display = 'block');
    }
}

// Check if user is already logged in
async function checkUserSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (session) {
        // User is logged in
        currentUser = session.user;
        await updateUserUI(currentUser);
        
        // Ensure user has a profile
        await ensureUserProfile(currentUser);
    }
}

// Function to ensure user has a profile
async function ensureUserProfile(user) {
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
                        email: user.email 
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
    
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-password-confirm').value;
    const isOwner = document.getElementById('register-is-owner').checked;
    
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
                        is_owner: isOwner
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
    try {
        const { error } = await supabase.auth.signOut();
        
        if (error) {
            alert('خطأ في تسجيل الخروج: ' + error.message);
            return;
        }
        
        // Update UI
        currentUser = null;
        userProfile = null;
        isOwner = false;
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
    if (!currentUser) {
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
    hideAllPages();
    document.getElementById('favorites-page').style.display = 'block';
    
    // Update breadcrumb
    updateBreadcrumb([
        { text: 'الرئيسية', onclick: 'showHomePage()' },
        { text: 'عقاراتي المفضلة' }
    ]);
    
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
    let query = supabase.from('properties').select('*');
    
    if (type) {
        query = query.eq('type', type);
    }
    
    const { data, error } = await query;
    
    if (error) {
        console.error('Error fetching properties:', error);
        return [];
    }
    
    return data || [];
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
    hideAllPages();
    document.getElementById('home-page').style.display = 'block';
    document.getElementById('search-results').style.display = 'none';
    document.getElementById('sale-search-results').style.display = 'none';
    document.getElementById('rent-search-results').style.display = 'none';
    
    // Reset breadcrumb
    updateBreadcrumb([
        { text: 'الرئيسية', onclick: 'showHomePage()' }
    ]);
    
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
    properties.forEach(property => {
        const propertyCard = createPropertyCard(property);
        propertiesGrid.appendChild(propertyCard);
    });
}

// Function to show properties listing (for sale)
async function showPropertiesListing() {
    hideAllPages();
    document.getElementById('properties-listing').style.display = 'block';
    document.getElementById('search-results').style.display = 'none';
    document.getElementById('sale-search-results').style.display = 'none';
    document.getElementById('rent-search-results').style.display = 'none';
    
    currentListingType = 'sale';
    
    // Update breadcrumb
    updateBreadcrumb([
        { text: 'الرئيسية', onclick: 'showHomePage()' },
        { text: 'عقارات للبيع', onclick: 'showPropertiesListing()' }
    ]);
    
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
    hideAllPages();
    document.getElementById('rent-listing').style.display = 'block';
    document.getElementById('search-results').style.display = 'none';
    document.getElementById('sale-search-results').style.display = 'none';
    document.getElementById('rent-search-results').style.display = 'none';
    
    currentListingType = 'rent';
    
    // Update breadcrumb
    updateBreadcrumb([
        { text: 'الرئيسية', onclick: 'showHomePage()' },
        { text: 'عقارات للإيجار', onclick: 'showRentListing()' }
    ]);
    
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
    hideAllPages();
    document.getElementById('contact-page').style.display = 'block';
    document.getElementById('search-results').style.display = 'none';
    document.getElementById('sale-search-results').style.display = 'none';
    document.getElementById('rent-search-results').style.display = 'none';
    
    // Update breadcrumb
    updateBreadcrumb([
        { text: 'الرئيسية', onclick: 'showHomePage()' },
        { text: 'اتصل بنا', onclick: 'showContactPage()' }
    ]);
    
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
    hideAllPages();
    document.getElementById('property-detail').style.display = 'block';
    
    currentPropertyId = propertyId;
    
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
    
    // Check if the current user is the owner
    const isPropertyOwner = currentUser && property.owner_id === currentUser.id;
    
    // Add order button if not the owner
    if (!isPropertyOwner) {
        const orderButton = document.createElement('button');
        orderButton.className = 'btn btn-primary';
        orderButton.textContent = 'طلب هذا العقار';
        orderButton.onclick = () => placeOrder(propertyId);
        
        // Insert the button in the property content area
        const propertyContent = document.querySelector('.property-content > div:first-child');
        propertyContent.appendChild(orderButton);
    }
    
    // Update breadcrumb
    if (propertyType === 'sale') {
        updateBreadcrumb([
            { text: 'الرئيسية', onclick: 'showHomePage()' },
            { text: 'عقارات للبيع', onclick: 'showPropertiesListing()' },
            { text: 'تفاصيل العقار' }
        ]);
    } else {
        updateBreadcrumb([
            { text: 'الرئيسية', onclick: 'showHomePage()' },
            { text: 'عقارات للإيجار', onclick: 'showRentListing()' },
            { text: 'تفاصيل العقار' }
        ]);
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

// Initialize the page
window.onload = function() {
    // Show home page by default
    showHomePage();
    
    // Check if user is logged in
    checkUserSession();
    
    // Create sample data if needed
    createSampleDataIfNeeded();
    
    // Set up auth state change listener
    supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN') {
            currentUser = session.user;
            await updateUserUI(currentUser);
            
            // Ensure user has a profile
            await ensureUserProfile(currentUser);
        } else if (event === 'SIGNED_OUT') {
            currentUser = null;
            userProfile = null;
            isOwner = false;
            await updateUserUI(null);
        } else if (event === 'USER_UPDATED') {
            // This event is triggered when email is confirmed
            if (session && session.user && session.user.email_confirmed_at) {
                currentUser = session.user;
                await updateUserUI(currentUser);
                alert('تم تأكيد بريدك الإلكتروني بنجاح! يمكنك الآن تسجيل الدخول.');
            }
        }
    });
}

// Helper function to hide all pages
function hideAllPages() {
    document.getElementById('home-page').style.display = 'none';
    document.getElementById('properties-listing').style.display = 'none';
    document.getElementById('rent-listing').style.display = 'none';
    document.getElementById('property-detail').style.display = 'none';
    document.getElementById('contact-page').style.display = 'none';
    document.getElementById('favorites-page').style.display = 'none';
    document.getElementById('owner-dashboard').style.display = 'none';
    document.getElementById('user-orders').style.display = 'none';
    document.getElementById('search-results').style.display = 'none';
    document.getElementById('sale-search-results').style.display = 'none';
    document.getElementById('rent-search-results').style.display = 'none';
}

// Helper function to update breadcrumb
function updateBreadcrumb(items) {
    const breadcrumbList = document.getElementById('breadcrumb-list');
    breadcrumbList.innerHTML = '';
    
    items.forEach((item, index) => {
        const li = document.createElement('li');
        if (index < items.length - 1) {
            li.innerHTML = `<a onclick="${item.onclick}">${item.text}</a>`;
        } else {
            li.textContent = item.text;
        }
        breadcrumbList.appendChild(li);
    });
}
