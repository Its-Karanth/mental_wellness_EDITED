# User Registration with Phone and Address Fields

## Overview
The Mental Wellness App now includes phone number and address fields in the user registration form. These fields are optional and allow users to provide additional contact and location information during registration. The information is then displayed in the admin panel for better user management.

## Features Implemented

### 1. **Enhanced Registration Form**
- **Phone Number Field**: Optional field for user contact information
- **Address Field**: Optional field for user location information
- **Admin Panel Display**: Phone and address information shown in admin dashboard

### 2. **Field Characteristics**
- **Optional Fields**: Users can register without providing phone or address
- **Partial Information**: Users can provide either phone, address, or both
- **Data Persistence**: Information is saved to database and displayed in admin panel
- **Admin Only**: Phone and address fields are only shown for regular user registration (not admin registration)

## Technical Implementation

### **Frontend Changes**

#### **Registration Form Fields**
```jsx
{!isAdminRoute && (
  <>
    <div className="mb-3">
      <label htmlFor="phone" className="form-label">
        Phone Number
      </label>
      <input
        type="tel"
        className="form-control"
        id="phone"
        value={formData.phone}
        onChange={(e) =>
          setFormData({ ...formData, phone: e.target.value })
        }
        placeholder="Enter your phone number"
      />
    </div>
    <div className="mb-3">
      <label htmlFor="address" className="form-label">
        Address
      </label>
      <textarea
        className="form-control"
        id="address"
        value={formData.address}
        onChange={(e) =>
          setFormData({ ...formData, address: e.target.value })
        }
        rows={3}
        placeholder="Enter your address"
      />
    </div>
  </>
)}
```

#### **Form Data Structure**
```javascript
const [formData, setFormData] = useState({
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  phone: "",        // New field
  address: "",      // New field
  role: isAdminRoute ? "admin" : "user",
});
```

#### **API Request**
```javascript
await axios.post("http://localhost:5000/api/auth/register", {
  name: formData.name,
  email: formData.email,
  password: formData.password,
  phone: formData.phone,      // New field
  address: formData.address,  // New field
  role: formData.role,
});
```

### **Backend Changes**

#### **Registration Endpoint**
```javascript
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, phone, address, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered.' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ 
      name, 
      email, 
      password: hashedPassword, 
      phone: phone || '',      // Save phone (empty string if not provided)
      address: address || '',  // Save address (empty string if not provided)
      role 
    });
    await user.save();
    res.status(201).json({ message: 'User registered successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});
```

### **Admin Panel Display**

#### **User Management Table**
The admin panel already includes columns for phone and address:

```jsx
<table className="table table-bordered">
  <thead>
    <tr>
      <th>Name</th>
      <th>Email</th>
      <th>Phone</th>        {/* Phone column */}
      <th>Address</th>      {/* Address column */}
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    {users.map((u) => (
      <tr key={u._id}>
        <td>{u.name}</td>
        <td>{u.email}</td>
        <td>{u.phone || "N/A"}</td>      {/* Display phone or "N/A" */}
        <td>{u.address || "N/A"}</td>    {/* Display address or "N/A" */}
        <td>
          <button
            className="btn btn-danger btn-sm"
            onClick={() => handleDeleteUser(u._id)}
          >
            Delete
          </button>
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

## User Experience

### **Registration Flow**

#### **Step 1: User Registration Form**
- User fills out name, email, password, confirm password
- **Optional**: User can enter phone number
- **Optional**: User can enter address
- User clicks "Create Account"

#### **Step 2: Data Processing**
- Backend validates required fields (name, email, password)
- Phone and address are saved as provided or as empty strings
- User account is created in database

#### **Step 3: Admin Panel Display**
- Admin can view all users in the "Regular Users" section
- Phone and address columns show the provided information
- If fields are empty, "N/A" is displayed

### **Field Validation**

#### **Required Fields**
- **Name**: Required
- **Email**: Required, must be unique
- **Password**: Required

#### **Optional Fields**
- **Phone**: Optional, can be left empty
- **Address**: Optional, can be left empty

#### **Validation Rules**
- Phone and address are saved as-is (no format validation)
- Empty fields are saved as empty strings
- Admin panel displays "N/A" for empty fields

## Example Scenarios

### **Scenario 1: Complete Information**
```
User Registration:
- Name: John Doe
- Email: john@example.com
- Password: password123
- Phone: +1-555-123-4567
- Address: 123 Main Street, City, State 12345

Admin Panel Display:
- Name: John Doe
- Email: john@example.com
- Phone: +1-555-123-4567
- Address: 123 Main Street, City, State 12345
```

### **Scenario 2: Partial Information**
```
User Registration:
- Name: Jane Smith
- Email: jane@example.com
- Password: password123
- Phone: +1-555-987-6543
- Address: (left empty)

Admin Panel Display:
- Name: Jane Smith
- Email: jane@example.com
- Phone: +1-555-987-6543
- Address: N/A
```

### **Scenario 3: Minimal Information**
```
User Registration:
- Name: Bob Wilson
- Email: bob@example.com
- Password: password123
- Phone: (left empty)
- Address: (left empty)

Admin Panel Display:
- Name: Bob Wilson
- Email: bob@example.com
- Phone: N/A
- Address: N/A
```

## Testing

### **Automated Tests**
Run the user registration field test:
```bash
cd backend && node test_user_fields_simple.js
```

### **Manual Testing**
1. **Complete Registration**: Test with all fields filled
2. **Partial Registration**: Test with only phone or only address
3. **Minimal Registration**: Test with no optional fields
4. **Admin Panel Verification**: Check that data appears correctly

### **Test Results**
The test suite verifies:
- ✅ Phone number field in registration
- ✅ Address field in registration
- ✅ Optional fields (can register without them)
- ✅ Partial information support (phone only)
- ✅ Partial information support (address only)
- ✅ User login after registration
- ✅ Data persistence

## Benefits

### **For Users**
- **Flexibility**: Can provide as much or as little information as desired
- **Contact Options**: Multiple ways for system to contact them
- **Location Information**: Can provide address for in-person services

### **For Admins**
- **Better User Management**: More complete user profiles
- **Contact Information**: Can reach users via phone if needed
- **Location Data**: Can provide location-based services
- **User Insights**: Better understanding of user demographics

### **For System**
- **Enhanced Data**: More complete user profiles
- **Better Support**: Multiple contact methods for support
- **Future Features**: Foundation for location-based features

## Database Schema

### **User Model**
The User model already includes phone and address fields:

```javascript
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'therapist', 'admin'], default: 'user' },
  phone: { type: String },        // Optional phone field
  address: { type: String },      // Optional address field
  specialization: { type: String },
  availability: [
    {
      day: String,
      start: String,
      end: String,
    }
  ]
});
```

## Future Enhancements

### **Planned Features**
1. **Phone Validation**: Format validation for phone numbers
2. **Address Validation**: Address format validation
3. **Location Services**: Map integration for addresses
4. **Contact Preferences**: User preferences for contact methods
5. **Bulk Operations**: Admin tools for managing user contact info

### **UI Improvements**
1. **Phone Formatting**: Auto-format phone numbers
2. **Address Autocomplete**: Address suggestions
3. **Contact Cards**: Visual contact information display
4. **Export Features**: Export user contact information

## Conclusion

The phone and address fields provide:

- **📱 Contact Information**: Multiple ways to reach users
- **📍 Location Data**: Address information for services
- **🎯 Flexibility**: Optional fields for user convenience
- **👨‍💼 Admin Insights**: Better user management capabilities
- **📊 Enhanced Data**: More complete user profiles

These fields enhance the user registration experience while providing valuable information for admin management and future system features. 